import { describe, it, expect } from 'vitest';
import { computeImpactScore } from '../../src/game/scoring';

describe('computeImpactScore', () => {
  it('not closed → 0 regardless of mix', () => {
    expect(computeImpactScore({
      closed: false,
      amiBreakdown: { 30: 60, 60: 0, 80: 0 },
    })).toBe(0);
  });

  it('all-60% mix, 60 units → 60 × 1.75 = 105', () => {
    expect(computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 0, 60: 60, 80: 0 },
    })).toBe(105);
  });

  it('default balanced 12/36/12 mix → 48 + 63 + 12 = 123', () => {
    expect(computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 12, 60: 36, 80: 12 },
    })).toBe(123);
  });

  it('deep mix (30 at 30% + 30 at 60%) → 120 + 52.5 = 172.5', () => {
    expect(computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 30, 60: 30, 80: 0 },
    })).toBe(172.5);
  });
});

describe('AMI_SCORE_MULTIPLIERS — compressed 3-tier', () => {
  it('30% weighted heaviest', () => {
    const score = computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 10, 60: 0, 80: 0 },
    });
    expect(score).toBe(40); // 10 * 4
  });

  it('60% mid weight (1.75)', () => {
    const score = computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 0, 60: 10, 80: 0 },
    });
    expect(score).toBe(17.5);
  });

  it('80% baseline weight (1)', () => {
    const score = computeImpactScore({
      closed: true,
      amiBreakdown: { 30: 0, 60: 0, 80: 10 },
    });
    expect(score).toBe(10);
  });
});
