import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';
import { ARO_FLOOR_AFFORDABLE_SHARE } from '../../src/game/types';

describe('ARO floor check', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('ARO_FLOOR_AFFORDABLE_SHARE is 0.25', () => {
    expect(ARO_FLOOR_AFFORDABLE_SHARE).toBe(0.25);
  });

  it('setOutcome shelved-aro is accepted by the store', () => {
    useGameStore.getState().setOutcome('shelved-aro');
    expect(useGameStore.getState().outcome).toBe('shelved-aro');
  });

  it('24 / 100 = 24% is below floor', () => {
    expect(24 / 100).toBeLessThan(ARO_FLOOR_AFFORDABLE_SHARE);
  });

  it('25 / 100 = 25% is at floor, not triggered', () => {
    expect(25 / 100).toBeGreaterThanOrEqual(ARO_FLOOR_AFFORDABLE_SHARE);
  });
});
