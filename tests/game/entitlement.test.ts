import { describe, it, expect } from 'vitest';
import {
  resolveEntitlementPath,
  applyChoice,
  isPathFailed,
} from '../../src/game/entitlement';

describe('resolveEntitlementPath', () => {
  it('Mid-rise + zoning change needed → Zoning Map Amendment path', () => {
    expect(resolveEntitlementPath({ buildingType: 'midrise', units: 60 })).toBe('zma');
  });

  it('Walk-up at 60 units → Planned Development path', () => {
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 60 })).toBe('pd');
  });

  it('Larger building → Planned Development', () => {
    expect(resolveEntitlementPath({ buildingType: 'larger', units: 60 })).toBe('pd');
  });
});

describe('applyChoice', () => {
  it('shrink-zoning choice applies delta to meters and units', () => {
    const result = applyChoice('zoning-shrink', { shrinkBy: 12 });
    expect(result.alderDelta).toBe(-6);
    expect(result.communityDelta).toBe(15);
    expect(result.shrinkBy).toBe(12);
  });

  it('community-story choice adds to community support', () => {
    const result = applyChoice('community-story', {});
    expect(result.communityDelta).toBeGreaterThan(0);
  });

  it('finance-concede choice tracks tdcDelta (gap reopens)', () => {
    const result = applyChoice('finance-concede', { concessionAmount: 3_000_000 });
    expect(result.tdcDelta).toBe(0); // TDC unchanged; gap reopens via source removal
    expect(result.alderDelta).toBe(5);
  });
});

describe('isPathFailed', () => {
  it('alder goodwill < 20 → alder withdrawal', () => {
    expect(isPathFailed({ alderGoodwill: 15, communitySupport: 60 })).toBe('alder');
  });

  it('community support < 25 → community failure', () => {
    expect(isPathFailed({ alderGoodwill: 50, communitySupport: 20 })).toBe('community');
  });

  it('all meters above threshold → no failure', () => {
    expect(isPathFailed({ alderGoodwill: 50, communitySupport: 60 })).toBe(null);
  });
});
