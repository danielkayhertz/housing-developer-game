import { describe, it, expect } from 'vitest';
import {
  computeTdc,
  computeNoi,
  computeSupportableDebt,
  computeGap,
  weightedAvgAmi,
  isLihtcEligible,
} from '../../src/game/proForma';

describe('computeTdc', () => {
  it('Englewood mid-rise standard finish, 60 units → ~$36.2M', () => {
    const tdc = computeTdc({
      neighborhood: 'englewood',
      units: 60,
      buildingType: 'midrise',
      finishLevel: 'standard',
    });
    // v3: −20% hard cost
    // land 60×$12k = $720k
    // hard 60×$448k = $26.88M
    // soft 27% × $26.88M = $7.2576M
    // contingency 5% × $26.88M = $1.344M
    // = $36.2016M
    expect(tdc.total).toBeCloseTo(36_201_600, -3);
    expect(tdc.land).toBe(720_000);
    expect(tdc.hard).toBe(26_880_000);
  });

  it('Elevated finish increases hard cost by 15%', () => {
    const tdc = computeTdc({
      neighborhood: 'englewood',
      units: 60,
      buildingType: 'midrise',
      finishLevel: 'elevated',
    });
    // v3: −20% hard cost; 60 × $448k × 1.15 = $30,912,000
    expect(tdc.hard).toBeCloseTo(26_880_000 * 1.15, -2);
  });
});

describe('weightedAvgAmi', () => {
  it('all 60% AMI → 60', () => {
    expect(weightedAvgAmi({ 30: 0, 60: 60, 80: 0 })).toBe(60);
  });

  it('balanced 30/60/80 mix → 58', () => {
    // 12×30 + 36×60 + 12×80 = 360 + 2160 + 960 = 3480
    // / 60 = 58
    expect(weightedAvgAmi({ 30: 12, 60: 36, 80: 12 })).toBe(58);
  });
});

describe('isLihtcEligible', () => {
  it('average ≤ 60% AMI → eligible', () => {
    expect(isLihtcEligible({ 30: 12, 60: 36, 80: 12 })).toBe(true);
  });

  it('average > 60% AMI → not eligible', () => {
    expect(isLihtcEligible({ 30: 0, 60: 20, 80: 40 })).toBe(false);
  });
});

describe('computeNoi', () => {
  it('NOI = (GPR × (1 - vacancy)) × (1 - opex)', () => {
    const noi = computeNoi({
      amiBreakdown: { 30: 0, 60: 60, 80: 0 },
      marketUnits: 0,
      marketRent: 1150,
      opexRatio: 0.38,
      vacancyRatio: 0.07,
    });
    // GPR = 60 × $1,250 × 12 = $900,000
    // EGI = 900,000 × 0.93 = $837,000
    // NOI = 837,000 × 0.62 = $518,940
    expect(noi).toBeCloseTo(518_940, 0);
  });
});

describe('computeSupportableDebt', () => {
  it('DSCR-limited debt sizing', () => {
    const debt = computeSupportableDebt({
      noi: 518_940,
      dscr: 1.20,
      annualRate: 0.065,
      amortYears: 30,
      ltv: 0.80,
      stabilizedValue: 8_650_000,
    });
    // payment cap = NOI / DSCR = 518,940 / 1.20 = 432,450
    // mortgage constant @ 6.5% / 30yr ≈ 0.07585
    // DSCR-limited loan = 432,450 / 0.07585 ≈ 5,700,000
    // LTV-limited = 8,650,000 × 0.80 = 6,920,000
    // bind: DSCR (lesser)
    expect(debt.amount).toBeCloseTo(5_700_000, -4);
    expect(debt.binding).toBe('DSCR');
  });
});

describe('computeGap', () => {
  it('gap = TDC + escalation − supportable debt', () => {
    const gap = computeGap({
      tdc: 45_072_000,
      costEscalation: 0,
      supportableDebt: 5_700_000,
    });
    expect(gap).toBeCloseTo(39_372_000, -3);
  });
});
