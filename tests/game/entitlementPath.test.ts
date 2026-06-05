import { describe, it, expect } from 'vitest';
import { stepsByPath } from '../../src/screens/Entitlement';   // export the map for testability

describe('STEPS_BY_PATH', () => {
  it('by-right runs steps 1, 2, 4 (skips 3 Committee on Zoning)', () => {
    expect(stepsByPath['by-right']).toEqual([1, 2, 4]);
  });

  it('zma runs steps 1-4', () => {
    expect(stepsByPath.zma).toEqual([1, 2, 3, 4]);
  });

  it('pd runs steps 1-4', () => {
    expect(stepsByPath.pd).toEqual([1, 2, 3, 4]);
  });
});
