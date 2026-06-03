import { describe, it, expect } from 'vitest';
import { aroMinimumFraction } from '../../src/data/aro';

describe('aroMinimumFraction', () => {
  it('returns 0.20 for 40+ unit Englewood project', () => {
    expect(aroMinimumFraction('englewood', 60)).toBe(0.20);
  });

  it('returns 0.20 for 40+ unit Pilsen project', () => {
    expect(aroMinimumFraction('pilsen', 60)).toBe(0.20);
  });

  it('returns 0.20 for 40+ unit Lakeview project', () => {
    expect(aroMinimumFraction('lakeview', 60)).toBe(0.20);
  });

  it('returns 0.20 for 40+ unit Albany Park project', () => {
    expect(aroMinimumFraction('albany-park', 60)).toBe(0.20);
  });
});
