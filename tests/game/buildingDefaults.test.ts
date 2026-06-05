import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('setBuildingType auto-applies unit defaults', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('walkup sets units to 24', () => {
    useGameStore.getState().setBuildingType('walkup');
    expect(useGameStore.getState().project.units).toBe(24);
  });

  it('midrise sets units to 50', () => {
    useGameStore.getState().setBuildingType('walkup');  // first move off the default
    useGameStore.getState().setBuildingType('midrise');
    expect(useGameStore.getState().project.units).toBe(50);
  });

  it('larger sets units to 80', () => {
    useGameStore.getState().setBuildingType('larger');
    expect(useGameStore.getState().project.units).toBe(80);
  });

  it('AMI breakdown rebalances proportionally after walkup', () => {
    useGameStore.getState().setBuildingType('walkup');
    const b = useGameStore.getState().proForma.amiBreakdown;
    // 24 units at 20/60/20 ratio: ~5/14/5 = 24
    expect(b[30] + b[60] + b[80]).toBe(24);
    // 30% AMI should be roughly 20% of units (allow for rounding ±1)
    expect(b[30]).toBeGreaterThanOrEqual(4);
    expect(b[30]).toBeLessThanOrEqual(6);
  });
});
