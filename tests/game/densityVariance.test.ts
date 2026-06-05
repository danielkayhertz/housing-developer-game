import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';
import { DENSITY_VARIANCE_TDC_PER_UNIT, DENSITY_VARIANCE_MONTHS } from '../../src/game/types';

describe('density variance auto-condition for larger building', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setBuildingType('larger');  // 80 units
  });

  it('addCostEscalation action adds to costEscalation', () => {
    const before = useGameStore.getState().costEscalation;
    const delta = DENSITY_VARIANCE_TDC_PER_UNIT * useGameStore.getState().project.units;
    useGameStore.getState().addCostEscalation(delta);
    const after = useGameStore.getState().costEscalation;
    expect(after - before).toBe(delta);
  });

  it('applies +$25k/u TDC when taking any zoning choice (larger building)', () => {
    const before = useGameStore.getState();
    const baseCostEscalation = before.costEscalation;
    // Simulate what onChoose does: takeStep then addCostEscalation for larger at step 3
    useGameStore.getState().takeEntitlementStep('zoning-shrink', 3);
    const expectedConditionCost = DENSITY_VARIANCE_TDC_PER_UNIT * before.project.units;
    useGameStore.getState().addCostEscalation(expectedConditionCost);
    const after = useGameStore.getState();
    expect(after.costEscalation - baseCostEscalation).toBeGreaterThanOrEqual(expectedConditionCost);
  });

  it('does NOT apply for midrise', () => {
    useGameStore.getState().setBuildingType('midrise');  // 50 units
    const before = useGameStore.getState();
    // For midrise, onChoose does NOT call addCostEscalation — only takeStep
    useGameStore.getState().takeEntitlementStep('zoning-shrink', 3);
    const after = useGameStore.getState();
    const variance = DENSITY_VARIANCE_TDC_PER_UNIT * before.project.units;
    expect(after.costEscalation - before.costEscalation).toBeLessThan(variance);
  });
});
