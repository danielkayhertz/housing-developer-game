import { useGameStore } from '../game/state';
import { computeTdc, computeNoi, computeSupportableDebt, computeGap, weightedAvgAmi, isLihtcEligible } from '../game/proForma';
import { getNeighborhood } from '../data/neighborhoods';
import { rentAtAmi } from '../data/amiRents';
import { Header } from '../components/Header';
import { CharacterBubble } from '../components/CharacterBubble';
import { marcusLines } from '../data/characters';
import { AmiBand, FinishLevel } from '../game/types';

export function ProForma() {
  const project = useGameStore((s) => s.project);
  const proForma = useGameStore((s) => s.proForma);
  const costEscalation = useGameStore((s) => s.costEscalation);
  const setAmiUnit = useGameStore((s) => s.setAmiUnit);
  const setFinishLevel = useGameStore((s) => s.setFinishLevel);
  const advancePhase = useGameStore((s) => s.advancePhase);
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
  const debt = computeSupportableDebt({
    noi,
    dscr: 1.20,
    annualRate: 0.065,
    amortYears: 30,
    ltv: 0.80,
    stabilizedValue,
  });
  const gap = computeGap({ tdc: tdcTotal, costEscalation: 0, supportableDebt: debt.amount });
  const avgAmi = weightedAvgAmi(proForma.amiBreakdown);
  const eligible = isLihtcEligible(proForma.amiBreakdown);

  const totalAffordable = Object.values(proForma.amiBreakdown).reduce((a, b) => a + b, 0);

  function onAdvance() {
    tickMonths(12);
    advancePhase();
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
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
            {[30, 50, 60, 80].map((ami) => {
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
          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">TDC bottom-up</div>
            <div className="text-sm mt-2 space-y-1 tabular">
              <div className="flex justify-between"><span>Land · ${n.landCostPerUnit.toLocaleString()}/u</span><b>${(tdcParts.land / 1000).toFixed(0)}k</b></div>
              <div className="flex justify-between"><span>Hard construction</span><b>${(tdcParts.hard / 1_000_000).toFixed(1)}M</b></div>
              <div className="flex justify-between"><span>Soft (27%)</span><b>${(tdcParts.soft / 1_000_000).toFixed(1)}M</b></div>
              <div className="flex justify-between"><span>Contingency (5%)</span><b>${(tdcParts.contingency / 1_000_000).toFixed(1)}M</b></div>
              {costEscalation > 0 && (
                <div className="flex justify-between text-caution"><span>Cost escalation</span><b>+${(costEscalation / 1_000_000).toFixed(1)}M</b></div>
              )}
              <div className="flex justify-between border-t border-line pt-1"><span><b>Total</b></span><b>${(tdcTotal / 1_000_000).toFixed(1)}M</b></div>
            </div>
          </div>

          <div className="bg-panel border border-line rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-accent font-bold">NOI &amp; supportable debt</div>
            <div className="text-sm mt-2 space-y-1 tabular">
              <div className="flex justify-between"><span>NOI</span><b>${(noi / 1000).toFixed(0)}k</b></div>
              <div className="flex justify-between"><span>Stabilized value (NOI ÷ 6%)</span><b>${(stabilizedValue / 1_000_000).toFixed(1)}M</b></div>
              <div className="flex justify-between"><span>Supportable debt <span className="text-caution text-xs">({debt.binding}-limited)</span></span><b>${(debt.amount / 1_000_000).toFixed(1)}M</b></div>
            </div>
          </div>

          <div className="bg-gap text-white p-4 rounded-lg">
            <div className="text-xs uppercase tracking-wider opacity-80">Gap to close in the capital stack</div>
            <div className="text-3xl font-bold tabular">${(gap / 1_000_000).toFixed(1)}M</div>
            <div className="text-xs opacity-80 mt-1">{((gap / tdcTotal) * 100).toFixed(0)}% of TDC. Normal for affordable.</div>
          </div>

          <CharacterBubble characterId="marcus" line={debt.binding === 'DSCR' ? marcusLines.dscrLimited : marcusLines.ltvLimited} />

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
