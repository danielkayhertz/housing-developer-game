import { describe, it, expect } from 'vitest';
import { computeTdc } from '../../src/game/proForma';

describe('land cost multiplier by building type', () => {
  const baseInput = {
    neighborhood: 'englewood' as const,
    units: 50,
    finishLevel: 'standard' as const,
  };

  it('walkup multiplies Englewood land by 1.25', () => {
    const tdc = computeTdc({ ...baseInput, buildingType: 'walkup' });
    // 12_000 * 1.25 * 50 = 750_000
    expect(tdc.land).toBe(750_000);
  });

  it('midrise multiplies Englewood land by 1.0', () => {
    const tdc = computeTdc({ ...baseInput, buildingType: 'midrise' });
    // 12_000 * 1.0 * 50 = 600_000
    expect(tdc.land).toBe(600_000);
  });

  it('larger multiplies Englewood land by 0.75', () => {
    const tdc = computeTdc({ ...baseInput, buildingType: 'larger' });
    // 12_000 * 0.75 * 50 = 450_000
    expect(tdc.land).toBe(450_000);
  });

  it('multiplier applies in Jefferson Park ($110k base)', () => {
    const tdc = computeTdc({
      neighborhood: 'jefferson-park',
      units: 24,
      buildingType: 'walkup',
      finishLevel: 'standard',
    });
    // 110_000 * 1.25 * 24 = 3_300_000
    expect(tdc.land).toBe(3_300_000);
  });
});
