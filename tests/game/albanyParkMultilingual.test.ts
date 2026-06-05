import { describe, it, expect } from 'vitest';
import { applyChoice } from '../../src/game/entitlement';

describe('preapp-multilingual choice', () => {
  it('returns +15 community / 0 alder', () => {
    const c = applyChoice('preapp-multilingual');
    expect(c.alderDelta).toBe(0);
    expect(c.communityDelta).toBe(15);
  });
});
