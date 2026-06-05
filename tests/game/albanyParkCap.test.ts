import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('Albany Park community cap when skipping multilingual', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('albany-park');
  });

  it('picking preapp-quiet caps community at 50 going forward', () => {
    useGameStore.getState().takeEntitlementStep('preapp-quiet', 1);
    // Force community above 50 directly in state
    useGameStore.setState({
      entitlement: { ...useGameStore.getState().entitlement, communitySupport: 80 }
    });
    // Next step choice should clamp community back to 50
    useGameStore.getState().takeEntitlementStep('community-story', 2);
    expect(useGameStore.getState().entitlement.communitySupport).toBeLessThanOrEqual(50);
  });

  it('picking preapp-multilingual does not cap', () => {
    useGameStore.getState().takeEntitlementStep('preapp-multilingual', 1);
    // Force community above 50
    useGameStore.setState({
      entitlement: { ...useGameStore.getState().entitlement, communitySupport: 80 }
    });
    useGameStore.getState().takeEntitlementStep('community-story', 2);
    expect(useGameStore.getState().entitlement.communitySupport).toBeGreaterThan(50);
  });
});
