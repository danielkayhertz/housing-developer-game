import {
  GameState,
  REVISION_SOFT_PENALTY,
} from './types';
import { getNeighborhood } from '../data/neighborhoods';
import { getSource } from '../data/sources';
import { computeNoi, computeSupportableDebt, getEffectiveUnits, effectiveHardPerUnit, computeTdcFromState } from './proForma';
import { complexityPenalty, totalCommitted } from './capitalStack';

export interface EffectiveGapBreakdown {
  effectiveUnits: number;
  effectiveHardPerUnit: number;
  land: number;
  hard: number;
  soft: number;
  contingency: number;
  tdcBase: number;
  costEscalation: number;
  revisionPenalty: number;
  complexity: number;
  tdcAllIn: number;
  bankLoan: number;
  awardedTotal: number;
  extraSubsidy: number;
  committed: number;
  gap: number;
}

export function computeEffectiveGap(state: GameState): EffectiveGapBreakdown {
  if (!state.project.neighborhood) {
    return {
      effectiveUnits: 0, effectiveHardPerUnit: 0, land: 0, hard: 0, soft: 0,
      contingency: 0, tdcBase: 0, costEscalation: 0, revisionPenalty: 0,
      complexity: 0, tdcAllIn: 0, bankLoan: 0, awardedTotal: 0,
      extraSubsidy: 0, committed: 0, gap: 0,
    };
  }

  const n = getNeighborhood(state.project.neighborhood);
  const effectiveUnits = getEffectiveUnits(state);
  const hardPerUnit = effectiveHardPerUnit(state);

  const tdc = computeTdcFromState(state);
  const land = tdc.land;
  const hard = tdc.hard;
  const soft = tdc.soft;
  const contingency = tdc.contingency;
  const tdcBase = tdc.total;

  const revisionPenalty = state.stack.lihtcRevisions * REVISION_SOFT_PENALTY;

  const penaltyEligibleCount = state.stack.awarded.filter(
    (a) => getSource(a.sourceId).usesComplexityPenalty,
  ).length;
  const complexity = complexityPenalty(penaltyEligibleCount, effectiveUnits);

  const tdcAllIn = tdcBase + state.costEscalation + revisionPenalty + complexity;

  const noi = computeNoi({
    amiBreakdown: state.proForma.amiBreakdown,
    marketUnits: state.proForma.marketUnits,
    marketRent: n.marketRentPerUnit,
    opexRatio: state.proForma.opexRatio,
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

  const awardedTotal = totalCommitted(state.stack.awarded);
  const extraSubsidy = state.gapResolution.extraSubsidy;
  const committed = awardedTotal + debt.amount + extraSubsidy;
  const gap = Math.max(0, tdcAllIn - committed);

  return {
    effectiveUnits, effectiveHardPerUnit: hardPerUnit, land, hard, soft, contingency,
    tdcBase, costEscalation: state.costEscalation, revisionPenalty, complexity,
    tdcAllIn, bankLoan: debt.amount, awardedTotal, extraSubsidy, committed, gap,
  };
}
