import { describe, it, expect } from 'vitest';
import { applyChoice } from '../../src/game/entitlement';

describe('Jefferson Park parking choices', () => {
  it('full parking: +12 alder, +15 community, +$30k/u', () => {
    const c = applyChoice('community-jp-full-parking');
    expect(c.alderDelta).toBe(12);
    expect(c.communityDelta).toBe(15);
    expect(c.tdcDelta).toBe(30_000);
  });

  it('traffic data: +5 alder, +6 community, +$15k/u', () => {
    const c = applyChoice('community-jp-traffic-data');
    expect(c.alderDelta).toBe(5);
    expect(c.communityDelta).toBe(6);
    expect(c.tdcDelta).toBe(15_000);
  });

  it('refuse: −5 alder, −10 community, no TDC', () => {
    const c = applyChoice('community-jp-refuse-parking');
    expect(c.alderDelta).toBe(-5);
    expect(c.communityDelta).toBe(-10);
    expect(c.tdcDelta).toBe(0);
  });
});
