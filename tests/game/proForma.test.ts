import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeTdc,
  computeNoi,
  computeSupportableDebt,
  computeGap,
  weightedAvgAmi,
  isLihtcEligible,
  getEffectiveUnits,
  effectiveHardPerUnit,
} from '../../src/game/proForma';
import { useGameStore } from '../../src/game/state';
import { HARD_COST_PER_UNIT, FINISH_MULTIPLIER, MIN_UNITS_FLOOR, LOWER_QUALITY_HARD_MULTIPLIER } from '../../src/game/types';

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

describe('getEffectiveUnits (v5 item 7)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('returns project.units when no shrinks', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    expect(getEffectiveUnits(useGameStore.getState())).toBe(60);
  });

  it('subtracts entitlement.projectShrinkBy', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState((s) => ({ entitlement: { ...s.entitlement, projectShrinkBy: 12 } }));
    expect(getEffectiveUnits(useGameStore.getState())).toBe(48);
  });

  it('subtracts gapResolution.shrinkBy', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState((s) => ({ gapResolution: { ...s.gapResolution, shrinkBy: 10 } }));
    expect(getEffectiveUnits(useGameStore.getState())).toBe(50);
  });

  it('subtracts both shrinks', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, projectShrinkBy: 12 },
      gapResolution: { ...s.gapResolution, shrinkBy: 10 },
    }));
    expect(getEffectiveUnits(useGameStore.getState())).toBe(38);
  });

  it('floors at MIN_UNITS_FLOOR', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(25);
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, projectShrinkBy: 50 },
    }));
    expect(getEffectiveUnits(useGameStore.getState())).toBe(MIN_UNITS_FLOOR);
  });
});

describe('effectiveHardPerUnit (v5 item 10 / phase 5)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('matches HARD_COST_PER_UNIT × FINISH_MULTIPLIER when no flags set', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    const state = useGameStore.getState();
    const expected = HARD_COST_PER_UNIT[state.project.buildingType] * FINISH_MULTIPLIER[state.proForma.finishLevel];
    expect(effectiveHardPerUnit(state)).toBeCloseTo(expected);
  });

  it('multiplies by 1.15 when entitlement.designUpgrade is true', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.setState((s) => ({ entitlement: { ...s.entitlement, designUpgrade: true } }));
    const state = useGameStore.getState();
    const base = HARD_COST_PER_UNIT[state.project.buildingType] * FINISH_MULTIPLIER[state.proForma.finishLevel];
    expect(effectiveHardPerUnit(state)).toBeCloseTo(base * 1.15);
  });

  it('multiplies by LOWER_QUALITY_HARD_MULTIPLIER when lowerQualityUsed is true', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.setState((s) => ({ gapResolution: { ...s.gapResolution, lowerQualityUsed: true } }));
    const state = useGameStore.getState();
    const base = HARD_COST_PER_UNIT[state.project.buildingType] * FINISH_MULTIPLIER[state.proForma.finishLevel];
    expect(effectiveHardPerUnit(state)).toBeCloseTo(base * 0.9);
  });

  it('stacks both multipliers when both flags set', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, designUpgrade: true },
      gapResolution: { ...s.gapResolution, lowerQualityUsed: true },
    }));
    const state = useGameStore.getState();
    const base = HARD_COST_PER_UNIT[state.project.buildingType] * FINISH_MULTIPLIER[state.proForma.finishLevel];
    expect(effectiveHardPerUnit(state)).toBeCloseTo(base * 1.15 * 0.9);
  });
});
