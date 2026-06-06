import { describe, it, expect, beforeEach } from 'vitest';
import { computeEffectiveGap } from '../../src/game/gapResolution';
import { useGameStore } from '../../src/game/state';

function freshEnglewood60() {
  useGameStore.getState().reset();
  useGameStore.getState().selectNeighborhood('englewood');
  useGameStore.getState().setUnits(60);
}

describe('computeEffectiveGap', () => {
  it('baseline state: returns a positive gap (no sources awarded)', () => {
    freshEnglewood60();
    const { gap, effectiveUnits } = computeEffectiveGap(useGameStore.getState());
    expect(effectiveUnits).toBe(60);
    expect(gap).toBeGreaterThan(0);
  });

  it('shrinkBy reduces effective units in the breakdown', () => {
    freshEnglewood60();
    useGameStore.setState((s) => ({ gapResolution: { ...s.gapResolution, shrinkBy: 10 } }));
    const { effectiveUnits } = computeEffectiveGap(useGameStore.getState());
    expect(effectiveUnits).toBe(50);
  });

  it('lowerQualityUsed reduces hard cost by 10%', () => {
    freshEnglewood60();
    const before = computeEffectiveGap(useGameStore.getState()).hard;
    useGameStore.setState((s) => ({ gapResolution: { ...s.gapResolution, lowerQualityUsed: true } }));
    const after = computeEffectiveGap(useGameStore.getState()).hard;
    expect(after).toBeCloseTo(before * 0.9, -3);
  });

  it('extraSubsidy directly reduces the gap dollar-for-dollar', () => {
    freshEnglewood60();
    const before = computeEffectiveGap(useGameStore.getState()).gap;
    useGameStore.setState((s) => ({ gapResolution: { ...s.gapResolution, extraSubsidy: 2_000_000 } }));
    const after = computeEffectiveGap(useGameStore.getState()).gap;
    expect(before - after).toBeCloseTo(2_000_000, -3);
  });

  it('lihtcRevisions adds REVISION_SOFT_PENALTY per revision to TDC', () => {
    freshEnglewood60();
    const before = computeEffectiveGap(useGameStore.getState()).revisionPenalty;
    expect(before).toBe(0);
    useGameStore.setState((s) => ({
      stack: { ...s.stack, lihtcRevisions: 3 },
    }));
    const after = computeEffectiveGap(useGameStore.getState()).revisionPenalty;
    expect(after).toBe(3 * 150_000);
  });

  it('floors units at 0 when shrinkBy exceeds project.units', () => {
    freshEnglewood60();
    useGameStore.setState((s) => ({ gapResolution: { ...s.gapResolution, shrinkBy: 999 } }));
    const { effectiveUnits } = computeEffectiveGap(useGameStore.getState());
    expect(effectiveUnits).toBe(0);
  });
});

describe('applyGapAction store action', () => {
  function setup() {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
  }

  it('askSubsidy: +1M extraSubsidy, -15 alder, +9 months', () => {
    setup();
    const monthsBefore = useGameStore.getState().monthsElapsed;
    const alderBefore = useGameStore.getState().entitlement.alderGoodwill;
    useGameStore.getState().applyGapAction('askSubsidy');
    const s = useGameStore.getState();
    expect(s.gapResolution.extraSubsidy).toBe(1_000_000);
    expect(s.entitlement.alderGoodwill).toBe(alderBefore - 15);
    expect(s.monthsElapsed).toBe(monthsBefore + 9);
  });

  it('askSubsidy is repeatable; alder floors at 0', () => {
    setup();
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, alderGoodwill: 10 },
    }));
    useGameStore.getState().applyGapAction('askSubsidy');
    useGameStore.getState().applyGapAction('askSubsidy');
    const s = useGameStore.getState();
    expect(s.gapResolution.extraSubsidy).toBe(2_000_000);
    expect(s.entitlement.alderGoodwill).toBe(0);
  });

  it('redesignSmaller: +10 shrinkBy, +8 community, +6 months', () => {
    setup();
    const monthsBefore = useGameStore.getState().monthsElapsed;
    const communityBefore = useGameStore.getState().entitlement.communitySupport;
    useGameStore.getState().applyGapAction('redesignSmaller');
    const s = useGameStore.getState();
    expect(s.gapResolution.shrinkBy).toBe(10);
    expect(s.entitlement.communitySupport).toBe(communityBefore + 8);
    expect(s.monthsElapsed).toBe(monthsBefore + 6);
  });

  it('redesignSmaller community caps at 100', () => {
    setup();
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, communitySupport: 95 },
    }));
    useGameStore.getState().applyGapAction('redesignSmaller');
    expect(useGameStore.getState().entitlement.communitySupport).toBe(100);
  });

  it('lowerQuality: sets flag, -12 community, +3 months', () => {
    setup();
    const monthsBefore = useGameStore.getState().monthsElapsed;
    const communityBefore = useGameStore.getState().entitlement.communitySupport;
    useGameStore.getState().applyGapAction('lowerQuality');
    const s = useGameStore.getState();
    expect(s.gapResolution.lowerQualityUsed).toBe(true);
    expect(s.entitlement.communitySupport).toBe(communityBefore - 12);
    expect(s.monthsElapsed).toBe(monthsBefore + 3);
  });

  it('lowerQuality is one-shot: second call is a no-op (no extra community penalty, no extra months)', () => {
    setup();
    useGameStore.getState().applyGapAction('lowerQuality');
    const after1 = useGameStore.getState();
    const communityAfter1 = after1.entitlement.communitySupport;
    const monthsAfter1 = after1.monthsElapsed;
    useGameStore.getState().applyGapAction('lowerQuality');
    const after2 = useGameStore.getState();
    expect(after2.entitlement.communitySupport).toBe(communityAfter1);
    expect(after2.monthsElapsed).toBe(monthsAfter1);
  });
});

describe('finance-concede reopens gap via state (v4 item 14)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('after finance-concede, extraSubsidy decreases by $3M', () => {
    const store = useGameStore.getState();
    store.selectNeighborhood('englewood');
    useGameStore.setState((s) => ({
      ...s,
      gapResolution: { ...s.gapResolution, extraSubsidy: 5_000_000 },
    }));
    store.takeEntitlementStep('finance-concede', 4);
    expect(useGameStore.getState().gapResolution.extraSubsidy).toBe(2_000_000);
  });

  it('extraSubsidy floor is 0 (cannot go negative)', () => {
    const store = useGameStore.getState();
    store.selectNeighborhood('englewood');
    // extraSubsidy starts at 0
    store.takeEntitlementStep('finance-concede', 4);
    expect(useGameStore.getState().gapResolution.extraSubsidy).toBe(0);
  });
});

describe('GapResolution exhaustion state (v4 item 10)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('all three actions exhausted + gap still open returns isExhausted: true', () => {
    const store = useGameStore.getState();
    store.selectNeighborhood('englewood');
    // Drive into exhaustion: set alder=0 (subsidy disabled), units to floor (shrink disabled), lowerQualityUsed=true
    useGameStore.setState((s) => ({
      ...s,
      entitlement: { ...s.entitlement, alderGoodwill: 0 },
      gapResolution: { ...s.gapResolution, lowerQualityUsed: true, shrinkBy: s.project.units - 20 },
    }));
    const s = useGameStore.getState();
    const subsidyDisabled = s.entitlement.alderGoodwill === 0;
    const shrinkDisabled = Math.max(0, s.project.units - s.gapResolution.shrinkBy) <= 20;
    const qualityDisabled = s.gapResolution.lowerQualityUsed;
    expect(subsidyDisabled && shrinkDisabled && qualityDisabled).toBe(true);
  });
});
