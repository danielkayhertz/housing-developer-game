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
  it('Englewood mid-rise standard finish, 60 units → ~$45M', () => {
    const tdc = computeTdc({
      neighborhood: 'englewood',
      units: 60,
      buildingType: 'midrise',
      finishLevel: 'standard',
    });
    // land 60×$12k = $720k
    // hard 60×$560k = $33.6M
    // soft 27% × $33.6M = $9.072M
    // contingency 5% × $33.6M = $1.68M
    // = $45.072M
    expect(tdc.total).toBeCloseTo(45_072_000, -3);
    expect(tdc.land).toBe(720_000);
    expect(tdc.hard).toBe(33_600_000);
  });

  it('Elevated finish increases hard cost by 15%', () => {
    const tdc = computeTdc({
      neighborhood: 'englewood',
      units: 60,
      buildingType: 'midrise',
      finishLevel: 'elevated',
    });
    expect(tdc.hard).toBeCloseTo(33_600_000 * 1.15, -2);
  });
});

describe('weightedAvgAmi', () => {
  it('all 60% AMI → 60', () => {
    expect(weightedAvgAmi({ 30: 0, 50: 0, 60: 60, 80: 0 })).toBe(60);
  });

  it('balanced mix → ~55%', () => {
    // 12×30 + 12×50 + 30×60 + 6×80 = 360 + 600 + 1800 + 480 = 3240
    // / 60 = 54
    expect(weightedAvgAmi({ 30: 12, 50: 12, 60: 30, 80: 6 })).toBe(54);
  });
});

describe('isLihtcEligible', () => {
  it('average ≤ 60% AMI → eligible', () => {
    expect(isLihtcEligible({ 30: 12, 50: 12, 60: 30, 80: 6 })).toBe(true);
  });

  it('average > 60% AMI → not eligible', () => {
    expect(isLihtcEligible({ 30: 0, 50: 0, 60: 20, 80: 40 })).toBe(false);
  });
});

describe('computeNoi', () => {
  it('NOI = (GPR × (1 - vacancy)) × (1 - opex)', () => {
    const noi = computeNoi({
      amiBreakdown: { 30: 0, 50: 0, 60: 60, 80: 0 },
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
