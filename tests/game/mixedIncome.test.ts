import { describe, it, expect } from 'vitest';
import { computeNoi } from '../../src/game/proForma';
import { getNeighborhood } from '../../src/data/neighborhoods';

describe('mixed-income mechanics', () => {
  it('marketUnits raises NOI compared to all-affordable baseline', () => {
    const pilsen = getNeighborhood('pilsen');
    const amiBreakdown = { 30: 10, 60: 30, 80: 10 };
    const marketRent = pilsen.marketRentPerUnit;

    const baselineNoi = computeNoi({
      amiBreakdown,
      marketUnits: 0,
      marketRent,
      opexRatio: 0.40,
      vacancyRatio: 0.07,
    });

    const mixedNoi = computeNoi({
      amiBreakdown,
      marketUnits: 10,
      marketRent,
      opexRatio: 0.40,
      vacancyRatio: 0.07,
    });

    expect(mixedNoi).toBeGreaterThan(baselineNoi);
  });
});
