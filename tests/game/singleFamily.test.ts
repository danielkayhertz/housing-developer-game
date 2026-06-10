import { describe, it, expect } from 'vitest';
import { computeSfhDeal, aroAffordableCount } from '../../src/game/singleFamily';

describe('aroAffordableCount', () => {
  it('is 0 at or below 10 units', () => {
    expect(aroAffordableCount(10)).toBe(0);
    expect(aroAffordableCount(1)).toBe(0);
  });
  it('is 2 for 11-14 units and 3 only at 15 (floor of 20%)', () => {
    expect(aroAffordableCount(11)).toBe(2);
    expect(aroAffordableCount(14)).toBe(2);
    expect(aroAffordableCount(15)).toBe(3);
  });
});

describe('computeSfhDeal — buildable high-cost deals', () => {
  it('Jefferson Park 1 unit: $800k profit, construction-bound loan', () => {
    const d = computeSfhDeal('jefferson-park', 1);
    expect(d.totalTDC).toBe(500_000);
    expect(d.salesRevenue).toBe(1_300_000);
    expect(d.loan).toBe(400_000);
    expect(d.loanBinding).toBe('construction');
    expect(d.equity).toBe(100_000);
    expect(d.gap).toBe(0);
    expect(d.profit).toBe(800_000);
    expect(d.needsSubsidy).toBe(false);
    expect(d.requiresZoning).toBe(false);
    expect(d.aroTriggered).toBe(false);
  });

  it('Jefferson Park 15 units: ARO 3 affordable, $5.25M profit', () => {
    const d = computeSfhDeal('jefferson-park', 15);
    expect(d.aroAffordableCount).toBe(3);
    expect(d.marketUnits).toBe(12);
    expect(d.totalTDC).toBe(4_500_000);
    // 12 × $750k + 3 × $250k = $9.0M + $0.75M = $9.75M
    expect(d.salesRevenue).toBe(9_750_000);
    expect(d.loan).toBe(3_600_000);
    expect(d.profit).toBe(5_250_000);
    expect(d.requiresZoning).toBe(true);
    expect(d.aroTriggered).toBe(true);
    expect(d.needsSubsidy).toBe(false);
  });

  it('Albany Park 5 units: $2.25M profit, no zoning/ARO', () => {
    const d = computeSfhDeal('albany-park', 5);
    expect(d.totalTDC).toBe(1_750_000);
    expect(d.salesRevenue).toBe(4_000_000);
    expect(d.loan).toBe(1_400_000);
    expect(d.equity).toBe(350_000);
    expect(d.profit).toBe(2_250_000);
    expect(d.requiresZoning).toBe(false);
  });
});

describe('computeSfhDeal — Englewood always dead-ends', () => {
  it('1 unit: TDC exceeds sales → needsSubsidy', () => {
    const d = computeSfhDeal('englewood', 1);
    expect(d.totalTDC).toBe(500_000);
    expect(d.salesRevenue).toBe(400_000);
    expect(d.profit).toBe(-100_000);
    expect(d.needsSubsidy).toBe(true);
    expect(d.loanBinding).toBe('sales');
  });

  it('15 units: ARO 3 affordable, still needsSubsidy', () => {
    const d = computeSfhDeal('englewood', 15);
    expect(d.aroAffordableCount).toBe(3);
    expect(d.totalTDC).toBe(4_500_000);
    // 12 × $275k + 3 × $250k = $3.3M + $0.75M = $4.05M
    expect(d.salesRevenue).toBe(4_050_000);
    expect(d.needsSubsidy).toBe(true);
  });
});

describe('computeSfhDeal — flags at boundaries', () => {
  it('requiresZoning turns on above 5 units', () => {
    expect(computeSfhDeal('pilsen', 5).requiresZoning).toBe(false);
    expect(computeSfhDeal('pilsen', 6).requiresZoning).toBe(true);
  });
  it('aroTriggered turns on above 10 units', () => {
    expect(computeSfhDeal('pilsen', 10).aroTriggered).toBe(false);
    expect(computeSfhDeal('pilsen', 11).aroTriggered).toBe(true);
  });
});
