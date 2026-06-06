import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('selectNeighborhood reads per-neighborhood starting values', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('Englewood select sets 75/50', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    const s = useGameStore.getState();
    expect(s.entitlement.alderGoodwill).toBe(75);
    expect(s.entitlement.communitySupport).toBe(50);
  });

  it('Jefferson Park select sets 35/30', () => {
    useGameStore.getState().selectNeighborhood('jefferson-park');
    const s = useGameStore.getState();
    expect(s.entitlement.alderGoodwill).toBe(35);
    expect(s.entitlement.communitySupport).toBe(30);
  });

  it('Pilsen select sets 65/35', () => {
    useGameStore.getState().selectNeighborhood('pilsen');
    const s = useGameStore.getState();
    expect(s.entitlement.alderGoodwill).toBe(65);
    expect(s.entitlement.communitySupport).toBe(35);
  });

  it('Albany Park select sets 60/45', () => {
    useGameStore.getState().selectNeighborhood('albany-park');
    const s = useGameStore.getState();
    expect(s.entitlement.alderGoodwill).toBe(60);
    expect(s.entitlement.communitySupport).toBe(45);
  });
});

describe('useGameStore', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('starts in phase 1 with no neighborhood', () => {
    const state = useGameStore.getState();
    expect(state.phase).toBe(1);
    expect(state.project.neighborhood).toBe(null);
  });

  it('advancePhase increments phase and ceiling is 7', () => {
    const s = useGameStore.getState();
    s.advancePhase();
    expect(useGameStore.getState().phase).toBe(2);
    // From phase 2 advance to 7 (phase 4 skips to 6 when no neighborhood / gap=0)
    s.advancePhase(); s.advancePhase(); s.advancePhase(); s.advancePhase(); s.advancePhase();
    expect(useGameStore.getState().phase).toBe(7);
    // Stays at 7
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().phase).toBe(7);
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
    useGameStore.getState().advancePhase(); // 1->2
    useGameStore.getState().advancePhase(); // 2->3
    useGameStore.getState().advancePhase(); // 3->4
    useGameStore.getState().tickMonths(12);
    const s = useGameStore.getState();
    expect(s.monthsElapsed).toBe(12);
    // v3: −20% hard cost
    // hard = 60 * 448k * 1.0 = 26.88M
    // annual escalation = 26.88M * 0.05 * (1 + 0.27 + 0.05) = 26.88M * 0.05 * 1.32 = 1,774,080
    expect(s.costEscalation).toBeCloseTo(1_774_080, -3);
  });

  it('tickMonths(3) adds 3 months + 1/4 of annual escalation', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.getState().advancePhase(); // 1->2
    useGameStore.getState().advancePhase(); // 2->3
    useGameStore.getState().advancePhase(); // 3->4
    useGameStore.getState().tickMonths(3);
    const s = useGameStore.getState();
    expect(s.monthsElapsed).toBe(3);
    // v3: −20% hard cost; annual escalation = 1,774,080 → quarterly = 443,520
    expect(s.costEscalation).toBeCloseTo(1_774_080 / 4, -3);
  });

  it('reset returns to initial state', () => {
    useGameStore.getState().advancePhase();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().reset();
    expect(useGameStore.getState().phase).toBe(1);
    expect(useGameStore.getState().project.neighborhood).toBe(null);
  });

  it('initial units = 50 (midrise default)', () => {
    useGameStore.getState().reset();
    expect(useGameStore.getState().project.units).toBe(50);
  });

  it('initial AMI breakdown sums to 50 with 20/60/20 ratio', () => {
    useGameStore.getState().reset();
    const b = useGameStore.getState().proForma.amiBreakdown;
    expect(b[30]).toBe(10);
    expect(b[60]).toBe(30);
    expect(b[80]).toBe(10);
    expect(b[30] + b[60] + b[80]).toBe(50);
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
    useGameStore.getState().advancePhase(); // 1->2
    useGameStore.getState().advancePhase(); // 2->3
    useGameStore.getState().advancePhase(); // 3->4
    // baseline: 12 months → known escalation from Phase 1 tests
    useGameStore.getState().tickMonths(12);
    const baseline = useGameStore.getState().costEscalation;
    expect(baseline).toBeGreaterThan(1_000_000);
    // reset and apply shrinkBy via direct state poke to isolate tickMonths math
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState((s) => ({ phase: 4, gapResolution: { ...s.gapResolution, shrinkBy: 30 } }));
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

  it('advancePhase from phase 4 with large gap routes to phase 5 (GapResolution)', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState({ phase: 4 });
    // No sources awarded → gap is large
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().phase).toBe(5);
  });

  it('advancePhase from phase 4 with closed gap routes to phase 6 (Entitlement)', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState({ phase: 4 });
    // Add enough extraSubsidy to push gap below threshold
    useGameStore.setState((s) => ({
      gapResolution: { ...s.gapResolution, extraSubsidy: 100_000_000 },
    }));
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().phase).toBe(6);
  });

  it('advancePhase from phase 5 goes to phase 6 (Entitlement) unconditionally', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.setState({ phase: 5 });
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().phase).toBe(6);
  });

  it('advancePhase from phase 6 goes to phase 7 (Close)', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.setState({ phase: 6 });
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().phase).toBe(7);
  });

  it('advancePhase ceiling is 7 (cannot go past Close)', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.setState({ phase: 7 });
    useGameStore.getState().advancePhase();
    expect(useGameStore.getState().phase).toBe(7);
  });

  describe('lastRecap', () => {
    it('starts as null', () => {
      expect(useGameStore.getState().lastRecap).toBeNull();
    });

    it('tickMonths(3) sets lastRecap with correct month count and escalationAdded', () => {
      useGameStore.getState().selectNeighborhood('englewood');
      useGameStore.getState().setUnits(60);
      useGameStore.getState().advancePhase(); // 1->2
      useGameStore.getState().advancePhase(); // 2->3
      useGameStore.getState().advancePhase(); // 3->4
      useGameStore.getState().tickMonths(3);
      const recap = useGameStore.getState().lastRecap;
      expect(recap).not.toBeNull();
      expect(recap!.months).toBe(3);
      // v3: −20% hard cost; escalationAdded = (60 * 448k * 1.0 * 1.32 * 0.05 / 12) * 3 ≈ 443,520
      expect(recap!.escalationAdded).toBeCloseTo(443_520, -2);
    });

    it('tickMonths(2) does NOT set lastRecap', () => {
      useGameStore.getState().selectNeighborhood('englewood');
      useGameStore.getState().setUnits(60);
      useGameStore.getState().tickMonths(2);
      expect(useGameStore.getState().lastRecap).toBeNull();
    });

    it('clearRecap sets lastRecap to null', () => {
      useGameStore.getState().selectNeighborhood('englewood');
      useGameStore.getState().setUnits(60);
      useGameStore.getState().tickMonths(6);
      expect(useGameStore.getState().lastRecap).not.toBeNull();
      useGameStore.getState().clearRecap();
      expect(useGameStore.getState().lastRecap).toBeNull();
    });

    it('reset clears lastRecap', () => {
      useGameStore.getState().selectNeighborhood('englewood');
      useGameStore.getState().setUnits(60);
      useGameStore.getState().tickMonths(12);
      useGameStore.getState().reset();
      expect(useGameStore.getState().lastRecap).toBeNull();
    });
  });

  describe('retreatPhase', () => {
    it('decrements phase by 1', () => {
      useGameStore.getState().advancePhase(); // → 2
      useGameStore.getState().advancePhase(); // → 3
      useGameStore.getState().retreatPhase(); // → 2
      expect(useGameStore.getState().phase).toBe(2);
    });

    it('does not go below phase 1', () => {
      expect(useGameStore.getState().phase).toBe(1);
      useGameStore.getState().retreatPhase();
      expect(useGameStore.getState().phase).toBe(1);
    });
  });
});

describe('cost escalation gating by phase (v4 item 6)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('tickMonths in phase 3 (Pro Forma) advances months but does not add cost escalation', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    // Move to phase 3 (Site & Concept → Pro Forma)
    useGameStore.getState().advancePhase(); // 1 -> 2
    useGameStore.getState().advancePhase(); // 2 -> 3
    expect(useGameStore.getState().phase).toBe(3);
    useGameStore.getState().tickMonths(6);
    expect(useGameStore.getState().monthsElapsed).toBe(6);
    expect(useGameStore.getState().costEscalation).toBe(0);
  });

  it('tickMonths in phase 4 (Capital Stack) accrues cost escalation', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().advancePhase(); // 1->2
    useGameStore.getState().advancePhase(); // 2->3
    useGameStore.getState().advancePhase(); // 3->4
    expect(useGameStore.getState().phase).toBe(4);
    useGameStore.getState().tickMonths(12);
    expect(useGameStore.getState().costEscalation).toBeGreaterThan(0);
  });
});
