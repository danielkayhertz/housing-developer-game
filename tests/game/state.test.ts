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

  it('tickMonths(12) adds 12 months + ~5% annual cost escalation', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().tickMonths(12);
    const s = useGameStore.getState();
    expect(s.monthsElapsed).toBe(12);
    // hard = 60 * 560k * 1.0 = 33.6M
    // annual escalation = 33.6M * 0.05 * (1 + 0.27 + 0.05) = 33.6M * 0.05 * 1.32 = 2,217,600
    expect(s.costEscalation).toBeCloseTo(2_217_600, -3);
  });

  it('tickMonths(3) adds 3 months + 1/4 of annual escalation', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().tickMonths(3);
    const s = useGameStore.getState();
    expect(s.monthsElapsed).toBe(3);
    expect(s.costEscalation).toBeCloseTo(2_217_600 / 4, -3);
  });

  it('reset returns to initial state', () => {
    useGameStore.getState().advancePhase();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().reset();
    expect(useGameStore.getState().phase).toBe(1);
    expect(useGameStore.getState().project.neighborhood).toBe(null);
  });

  it('starts with hasCboPartner=false and cboTimePaid=false', () => {
    const s = useGameStore.getState();
    expect(s.project.hasCboPartner).toBe(false);
    expect(s.project.cboTimePaid).toBe(false);
  });

  it('setCboPartner(true) the first time pays 6 months and sets cboTimePaid', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().setCboPartner(true);
    const s = useGameStore.getState();
    expect(s.project.hasCboPartner).toBe(true);
    expect(s.project.cboTimePaid).toBe(true);
    expect(s.monthsElapsed).toBe(6);
  });

  it('setCboPartner(false) then setCboPartner(true) only pays the 6 months once', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().setCboPartner(true);
    useGameStore.getState().setCboPartner(false);
    useGameStore.getState().setCboPartner(true);
    const s = useGameStore.getState();
    expect(s.project.hasCboPartner).toBe(true);
    expect(s.project.cboTimePaid).toBe(true);
    expect(s.monthsElapsed).toBe(6); // unchanged after first payment
  });
});
