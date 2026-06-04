import { useState } from 'react';
import { useGameStore } from '../game/state';
import { sources, getSource } from '../data/sources';
import { computeTdc, computeNoi, computeSupportableDebt, weightedAvgAmi } from '../game/proForma';
import { complexityPenalty, computeLihtcScore, estimatedAwardProbability, totalCommitted } from '../game/capitalStack';
import { getNeighborhood } from '../data/neighborhoods';
import { Header } from '../components/Header';
import { StackBar } from '../components/StackBar';
import { SourceCard } from '../components/SourceCard';
import { CharacterBubble } from '../components/CharacterBubble';
import { janelleLines } from '../data/characters';
import { SourceId, COMPLEXITY_PENALTY_THRESHOLD } from '../game/types';

export function CapitalStack() {
  const project = useGameStore((s) => s.project);
  const proForma = useGameStore((s) => s.proForma);
  const costEscalation = useGameStore((s) => s.costEscalation);
  const stack = useGameStore((s) => s.stack);
  const awardSource = useGameStore((s) => s.awardSource);
  const submitLihtc = useGameStore((s) => s.submitLihtc);
  const tickMonths = useGameStore((s) => s.tickMonths);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const [showLihtcDecision, setShowLihtcDecision] = useState(true);

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
    noi, dscr: 1.20, annualRate: 0.065, amortYears: 30, ltv: 0.80, stabilizedValue,
  });

  const committed = totalCommitted(stack.awarded) + debt.amount;
  const penaltyEligibleCount = stack.awarded.filter((a) => getSource(a.sourceId).usesComplexityPenalty).length;
  const penalty = complexityPenalty(penaltyEligibleCount, project.units);
  const gap = Math.max(0, tdcTotal + penalty - committed);

  const lihtcScore = computeLihtcScore({
    weightedAvgAmi: weightedAvgAmi(proForma.amiBreakdown),
    hasCboPartner: true,
    hasLeverageCommitments: stack.awarded.length >= 2,
    neighborhood: project.neighborhood,
  });
  const lihtcOdds = estimatedAwardProbability(lihtcScore);

  function onApply(sourceId: SourceId) {
    const src = getSource(sourceId);
    if (!src.amountRange) return;
    const amount = (src.amountRange.min + src.amountRange.max) / 2;
    awardSource({ sourceId, amount, daysSpent: src.daysToProcess });
  }

  function onSubmitLihtc() {
    setShowLihtcDecision(false);
    const win = Math.random() < lihtcOdds;
    if (win) {
      const equity = Math.min(24_000_000, tdcParts.hard * 0.55);
      awardSource({ sourceId: '9-lihtc', amount: equity, daysSpent: 280 });
    }
    submitLihtc(win);
    tickMonths(12);
  }

  function getSourceStatus(id: SourceId): 'available' | 'awarded' | 'locked' | 'secured' {
    if (id === 'bank-loan') return 'secured';
    if (stack.awarded.some((a) => a.sourceId === id)) return 'awarded';
    if (id === '4-lihtc-bonds' && stack.lihtcSubmitted) return 'locked';
    if (id === '9-lihtc' && stack.lihtcSubmitted && !stack.lihtcAwarded) return 'locked';
    return 'available';
  }

  function getAwardedAmount(id: SourceId): number | undefined {
    if (id === 'bank-loan') return debt.amount;
    return stack.awarded.find((a) => a.sourceId === id)?.amount;
  }

  const canAdvance = gap <= 100_000;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Header />
      <h2 className="text-2xl mt-6 mb-4">Capital Stack</h2>

      {/* Gap status */}
      <div className="bg-panel border border-line rounded-lg p-3 mb-3">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-xs uppercase tracking-wider text-accent font-bold">Gap to close</span>
            {' '}<b className={`text-xl tabular ${gap > 0 ? 'text-gap' : 'text-equity'}`}>
              ${(gap / 1_000_000).toFixed(1)}M
            </b>
          </div>
          <div className="text-xs text-muted">
            {penaltyEligibleCount} of 5 free source slots used
            {penalty > 0 && <span className="text-caution"> · penalty +${(penalty / 1_000_000).toFixed(1)}M</span>}
          </div>
        </div>
        <div className="mt-2">
          <StackBar tdc={tdcTotal + penalty} awarded={stack.awarded} bankLoan={debt.amount} />
        </div>
      </div>

      {/* LIHTC decision card */}
      {showLihtcDecision && !stack.lihtcSubmitted && (
        <div className="bg-bg border-2 border-accent rounded-lg p-4 mb-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs uppercase tracking-wider text-accent font-bold">9% LIHTC — IHDA QAP scoring</div>
              <div className="text-sm mt-1">Score: <b>{lihtcScore} / 100</b> · Est. award probability: <b>{(lihtcOdds * 100).toFixed(0)}%</b></div>
              <div className="text-xs text-muted mt-1">
                {lihtcScore < 50 ? janelleLines.qapScoreLow : lihtcScore < 75 ? janelleLines.qapScoreMid : janelleLines.qapScoreHigh}
              </div>
            </div>
            <button onClick={onSubmitLihtc} className="bg-accent text-white px-4 py-2 rounded font-bold">
              Submit this round →
            </button>
          </div>
        </div>
      )}

      {!stack.lihtcAwarded && stack.lihtcSubmitted && (
        <div className="bg-gap text-white rounded-lg p-3 mb-3 text-sm">
          <b>9% LIHTC denied this round.</b> +12 months while you wait for the next round. Cost escalation has accrued.
        </div>
      )}

      {/* Source grid */}
      <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">Funding sources</div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {sources.map((src) => {
          const status = getSourceStatus(src.id);
          const amt = getAwardedAmount(src.id);
          const complexityWarning =
            src.usesComplexityPenalty && status === 'available' && penaltyEligibleCount >= COMPLEXITY_PENALTY_THRESHOLD;
          return (
            <SourceCard
              key={src.id}
              source={src}
              status={status}
              awardedAmount={amt}
              complexityWarning={complexityWarning}
              onApply={() => onApply(src.id)}
            />
          );
        })}
      </div>

      {penaltyEligibleCount >= COMPLEXITY_PENALTY_THRESHOLD && (
        <CharacterBubble characterId="janelle" line={janelleLines.fiveSources} />
      )}

      <button
        onClick={advancePhase}
        disabled={!canAdvance}
        className="w-full mt-4 bg-accent text-white py-3 rounded-lg font-bold disabled:opacity-40"
      >
        {canAdvance ? 'Stack closed — on to entitlement →' : `Close the remaining $${(gap / 1_000_000).toFixed(1)}M gap to advance`}
      </button>
    </div>
  );
}
