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

  it('setCboPartner(true) first time bumps community support by 6', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    const before = useGameStore.getState().entitlement.communitySupport;
    useGameStore.getState().setCboPartner(true);
    const after = useGameStore.getState().entitlement.communitySupport;
    expect(after).toBe(before + 6);
  });

  it('setCboPartner(false) then setCboPartner(true) bumps community only once', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    const before = useGameStore.getState().entitlement.communitySupport;
    useGameStore.getState().setCboPartner(true);
    useGameStore.getState().setCboPartner(false);
    useGameStore.getState().setCboPartner(true);
    expect(useGameStore.getState().entitlement.communitySupport).toBe(before + 6);
  });

  it('initial state has Phase 2 fields at defaults', () => {
    const s = useGameStore.getState();
    expect(s.stack.lihtcResubmits).toBe(0);
    expect(s.stack.lihtcRevisions).toBe(0);
    expect(s.gapResolution.extraSubsidy).toBe(0);
    expect(s.gapResolution.shrinkBy).toBe(0);
    expect(s.gapResolution.lowerQualityUsed).toBe(false);
  });

  it('tickMonths uses effective units (shrinkBy) and lowerQuality multiplier', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    // baseline: 12 months → known escalation from Phase 1 tests
    useGameStore.getState().tickMonths(12);
    const baseline = useGameStore.getState().costEscalation;
    expect(baseline).toBeGreaterThan(1_000_000);
    // reset and apply shrinkBy via direct state poke to isolate tickMonths math
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState((s) => ({ gapResolution: { ...s.gapResolution, shrinkBy: 30 } }));
    useGameStore.getState().tickMonths(12);
    // effective units halved → escalation halved
    expect(useGameStore.getState().costEscalation).toBeCloseTo(baseline / 2, -3);
  });

  it('resubmitLihtc(true) increments lihtcResubmits and sets lihtcAwarded=true', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().submitLihtc(false); // initial denial
    useGameStore.getState().resubmitLihtc(true);
    const s = useGameStore.getState();
    expect(s.stack.lihtcResubmits).toBe(1);
    expect(s.stack.lihtcAwarded).toBe(true);
    expect(s.stack.lihtcSubmitted).toBe(true); // stays true from the first submit
  });

  it('resubmitLihtc(false) increments counter and keeps lihtcAwarded false', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().submitLihtc(false);
    useGameStore.getState().resubmitLihtc(false);
    useGameStore.getState().resubmitLihtc(false);
    const s = useGameStore.getState();
    expect(s.stack.lihtcResubmits).toBe(2);
    expect(s.stack.lihtcAwarded).toBe(false);
  });

  it('reviseLihtc(true) increments lihtcRevisions, applies penalties, sets lihtcAwarded', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().submitLihtc(false);
    const alderBefore = useGameStore.getState().entitlement.alderGoodwill;
    const communityBefore = useGameStore.getState().entitlement.communitySupport;
    useGameStore.getState().reviseLihtc(true);
    const s = useGameStore.getState();
    expect(s.stack.lihtcRevisions).toBe(1);
    expect(s.stack.lihtcAwarded).toBe(true);
    expect(s.entitlement.alderGoodwill).toBe(alderBefore - 4);
    expect(s.entitlement.communitySupport).toBe(communityBefore - 2);
  });

  it('reviseLihtc penalty floors at 0 (does not go negative)', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, alderGoodwill: 2, communitySupport: 1 },
    }));
    useGameStore.getState().reviseLihtc(false);
    const s = useGameStore.getState();
    expect(s.entitlement.alderGoodwill).toBe(0);
    expect(s.entitlement.communitySupport).toBe(0);
  });
});
