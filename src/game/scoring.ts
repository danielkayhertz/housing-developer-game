import { AmiBand, AMI_SCORE_MULTIPLIERS } from './types';

export function computeImpactScore(input: {
  closed: boolean;
  amiBreakdown: Record<AmiBand, number>;
}): number {
  if (!input.closed) return 0;
  let score = 0;
  for (const ami of [30, 60, 80] as AmiBand[]) {
    score += input.amiBreakdown[ami] * AMI_SCORE_MULTIPLIERS[ami];
  }
  return score;
}
