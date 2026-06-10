import { describe, it, expect } from 'vitest';
import {
  sfhUnitTier,
  SFH_TDC_PER_UNIT,
  SFH_MARKET_PRICE,
  EQUITY_BUDGET,
  AFFORDABLE_PRICE,
  PERMIT_DAYS,
  SFH_MIN_UNITS,
  SFH_MAX_UNITS,
} from '../../src/data/singleFamily';

describe('sfhUnitTier', () => {
  it('maps unit counts to tiers', () => {
    expect(sfhUnitTier(1)).toBe('1');
    expect(sfhUnitTier(2)).toBe('2');
    expect(sfhUnitTier(3)).toBe('3-5');
    expect(sfhUnitTier(5)).toBe('3-5');
    expect(sfhUnitTier(6)).toBe('6-15');
    expect(sfhUnitTier(15)).toBe('6-15');
  });
});

describe('SFH constants and tables', () => {
  it('TDC tiers match spec', () => {
    expect(SFH_TDC_PER_UNIT['1']).toBe(500_000);
    expect(SFH_TDC_PER_UNIT['2']).toBe(400_000);
    expect(SFH_TDC_PER_UNIT['3-5']).toBe(350_000);
    expect(SFH_TDC_PER_UNIT['6-15']).toBe(300_000);
  });

  it('market prices match spec for each neighborhood', () => {
    expect(SFH_MARKET_PRICE['jefferson-park']['1']).toBe(1_300_000);
    expect(SFH_MARKET_PRICE['pilsen']['6-15']).toBe(750_000);
    expect(SFH_MARKET_PRICE['albany-park']['3-5']).toBe(800_000);
    expect(SFH_MARKET_PRICE['englewood']['2']).toBe(375_000);
  });

  it('budget constants match spec', () => {
    expect(EQUITY_BUDGET).toBe(2_000_000);
    expect(AFFORDABLE_PRICE).toBe(250_000);
    expect(PERMIT_DAYS).toBe(120);
    expect(SFH_MIN_UNITS).toBe(1);
    expect(SFH_MAX_UNITS).toBe(15);
  });
});
