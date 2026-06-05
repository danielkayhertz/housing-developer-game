import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('Albany Park CBO-amplified hook', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('Englewood + CBO: standard +6 community on Phase 6 entry', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setCboPartner(true);
    const before = useGameStore.getState().entitlement.communitySupport;
    useGameStore.setState({ phase: 5 });
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before + 6);
  });

  it('Albany Park + CBO: amplified +12 community', () => {
    useGameStore.getState().selectNeighborhood('albany-park');
    useGameStore.getState().setCboPartner(true);
    const before = useGameStore.getState().entitlement.communitySupport;
    useGameStore.setState({ phase: 5 });
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before + 12);
  });

  it('Albany Park without CBO: no delta', () => {
    useGameStore.getState().selectNeighborhood('albany-park');
    useGameStore.getState().setCboPartner(false);
    const before = useGameStore.getState().entitlement.communitySupport;
    useGameStore.setState({ phase: 5 });
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before);
  });
});
