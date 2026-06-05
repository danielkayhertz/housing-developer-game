import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('Pilsen 30%-AMI bonus hook', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('pilsen');
  });

  function setupAndAdvance(thirtyAmiCount: number, totalCount: number) {
    // Build a breakdown that sums to totalCount with thirtyAmiCount at 30% AMI
    const sixty = totalCount - thirtyAmiCount;
    useGameStore.getState().setAmiUnit(30, thirtyAmiCount);
    useGameStore.getState().setAmiUnit(60, sixty);
    useGameStore.getState().setAmiUnit(80, 0);
    useGameStore.getState().setMarketUnits(0);

    // Jump to phase 5 then advance to 6
    useGameStore.setState({ phase: 5 });
    useGameStore.getState().advancePhase();
  }

  it('share ≥ 20%: +15 community', () => {
    const before = useGameStore.getState().entitlement.communitySupport;
    setupAndAdvance(10, 50);  // 20%
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before + 15);
  });

  it('share = 0.21: +15 community (boundary)', () => {
    const before = useGameStore.getState().entitlement.communitySupport;
    setupAndAdvance(11, 50);  // 22%
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before + 15);
  });

  it('share between 10% and 20%: no delta', () => {
    const before = useGameStore.getState().entitlement.communitySupport;
    setupAndAdvance(7, 50);  // 14%
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before);
  });

  it('share < 10%: −10 community', () => {
    const before = useGameStore.getState().entitlement.communitySupport;
    setupAndAdvance(4, 50);  // 8%
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before - 10);
  });
});
