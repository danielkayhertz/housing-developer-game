import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('starts in phase 1 with no neighborhood', () => {
    const state = useGameStore.getState();
    expect(state.phase).toBe(1);
    expect(state.project.neighborhood).toBe(null);
  });

  it('advancePhase increments phase up to 6', () => {
    const s = useGameStore.getState();
    s.advancePhase();
    expect(useGameStore.getState().phase).toBe(2);
    s.advancePhase(); s.advancePhase(); s.advancePhase(); s.advancePhase(); s.advancePhase();
    expect(useGameStore.getState().phase).toBe(6);
    // Stays at 6
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().phase).toBe(6);
  });

  it('selectNeighborhood records id', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    expect(useGameStore.getState().project.neighborhood).toBe('englewood');
  });

  it('setUnits updates project unit count', () => {
    useGameStore.getState().setUnits(80);
    expect(useGameStore.getState().project.units).toBe(80);
  });

  it('tickYear adds 1 year + cost escalation', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().tickYear();
    const s = useGameStore.getState();
    expect(s.yearsElapsed).toBe(1);
    expect(s.costEscalation).toBeGreaterThan(0);
  });

  it('reset returns to initial state', () => {
    useGameStore.getState().advancePhase();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().reset();
    expect(useGameStore.getState().phase).toBe(1);
    expect(useGameStore.getState().project.neighborhood).toBe(null);
  });
});
