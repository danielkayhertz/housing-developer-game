import { useState } from 'react';
import { useGameStore } from '../game/state';
import { sources, getSource } from '../data/sources';
import { computeTdc, computeNoi, computeSupportableDebt } from '../game/proForma';
import { complexityPenalty, computeLihtcAward, computeQapScore, totalCommitted } from '../game/capitalStack';
import { getNeighborhood } from '../data/neighborhoods';
import { Header } from '../components/Header';
import { StackBar } from '../components/StackBar';
import { SourceCard } from '../components/SourceCard';
import { CharacterBubble } from '../components/CharacterBubble';
import { CharacterIntroCard } from '../components/CharacterIntroCard';
import { janelleLines, davidLines, marcusLines, characters } from '../data/characters';
import { ReviseSubScreen } from '../components/ReviseSubScreen';
import { LiveGapRow } from '../components/LiveGapRow';
import { AmiBand, FinishLevel, SourceId, COMPLEXITY_PENALTY_THRESHOLD, REVISION_SOFT_PENALTY, GAP_ADVANCE_THRESHOLD } from '../game/types';
import { JargonScreenScope } from '../components/JargonScreenScope';
import { TooltipTerm } from '../components/TooltipTerm';

export function CapitalStack() {
  const state = useGameStore((s) => s);
  const project = useGameStore((s) => s.project);
  const proForma = useGameStore((s) => s.proForma);
  const costEscalation = useGameStore((s) => s.costEscalation);
  const stack = useGameStore((s) => s.stack);
  const awardSource = useGameStore((s) => s.awardSource);
  const removeSource = useGameStore((s) => s.removeSource);
  const submitLihtc = useGameStore((s) => s.submitLihtc);
  const resubmitLihtc = useGameStore((s) => s.resubmitLihtc);
  const reviseLihtc = useGameStore((s) => s.reviseLihtc);
  const tickMonths = useGameStore((s) => s.tickMonths);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const retreatPhase = useGameStore((s) => s.retreatPhase);
  const [showLihtcDecision, setShowLihtcDecision] = useState(true);
  const [reviseMode, setReviseMode] = useState<'none' | 'cut-costs' | 'qap-odds'>('none');

  if (!project.neighborhood) return null;
  const n = getNeighborhood(project.neighborhood);

  const tdcParts = computeTdc({
    neighborhood: project.neighborhood,
    units: project.units,
    buildingType: project.buildingType,
    finishLevel: proForma.finishLevel,
  });
  const revisionPenalty = stack.lihtcRevisions * REVISION_SOFT_PENALTY;
  const tdcTotal = tdcParts.total + costEscalation + revisionPenalty;
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

  const { score: lihtcScore, odds: lihtcOdds } = computeQapScore(state);

  const affordableUnits = (Object.values(proForma.amiBreakdown) as number[]).reduce((s, v) => s + v, 0);
  const totalUnits = affordableUnits + proForma.marketUnits;
  const affordableShare = totalUnits > 0 ? affordableUnits / totalUnits : 0;
  const lihtcEquity = computeLihtcAward({
    hardCost: tdcParts.hard,
    amiBreakdown: proForma.amiBreakdown,
    marketUnits: proForma.marketUnits,
  });

  function onApply(sourceId: SourceId) {
    const src = getSource(sourceId);
    if (sourceId === 'deferred-dev-fee') {
      const amount = Math.round(Math.min(0.03 * tdcTotal, 1_500_000) / 1000) * 1000;
      awardSource({ sourceId, amount, daysSpent: 0 });
      return;
    }
    if (!src.amountRange) return;
    const amount = (src.amountRange.min + src.amountRange.max) / 2;
    awardSource({ sourceId, amount, daysSpent: src.daysToProcess });
  }

  function onSubmitLihtc() {
    setShowLihtcDecision(false);
    const win = Math.random() < lihtcOdds;
    if (win) {
      awardSource({ sourceId: '9-lihtc', amount: lihtcEquity, daysSpent: 280 });
    }
    submitLihtc(win);
    tickMonths(12);
  }

  function onSubmitAgain() {
    const win = Math.random() < lihtcOdds;
    if (win) {
      awardSource({ sourceId: '9-lihtc', amount: lihtcEquity, daysSpent: 280 });
    }
    resubmitLihtc(win);
    tickMonths(12);
  }

  function onResubmitFromRevise() {
    const win = Math.random() < lihtcOdds;
    if (win) {
      awardSource({ sourceId: '9-lihtc', amount: lihtcEquity, daysSpent: 280 });
    }
    reviseLihtc(win);
    tickMonths(12);
    setReviseMode('none');
  }

  function onExitCutCosts() {
    tickMonths(3);
    setReviseMode('none');
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

  const canAdvance = gap <= GAP_ADVANCE_THRESHOLD;

  if (reviseMode === 'cut-costs') {
    return (
      <JargonScreenScope>
      <div className="max-w-6xl mx-auto p-6">
        <Header />
        <h2 className="text-2xl mt-6 mb-4">Capital Stack — revise</h2>
        <CutCostsSubScreen onDone={onExitCutCosts} />
      </div>
      </JargonScreenScope>
    );
  }

  if (reviseMode === 'qap-odds') {
    return (
      <JargonScreenScope>
      <div className="max-w-6xl mx-auto p-6">
        <Header />
        <h2 className="text-2xl mt-6 mb-4">Capital Stack — revise</h2>
        <QapOddsSubScreen
          projectedScore={lihtcScore}
          projectedOdds={lihtcOdds}
          onResubmit={onResubmitFromRevise}
          onCancel={() => setReviseMode('none')}
        />
      </div>
      </JargonScreenScope>
    );
  }

  return (
    <JargonScreenScope>
    <div className="max-w-6xl mx-auto p-6">
      <button
        onClick={retreatPhase}
        className="text-muted text-sm mb-4 hover:text-ink inline-block"
      >
        ← Back
      </button>
      <Header />
      <h2 className="text-2xl mt-6 mb-4">Capital Stack</h2>

      <div className="mb-3">
        <CharacterIntroCard
          avatar={characters.david.emoji}
          name={characters.david.name}
          role={characters.david.role}
          body={
            <>
              <p>{davidLines.capitalStackIntro}</p>
              {project.buildingType === 'walkup' && (
                <p className="text-sm italic text-muted mt-2">{davidLines.capitalStackQuipWalkup}</p>
              )}
              {project.buildingType === 'larger' && (
                <p className="text-sm italic text-muted mt-2">{davidLines.capitalStackQuipLarger}</p>
              )}
            </>
          }
        />
      </div>

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
            {revisionPenalty > 0 && <span className="text-caution"> · revision rework +${(revisionPenalty / 1000).toFixed(0)}k</span>}
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
              <div className="text-xs uppercase tracking-wider text-accent font-bold">9% <TooltipTerm term="LIHTC">LIHTC</TooltipTerm> — IHDA <TooltipTerm term="QAP">QAP</TooltipTerm> scoring</div>
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
          <div>
            <b>9% LIHTC denied this round.</b>
            {stack.lihtcResubmits > 0 && ` Resubmits: ${stack.lihtcResubmits}.`}
            {stack.lihtcRevisions > 0 && ` Revisions: ${stack.lihtcRevisions} (+$${((stack.lihtcRevisions * REVISION_SOFT_PENALTY) / 1000).toFixed(0)}k soft).`}
            {' '}You can resubmit as-is (+12 mo) or revise the application to lift your odds.
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={onSubmitAgain}
              className="bg-bg text-ink px-3 py-2 rounded font-bold text-xs"
            >
              ↻ Submit again (+12 mo)
            </button>
            <button
              onClick={() => setReviseMode('qap-odds')}
              className="bg-accent text-white px-3 py-2 rounded font-bold text-xs"
            >
              ✎ Revise to increase QAP odds
            </button>
          </div>
        </div>
      )}

      <div className="mb-3">
        <CharacterBubble characterId="marcus" line={marcusLines.capitalStackBubble} />
      </div>

      {/* Source grid */}
      <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">Funding sources</div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {sources.map((src) => {
          const status = getSourceStatus(src.id);
          const amt = getAwardedAmount(src.id);
          const complexityWarning =
            src.usesComplexityPenalty && status === 'available' && penaltyEligibleCount >= COMPLEXITY_PENALTY_THRESHOLD;
          const scalingNote =
            src.id === '9-lihtc' && affordableShare < 1
              ? `scaled to ${(affordableShare * 100).toFixed(0)}% affordable share`
              : undefined;
          const canRemove =
            status === 'awarded' &&
            src.id !== '9-lihtc' &&
            src.id !== '4-lihtc-bonds' &&
            src.id !== 'bank-loan';
          return (
            <SourceCard
              key={src.id}
              source={src}
              status={status}
              awardedAmount={amt}
              complexityWarning={complexityWarning}
              scalingNote={scalingNote}
              onApply={() => onApply(src.id)}
              onRemove={canRemove ? () => removeSource(src.id) : undefined}
            />
          );
        })}
      </div>

      {penaltyEligibleCount >= COMPLEXITY_PENALTY_THRESHOLD && (
        <CharacterBubble characterId="janelle" line={janelleLines.fiveSources} />
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setReviseMode('cut-costs')}
          className="flex-1 bg-panel border border-line hover:border-accent px-3 py-2 rounded text-sm font-bold"
        >
          ↻ Revise to cut costs (+3 mo)
        </button>
      </div>
      <button
        onClick={advancePhase}
        className="w-full mt-2 bg-accent text-white py-3 rounded-lg font-bold"
      >
        {canAdvance
          ? 'Stack closed — on to entitlement →'
          : `Resolve the remaining $${(gap / 1_000_000).toFixed(1)}M gap →`}
      </button>
    </div>
    </JargonScreenScope>
  );
}

function CutCostsSubScreen({ onDone }: { onDone: () => void }) {
  const project = useGameStore((s) => s.project);
  const proForma = useGameStore((s) => s.proForma);
  const setUnits = useGameStore((s) => s.setUnits);
  const setFinishLevel = useGameStore((s) => s.setFinishLevel);
  const setAmiUnit = useGameStore((s) => s.setAmiUnit);

  if (!project.neighborhood) return null;

  const totalAffordable = Object.values(proForma.amiBreakdown).reduce((a, b) => a + b, 0);

  return (
    <ReviseSubScreen
      title="Revise to cut costs"
      timeCostLabel="+3 mo cost escalation on exit"
      primaryLabel="Done — back to stack"
      onPrimary={onDone}
    >
      <div className="bg-panel border border-line rounded-lg p-3">
        <div className="text-xs uppercase tracking-wider text-accent font-bold">Finish level</div>
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
        <div className="text-xs uppercase tracking-wider text-accent font-bold">Unit count</div>
        <div className="text-xs text-muted mt-1">Current: <b>{project.units} units</b></div>
        <input
          type="range"
          min={20}
          max={120}
          value={project.units}
          onChange={(e) => setUnits(parseInt(e.target.value))}
          className="w-full mt-2"
        />
      </div>

      <div className="bg-panel border border-line rounded-lg p-3">
        <div className="text-xs uppercase tracking-wider text-accent font-bold">AMI breakdown</div>
        <div className="text-xs text-muted mt-1">Total affordable: {totalAffordable} · target {project.units}</div>
        {[30, 60, 80].map((ami) => {
          const a = ami as AmiBand;
          return (
            <div key={ami} className="mt-2">
              <div className="flex justify-between text-xs">
                <span><b>{ami}% AMI</b></span>
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
      </div>

      <LiveGapRow />
    </ReviseSubScreen>
  );
}

function QapOddsSubScreen({
  projectedScore,
  projectedOdds,
  onResubmit,
  onCancel,
}: {
  projectedScore: number;
  projectedOdds: number;
  onResubmit: () => void;
  onCancel: () => void;
}) {
  const project = useGameStore((s) => s.project);
  const proForma = useGameStore((s) => s.proForma);
  const setAmiUnit = useGameStore((s) => s.setAmiUnit);
  const setCboPartner = useGameStore((s) => s.setCboPartner);

  const totalAffordable = Object.values(proForma.amiBreakdown).reduce((a, b) => a + b, 0);
  const distributionOk = totalAffordable === project.units;

  return (
    <ReviseSubScreen
      title="Revise to increase QAP odds"
      timeCostLabel="Resubmit costs +12 mo and adds soft-cost penalty"
      primaryLabel={distributionOk ? 'Resubmit application →' : `Distribute all ${project.units} units first`}
      primaryDisabled={!distributionOk}
      onPrimary={onResubmit}
    >
      <div className="bg-panel border border-line rounded-lg p-3">
        <div className="text-xs uppercase tracking-wider text-accent font-bold">Deepen affordability (AMI mix)</div>
        <div className="text-xs text-muted mt-1">Total affordable: {totalAffordable} · target {project.units}</div>
        {[30, 60, 80].map((ami) => {
          const a = ami as AmiBand;
          return (
            <div key={ami} className="mt-2">
              <div className="flex justify-between text-xs">
                <span><b>{ami}% AMI</b></span>
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
      </div>

      <div className="bg-panel border border-line rounded-lg p-3">
        <div className="text-xs uppercase tracking-wider text-accent font-bold">Community Partner</div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setCboPartner(true)}
            className={`flex-1 py-2 text-xs rounded border-2 text-left px-2 ${
              project.hasCboPartner ? 'bg-bg border-accent' : 'border-line hover:border-accent'
            }`}
          >
            <b>🤝 Partner with a CBO</b>
            <div className="text-muted">+18 QAP{!project.cboTimePaid && ' · +6 mo first time'}</div>
          </button>
          <button
            onClick={() => setCboPartner(false)}
            className={`flex-1 py-2 text-xs rounded border-2 text-left px-2 ${
              !project.hasCboPartner ? 'bg-bg border-accent' : 'border-line hover:border-accent'
            }`}
          >
            <b>Go solo</b>
            <div className="text-muted">No CBO bonus</div>
          </button>
        </div>
      </div>

      <div className="bg-bg p-3 rounded-lg text-sm tabular flex justify-between">
        <span className="text-muted">Projected score</span>
        <b>{projectedScore} / 100 · {(projectedOdds * 100).toFixed(0)}% odds</b>
      </div>

      <LiveGapRow />

      <button
        onClick={onCancel}
        className="w-full bg-panel border border-line py-2 rounded text-sm"
      >
        Cancel — back to stack (no time cost)
      </button>
    </ReviseSubScreen>
  );
}
