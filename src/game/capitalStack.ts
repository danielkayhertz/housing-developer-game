import {
  SourceAward,
  AmiBand,
  COMPLEXITY_PENALTY_THRESHOLD,
  COMPLEXITY_PENALTY_PER_UNIT,
  LIHTC_BASELINE_WIN_RATE,
  MIXED_INCOME_QAP_PENALTY,
  NeighborhoodId,
  Intent,
  FinishLevel,
  GameState,
} from './types';
import { weightedAvgAmi } from './proForma';

/** Maximum LIHTC equity award regardless of hard cost. */
const LIHTC_AWARD_CAP = 24_000_000;
/** LIHTC equity as a fraction of hard construction cost (55%). */
const LIHTC_HARD_COST_RATIO = 0.55;

/**
 * Compute the 9% LIHTC equity award amount.
 *
 * The base award is `min(LIHTC_AWARD_CAP, hardCost × 0.55)`.
 * It scales linearly by affordable share: if only 80% of units are
 * affordable the award is 80% of the base.
 *
 * @param hardCost - Hard construction cost in dollars
 * @param amiBreakdown - Unit counts by AMI band (30/60/80)
 * @param marketUnits - Number of market-rate units (default 0)
 */
export function computeLihtcAward(input: {
  hardCost: number;
  amiBreakdown: Record<AmiBand, number>;
  marketUnits?: number;
}): number {
  const { hardCost, amiBreakdown, marketUnits = 0 } = input;
  const affordableUnits = (Object.values(amiBreakdown) as number[]).reduce((sum, v) => sum + v, 0);
  const totalUnits = affordableUnits + marketUnits;
  const affordableShare = totalUnits > 0 ? affordableUnits / totalUnits : 0;
  const baseAward = Math.min(LIHTC_AWARD_CAP, hardCost * LIHTC_HARD_COST_RATIO);
  return Math.round(baseAward * affordableShare);
}

export function complexityPenalty(sourceCount: number, units: number): number {
  const overage = Math.max(0, sourceCount - COMPLEXITY_PENALTY_THRESHOLD);
  return overage * COMPLEXITY_PENALTY_PER_UNIT * units;
}

export function totalCommitted(awarded: SourceAward[]): number {
  return awarded.reduce((sum, a) => sum + a.amount, 0);
}

export function computeLihtcScore(input: {
  weightedAvgAmi: number;
  hasCboPartner: boolean;
  hasLeverageCommitments: boolean;
  neighborhood: NeighborhoodId;
  intent: Intent;
  marketUnits: number;
  finishLevel: FinishLevel;
}): number {
  let score = 24; // base

  // Affordability depth: deeper (lower AMI) = more points
  const depthPoints = Math.max(0, ((60 - input.weightedAvgAmi) / 30) * 24);
  score += Math.min(24, depthPoints);

  if (input.hasCboPartner) score += 18;
  if (input.hasLeverageCommitments) score += 14;

  if (input.neighborhood === 'englewood' || input.neighborhood === 'pilsen') {
    score += 10;
  }

  if (
    input.intent === 'mixed-income' &&
    input.marketUnits > 0 &&
    input.neighborhood !== 'englewood'
  ) {
    score -= MIXED_INCOME_QAP_PENALTY;
  }

  if (input.finishLevel === 'basic') score -= 12;
  if (input.finishLevel === 'elevated') score += 14;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function estimatedAwardProbability(score: number): number {
  if (score <= 0) return 0.05;
  if (score >= 100) return 0.70;

  if (score <= 50) {
    return 0.05 + (score / 50) * (LIHTC_BASELINE_WIN_RATE - 0.05);
  } else {
    return LIHTC_BASELINE_WIN_RATE + ((score - 50) / 50) * (0.70 - LIHTC_BASELINE_WIN_RATE);
  }
}

export function computeQapScore(state: GameState): { score: number; odds: number } {
  if (!state.project.neighborhood) {
    return { score: 0, odds: 0 };
  }
  const score = computeLihtcScore({
    weightedAvgAmi: weightedAvgAmi(state.proForma.amiBreakdown),
    hasCboPartner: state.project.hasCboPartner,
    hasLeverageCommitments: state.stack.awarded.length >= 2,
    neighborhood: state.project.neighborhood,
    intent: state.project.intent,
    marketUnits: state.proForma.marketUnits ?? 0,
    finishLevel: state.proForma.finishLevel,
  });
  const odds = estimatedAwardProbability(score);
  return { score, odds };
}
