import { describe, it, expect } from 'vitest';
import { neighborhoods, getNeighborhood } from '../../src/data/neighborhoods';

describe('v3 neighborhood data', () => {
  it('all four neighborhoods are mvp status', () => {
    expect(neighborhoods).toHaveLength(4);
    for (const n of neighborhoods) expect(n.status).toBe('mvp');
  });

  it('Englewood starts at 75 alder / 50 community, green tone', () => {
    const n = getNeighborhood('englewood');
    expect(n.startingAlderGoodwill).toBe(75);
    expect(n.startingCommunitySupport).toBe(50);
    expect(n.alderTone).toBe('green');
    expect(n.tifAvailable).toBe(true);
    expect(n.hooks.pilsenDeepThirtyAmiBonus).toBeFalsy();
    expect(n.hooks.jeffersonParkParkingChoice).toBeFalsy();
    expect(n.hooks.albanyParkMultilingualChoice).toBeFalsy();
  });

  it('Pilsen starts at 65/35, yellow tone, deep-30 bonus hook', () => {
    const n = getNeighborhood('pilsen');
    expect(n.startingAlderGoodwill).toBe(65);
    expect(n.startingCommunitySupport).toBe(35);
    expect(n.alderTone).toBe('yellow');
    expect(n.alderName).toBe('Carlos Reyes');
    expect(n.landCostPerUnit).toBe(60_000);
    expect(n.marketRentPerUnit).toBe(2_100);
    expect(n.tifAvailable).toBe(true);
    expect(n.hooks.pilsenDeepThirtyAmiBonus).toBe(true);
  });

  it('Jefferson Park starts at 35/30, red tone, no TIF, parking + SFR hooks', () => {
    const n = getNeighborhood('jefferson-park');
    expect(n.startingAlderGoodwill).toBe(35);
    expect(n.startingCommunitySupport).toBe(30);
    expect(n.alderTone).toBe('red');
    expect(n.alderName).toBe('Frank Kovac');
    expect(n.landCostPerUnit).toBe(110_000);
    expect(n.marketRentPerUnit).toBe(2_900);
    expect(n.tifAvailable).toBe(false);
    expect(n.hooks.jeffersonParkParkingChoice).toBe(true);
    expect(n.hooks.jeffersonParkSfrOnly).toBe(true);
  });

  it('Albany Park starts at 60/45, yellow tone, multilingual + CBO-amplified hooks', () => {
    const n = getNeighborhood('albany-park');
    expect(n.startingAlderGoodwill).toBe(60);
    expect(n.startingCommunitySupport).toBe(45);
    expect(n.alderTone).toBe('yellow');
    expect(n.alderName).toBe('Naila Hassan');
    expect(n.landCostPerUnit).toBe(55_000);
    expect(n.marketRentPerUnit).toBe(1_800);
    expect(n.tifAvailable).toBe(true);
    expect(n.hooks.albanyParkMultilingualChoice).toBe(true);
    expect(n.hooks.albanyParkCboAmplified).toBe(true);
  });
});
