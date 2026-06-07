import { describe, it, expect } from 'vitest';
import { resolveEntitlementRecapKey } from '../../src/game/entitlement';

describe('resolveEntitlementRecapKey', () => {
  it('routes larger building at the zoning step to densityVariance', () => {
    expect(resolveEntitlementRecapKey('larger', 3, 'zoning-hold')).toBe('densityVariance');
  });

  it('uses the choice key for non-larger buildings', () => {
    expect(resolveEntitlementRecapKey('midrise', 3, 'zoning-hold')).toBe('zoning-hold');
  });

  it('uses the choice key for larger buildings outside the zoning step', () => {
    expect(resolveEntitlementRecapKey('larger', 2, 'community-story')).toBe('community-story');
  });
});
