import { describe, it, expect } from 'vitest';
import {
  complexityPenalty,
  computeLihtcScore,
  estimatedAwardProbability,
  totalCommitted,
} from '../../src/game/capitalStack';
import { MIXED_INCOME_QAP_PENALTY } from '../../src/game/types';

describe('complexityPenalty', () => {
  it('0 sources → $0', () => {
    expect(complexityPenalty(0, 60)).toBe(0);
  });

  it('5 sources → $0 (under threshold)', () => {
    expect(complexityPenalty(5, 60)).toBe(0);
  });

  it('6 sources at 60 units → $1.2M ($20k/u × 60u × 1)', () => {
    expect(complexityPenalty(6, 60)).toBe(1_200_000);
  });

  it('8 sources at 60 units → $3.6M', () => {
    expect(complexityPenalty(8, 60)).toBe(3_600_000);
  });

  it('penalty scales with units', () => {
    expect(complexityPenalty(7, 100)).toBe(4_000_000); // 2 over × $20k × 100
  });
});

describe('computeLihtcScore', () => {
  it('balanced mix with CBO partner gives middle-of-pack score', () => {
    const score = computeLihtcScore({
      weightedAvgAmi: 55,
      hasCboPartner: true,
      hasLeverageCommitments: true,
      neighborhood: 'englewood',
      intent: 'all-affordable',
      marketUnits: 0,
    });
    expect(score).toBeGreaterThanOrEqual(60);
    expect(score).toBeLessThanOrEqual(90);
  });

  it('shallow AMI, no CBO, no leverage scores low', () => {
    const score = computeLihtcScore({
      weightedAvgAmi: 60,
      hasCboPartner: false,
      hasLeverageCommitments: false,
      neighborhood: 'englewood',
      intent: 'all-affordable',
      marketUnits: 0,
    });
    expect(score).toBeLessThan(50);
  });
});

describe('computeLihtcScore: mixed-income QAP penalty', () => {
  const base = {
    weightedAvgAmi: 58,
    hasCboPartner: true,
    hasLeverageCommitments: true,
  };

  it('all-affordable: no penalty anywhere', () => {
    const englewood = computeLihtcScore({ ...base, intent: 'all-affordable', marketUnits: 0, neighborhood: 'englewood' });
    const pilsen = computeLihtcScore({ ...base, intent: 'all-affordable', marketUnits: 0, neighborhood: 'pilsen' });
    expect(englewood).toBe(pilsen);  // identical scoring
  });

  it('mixed-income with 0 market units: no penalty (treated as all-affordable for scoring)', () => {
    const scored = computeLihtcScore({ ...base, intent: 'mixed-income', marketUnits: 0, neighborhood: 'pilsen' });
    const allAff = computeLihtcScore({ ...base, intent: 'all-affordable', marketUnits: 0, neighborhood: 'pilsen' });
    expect(scored).toBe(allAff);
  });

  it('mixed-income with market units, non-Englewood: −12 penalty', () => {
    const allAff = computeLihtcScore({ ...base, intent: 'all-affordable', marketUnits: 0, neighborhood: 'pilsen' });
    const mixed = computeLihtcScore({ ...base, intent: 'mixed-income', marketUnits: 6, neighborhood: 'pilsen' });
    expect(allAff - mixed).toBe(MIXED_INCOME_QAP_PENALTY);
  });

  it('mixed-income with market units in Englewood: no penalty (exemption)', () => {
    const allAff = computeLihtcScore({ ...base, intent: 'all-affordable', marketUnits: 0, neighborhood: 'englewood' });
    const mixed = computeLihtcScore({ ...base, intent: 'mixed-income', marketUnits: 6, neighborhood: 'englewood' });
    expect(mixed).toBe(allAff);
  });
});

describe('estimatedAwardProbability', () => {
  it('score 100 → ~70% probability', () => {
    expect(estimatedAwardProbability(100)).toBeCloseTo(0.70, 1);
  });

  it('score 50 → ~20% probability (baseline)', () => {
    expect(estimatedAwardProbability(50)).toBeCloseTo(0.20, 1);
  });

  it('score 0 → ~5%', () => {
    expect(estimatedAwardProbability(0)).toBeLessThan(0.10);
  });
});

describe('totalCommitted', () => {
  it('sums awarded sources', () => {
    const total = totalCommitted([
      { sourceId: '9-lihtc', amount: 22_000_000, daysSpent: 280 },
      { sourceId: 'doh-loan', amount: 5_000_000, daysSpent: 45 },
    ]);
    expect(total).toBe(27_000_000);
  });
});
