import { describe, it, expect } from 'vitest';
import { computeImpactScore } from '../../src/game/scoring';

describe('computeImpactScore', () => {
  it('not closed → 0 regardless of mix', () => {
    expect(computeImpactScore({
      closed: false,
      amiBreakdown: { 30: 60, 50: 0, 60: 0, 80: 0 },
    })).toBe(0);
  });

  it('all-60% mix, 60 units → 60 × 1.5 = 90', () => {
    expect(computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 0, 50: 0, 60: 60, 80: 0 },
    })).toBe(90);
  });

  it('balanced 12/12/30/6 → 48 + 30 + 45 + 6 = 129', () => {
    expect(computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 12, 50: 12, 60: 30, 80: 6 },
    })).toBe(129);
  });

  it('deep mix (30 at 30% + 30 at 60%) → 120 + 45 = 165', () => {
    expect(computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 30, 50: 0, 60: 30, 80: 0 },
    })).toBe(165);
  });
});
