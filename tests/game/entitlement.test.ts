import { describe, it, expect } from 'vitest';
import {
  resolveEntitlementPath,
  applyChoice,
  isPathFailed,
} from '../../src/game/entitlement';

describe('resolveEntitlementPath', () => {
  it('larger always returns pd', () => {
    expect(resolveEntitlementPath({ buildingType: 'larger', units: 80, neighborhood: 'englewood' })).toBe('pd');
    expect(resolveEntitlementPath({ buildingType: 'larger', units: 80, neighborhood: 'jefferson-park' })).toBe('pd');
  });

  it('midrise returns zma in any neighborhood', () => {
    expect(resolveEntitlementPath({ buildingType: 'midrise', units: 50, neighborhood: 'englewood' })).toBe('zma');
    expect(resolveEntitlementPath({ buildingType: 'midrise', units: 50, neighborhood: 'jefferson-park' })).toBe('zma');
  });

  it('walkup < 40 by-right in non-Jefferson-Park neighborhoods', () => {
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 24, neighborhood: 'englewood' })).toBe('by-right');
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 24, neighborhood: 'pilsen' })).toBe('by-right');
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 24, neighborhood: 'albany-park' })).toBe('by-right');
  });

  it('walkup in Jefferson Park always returns zma (SFR override)', () => {
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 24, neighborhood: 'jefferson-park' })).toBe('zma');
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 39, neighborhood: 'jefferson-park' })).toBe('zma');
  });

  it('walkup ≥ 40 returns pd in non-Jefferson-Park (existing rule)', () => {
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 40, neighborhood: 'englewood' })).toBe('pd');
    expect(resolveEntitlementPath({ buildingType: 'walkup', units: 50, neighborhood: 'albany-park' })).toBe('pd');
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

describe('preapp-public penalty (v4 item 11)', () => {
  it('preapp-public returns alder -10, community -5', () => {
    const c = applyChoice('preapp-public');
    expect(c.alderDelta).toBe(-10);
    expect(c.communityDelta).toBe(-5);
  });
});

describe('community meeting choices overhaul (v4 item 12)', () => {
  it('community-none returns alder -20, community -25', () => {
    const c = applyChoice('community-none');
    expect(c.alderDelta).toBe(-20);
    expect(c.communityDelta).toBe(-25);
  });

  it('community-story returns alder 0, community +12', () => {
    const c = applyChoice('community-story');
    expect(c.alderDelta).toBe(0);
    expect(c.communityDelta).toBe(12);
  });

  it('community-coalition unchanged: +4/+10', () => {
    const c = applyChoice('community-coalition');
    expect(c.alderDelta).toBe(4);
    expect(c.communityDelta).toBe(10);
  });
});
