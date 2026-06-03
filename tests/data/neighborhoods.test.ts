import { describe, it, expect } from 'vitest';
import { neighborhoods, getNeighborhood } from '../../src/data/neighborhoods';

describe('neighborhoods', () => {
  it('has all 4 neighborhoods', () => {
    expect(neighborhoods).toHaveLength(4);
  });

  it('Englewood is marked MVP', () => {
    expect(getNeighborhood('englewood').status).toBe('mvp');
  });

  it('other 3 are marked stub', () => {
    expect(getNeighborhood('pilsen').status).toBe('stub');
    expect(getNeighborhood('lakeview').status).toBe('stub');
    expect(getNeighborhood('albany-park').status).toBe('stub');
  });

  it('Englewood has $12k land cost per unit', () => {
    expect(getNeighborhood('englewood').landCostPerUnit).toBe(12_000);
  });

  it('Englewood has supportive alder (green tone)', () => {
    expect(getNeighborhood('englewood').alderTone).toBe('green');
  });
});
