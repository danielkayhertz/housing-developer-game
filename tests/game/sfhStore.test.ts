import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('single-family modal store flag', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('defaults to closed', () => {
    expect(useGameStore.getState().sfhOpen).toBe(false);
  });

  it('openSfh opens, closeSfh closes', () => {
    useGameStore.getState().openSfh();
    expect(useGameStore.getState().sfhOpen).toBe(true);
    useGameStore.getState().closeSfh();
    expect(useGameStore.getState().sfhOpen).toBe(false);
  });

  it('reset() closes the modal', () => {
    useGameStore.getState().openSfh();
    useGameStore.getState().reset();
    expect(useGameStore.getState().sfhOpen).toBe(false);
  });
});
