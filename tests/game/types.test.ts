import { describe, it, expect } from 'vitest';
import {
  HARD_COST_PER_UNIT,
  LAND_COST_BUILDING_MULTIPLIER,
  UNIT_DEFAULTS_BY_BUILDING_TYPE,
  MIXED_INCOME_QAP_PENALTY,
  ARO_FLOOR_AFFORDABLE_SHARE,
  DENSITY_VARIANCE_TDC_PER_UNIT,
  DENSITY_VARIANCE_MONTHS,
} from '../../src/game/types';

describe('v3 constants', () => {
  it('HARD_COST_PER_UNIT reduced 20% from v2 values', () => {
    expect(HARD_COST_PER_UNIT.walkup).toBe(376_000);
    expect(HARD_COST_PER_UNIT.midrise).toBe(448_000);
    expect(HARD_COST_PER_UNIT.larger).toBe(496_000);
  });

  it('LAND_COST_BUILDING_MULTIPLIER scales by density', () => {
    expect(LAND_COST_BUILDING_MULTIPLIER.walkup).toBe(1.25);
    expect(LAND_COST_BUILDING_MULTIPLIER.midrise).toBe(1.00);
    expect(LAND_COST_BUILDING_MULTIPLIER.larger).toBe(0.75);
  });

  it('UNIT_DEFAULTS_BY_BUILDING_TYPE has the right defaults', () => {
    expect(UNIT_DEFAULTS_BY_BUILDING_TYPE.walkup).toBe(24);
    expect(UNIT_DEFAULTS_BY_BUILDING_TYPE.midrise).toBe(50);
    expect(UNIT_DEFAULTS_BY_BUILDING_TYPE.larger).toBe(80);
  });

  it('mixed-income / ARO / density-variance constants set', () => {
    expect(MIXED_INCOME_QAP_PENALTY).toBe(12);
    expect(ARO_FLOOR_AFFORDABLE_SHARE).toBe(0.25);
    expect(DENSITY_VARIANCE_TDC_PER_UNIT).toBe(25_000);
    expect(DENSITY_VARIANCE_MONTHS).toBe(3);
  });
});
