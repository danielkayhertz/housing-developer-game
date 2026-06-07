import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';
import { computeEffectiveGap } from '../../src/game/gapResolution';
import { computeTdcFromState } from '../../src/game/proForma';

describe('computeEffectiveGap canonical cost base', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('tdcBase equals computeTdcFromState.total for a walk-up', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setBuildingType('walkup'); // resets units to type default; set units after
    useGameStore.getState().setUnits(40);
    const state = useGameStore.getState();
    const eg = computeEffectiveGap(state);
    expect(eg.tdcBase).toBe(computeTdcFromState(state).total);
  });

  it('land applies the building multiplier (walk-up 1.25)', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setBuildingType('walkup');
    useGameStore.getState().setUnits(40);
    const eg = computeEffectiveGap(useGameStore.getState());
    // Englewood land $12,000/u × 1.25 × 40 effective units
    expect(eg.land).toBe(12_000 * 1.25 * 40);
  });
});
