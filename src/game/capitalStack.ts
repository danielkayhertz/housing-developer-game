import {
  SourceAward,
  COMPLEXITY_PENALTY_THRESHOLD,
  COMPLEXITY_PENALTY_PER_UNIT,
  LIHTC_BASELINE_WIN_RATE,
  NeighborhoodId,
} from './types';

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

  return Math.min(100, Math.round(score));
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
