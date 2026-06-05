import { useGameStore } from '../game/state';
import { computeTdc, computeNoi, computeSupportableDebt, computeGap, weightedAvgAmi, isLihtcEligible } from '../game/proForma';
import { getNeighborhood } from '../data/neighborhoods';
import { rentAtAmi } from '../data/amiRents';
import { Header } from '../components/Header';
import { CharacterIntroCard } from '../components/CharacterIntroCard';
import { marcusLines, janelleLines, characters } from '../data/characters';
import { computeLihtcScore, estimatedAwardProbability } from '../game/capitalStack';
import { AmiBand, FinishLevel, BuildingType, HARD_COST_PER_UNIT, LAND_COST_BUILDING_MULTIPLIER, SOFT_COST_RATIO, CONTINGENCY_RATIO } from '../game/types';

function titleCase(t: BuildingType): string {
  return { walkup: 'Walk-up', midrise: 'Mid-rise', larger: 'Larger' }[t];
}

export function ProForma() {
  const project = useGameStore((s) => s.project);
  const proForma = useGameStore((s) => s.proForma);
  const costEscalation = useGameStore((s) => s.costEscalation);
  const setAmiUnit = useGameStore((s) => s.setAmiUnit);
  const setFinishLevel = useGameStore((s) => s.setFinishLevel);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const retreatPhase = useGameStore((s) => s.retreatPhase);
  const tickMonths = useGameStore((s) => s.tickMonths);

  if (!project.neighborhood) return null;
  const n = getNeighborhood(project.neighborhood);

  const tdcParts = computeTdc({
    neighborhood: project.neighborhood,
    units: project.units,
    buildingType: project.buildingType,
    finishLevel: proForma.finishLevel,
  });
  const tdcTotal = tdcParts.total + costEscalation;
  const noi = computeNoi({
    amiBreakdown: proForma.amiBreakdown,
    marketUnits: proForma.marketUnits,
    marketRent: n.marketRentPerUnit,
    opexRatio: proForma.opexRatio,
    vacancyRatio: 0.07,
  });
  const stabilizedValue = noi / 0.06;
  const dscrRequired = 1.20;
  const annualRate = 0.065;
  const amortYears = 30;
  const debt = computeSupportableDebt({
    noi,
    dscr: dscrRequired,
    annualRate,
    amortYears,
    ltv: 0.80,
    stabilizedValue,
  });
  const cashForDebtService = noi / dscrRequired;
  const k = (() => {
    const i = annualRate / 12;
    const nMonths = amortYears * 12;
    return 12 * (i / (1 - Math.pow(1 + i, -nMonths)));
  })();
  const gap = computeGap({ tdc: tdcTotal, costEscalation: 0, supportableDebt: debt.amount });
  const avgAmi = weightedAvgAmi(proForma.amiBreakdown);
  const eligible = isLihtcEligible(proForma.amiBreakdown);
  const projectedQapScore = computeLihtcScore({
    weightedAvgAmi: avgAmi,
    hasCboPartner: project.hasCboPartner,
    hasLeverageCommitments: true,
    neighborhood: project.neighborhood,
    intent: 'all-affordable',
    marketUnits: 0,
  });
  const projectedQapOdds = estimatedAwardProbability(projectedQapScore);
  const projectedQapLine =
    projectedQapScore < 50 ? janelleLines.qapScoreLow :
    projectedQapScore < 75 ? janelleLines.qapScoreMid :
    janelleLines.qapScoreHigh;

  const totalAffordable = Object.values(proForma.amiBreakdown).reduce((a, b) => a + b, 0);

  function onAdvance() {
    tickMonths(12);
    advancePhase();
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={retreatPhase}
        className="text-muted text-sm mb-4 hover:text-ink inline-block"
      >
        ← Back
      </button>
      <Header />
      <h2 className="text-2xl mt-6 mb-4">Pro Forma</h2>
      <div className="grid grid-cols-2 gap-4">
        {/* LEFT — levers */}
        <div className="space-y-3">
          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">Lever 1 — Finishings &amp; design</div>
            <div className="flex gap-2 mt-2">
              {(['basic', 'standard', 'elevated'] as FinishLevel[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFinishLevel(f)}
                  className={`flex-1 py-2 text-xs rounded border-2 ${
                    proForma.finishLevel === f ? 'bg-accent text-white border-accent' : 'border-line hover:border-accent'
                  }`}
                >
                  {f === 'basic' && 'Basic (−10% hard)'}
                  {f === 'standard' && 'Standard'}
                  {f === 'elevated' && 'Elevated (+15%)'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">Lever 2 — Affordable AMI breakdown</div>
            <div className="text-xs text-muted mt-1">
              Total affordable: {totalAffordable} · target {project.units}
            </div>
            {[30, 60, 80].map((ami) => {
              const a = ami as AmiBand;
              return (
                <div key={ami} className="mt-2">
                  <div className="flex justify-between text-xs">
                    <span><b>{ami}% AMI</b> · ${rentAtAmi(a)}/mo</span>
                    <span><b>{proForma.amiBreakdown[a]} units</b></span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={project.units}
                    value={proForma.amiBreakdown[a]}
                    onChange={(e) => setAmiUnit(a, parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              );
            })}
            <div className={`mt-3 p-2 rounded text-xs ${eligible ? 'bg-bg' : 'bg-gap text-white'}`}>
              Weighted avg: <b>{avgAmi.toFixed(0)}% AMI</b> · {eligible ? 'LIHTC-eligible ✓' : 'LIHTC ineligible — average exceeds 60%'}
            </div>
          </div>
        </div>

        {/* RIGHT — math */}
        <div className="space-y-3">
          <CharacterIntroCard
            avatar={characters.marcus.emoji}
            name={characters.marcus.name}
            role={characters.marcus.role}
            body={<p>{marcusLines.intro}</p>}
            footer={
              <div className="bg-panel border border-line rounded p-2 text-xs tabular">
                <div className="text-muted uppercase tracking-wider mb-1">DSCR walk-through</div>
                <div className="flex justify-between"><span>NOI (annual)</span><b>${(noi / 1000).toFixed(0)}k</b></div>
                <div className="flex justify-between"><span>÷ Required DSCR ({dscrRequired.toFixed(2)})</span><b>${(cashForDebtService / 1000).toFixed(0)}k</b></div>
                <div className="flex justify-between"><span>÷ Annual mortgage constant ({k.toFixed(4)})</span><b>${(debt.amount / 1_000_000).toFixed(1)}M</b></div>
                <div className="border-t border-line mt-1 pt-1 flex justify-between"><b>Supportable loan</b><b>${(debt.amount / 1_000_000).toFixed(1)}M</b></div>
                <div className="text-muted mt-2 italic">{marcusLines.walkthroughClosing(debt.amount, tdcTotal)}</div>
              </div>
            }
          />
          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">TDC bottom-up</div>
            <div className="text-sm mt-2 space-y-1 tabular">
              <div className="flex justify-between">
                <span>
                  Hard cost
                  <span className="text-xs text-muted ml-2">
                    ({titleCase(project.buildingType)} · ${(HARD_COST_PER_UNIT[project.buildingType] / 1000).toFixed(0)}k × {project.units}u)
                  </span>
                </span>
                <b>${(tdcParts.hard / 1_000_000).toFixed(1)}M</b>
              </div>
              <div className="flex justify-between">
                <span>
                  Land
                  <span className="text-xs text-muted ml-2">
                    ({n.name} · ${(n.landCostPerUnit / 1000).toFixed(0)}k × {LAND_COST_BUILDING_MULTIPLIER[project.buildingType].toFixed(2)} × {project.units}u)
                  </span>
                </span>
                <b>${(tdcParts.land / 1000).toFixed(0)}k</b>
              </div>
              <div className="flex justify-between">
                <span>
                  Soft costs
                  <span className="text-xs text-muted ml-2">({(SOFT_COST_RATIO * 100).toFixed(0)}% of hard)</span>
                </span>
                <b>${(tdcParts.soft / 1_000_000).toFixed(1)}M</b>
              </div>
              <div className="flex justify-between">
                <span>
                  Contingency
                  <span className="text-xs text-muted ml-2">({(CONTINGENCY_RATIO * 100).toFixed(0)}% of hard)</span>
                </span>
                <b>${(tdcParts.contingency / 1_000_000).toFixed(1)}M</b>
              </div>
              {costEscalation > 0 && (
                <div className="flex justify-between text-caution"><span>Cost escalation</span><b>+${(costEscalation / 1_000_000).toFixed(1)}M</b></div>
              )}
              <div className="flex justify-between border-t border-line pt-1"><span><b>Total</b></span><b>${(tdcTotal / 1_000_000).toFixed(1)}M</b></div>
            </div>
          </div>

          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">NOI &amp; supportable debt</div>
            <div className="text-sm mt-2 space-y-1 tabular">
              <div className="flex justify-between"><span>NOI (annual)</span><b>${(noi / 1000).toFixed(0)}k</b></div>
              <div className="flex justify-between"><span>Supportable debt <span className="text-caution text-xs">({debt.binding}-limited)</span></span><b>${(debt.amount / 1_000_000).toFixed(1)}M</b></div>
            </div>
          </div>

          <div className="bg-gap text-white p-4 rounded-lg">
            <div className="text-xs uppercase tracking-wider opacity-80">Gap to close in the capital stack</div>
            <div className="text-3xl font-bold tabular">${(gap / 1_000_000).toFixed(1)}M</div>
            <div className="text-xs opacity-80 mt-1">{((gap / tdcTotal) * 100).toFixed(0)}% of TDC. Normal for affordable.</div>
          </div>

          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">{characters.janelle.emoji} 9% LIHTC — projected QAP score</div>
            <div className="mt-2 flex justify-between items-baseline">
              <div className="text-3xl font-bold tabular">{projectedQapScore} <span className="text-muted text-base">/ 100</span></div>
              <div className="text-right">
                <div className="text-xs uppercase text-muted tracking-wider">Est. award probability</div>
                <div className="text-lg font-bold tabular">{(projectedQapOdds * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div className="text-xs text-muted italic mt-1">Projection assumes you assemble a typical stack on the next screen.</div>
            <div className="text-xs text-muted mt-2"><b>{characters.janelle.emoji} {characters.janelle.name}:</b> "{projectedQapLine}"</div>
          </div>

          <button
            onClick={onAdvance}
            disabled={!eligible || totalAffordable !== project.units}
            className="w-full bg-accent text-white py-3 rounded-lg font-bold disabled:opacity-40"
          >
            {totalAffordable !== project.units ? `Distribute all ${project.units} units` : 'On to the capital stack →'}
          </button>
        </div>
      </div>
    </div>
  );
}
