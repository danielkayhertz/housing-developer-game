import { describe, it, expect } from 'vitest';
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
