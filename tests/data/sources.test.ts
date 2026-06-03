import { describe, it, expect } from 'vitest';
import { sources, getSource } from '../../src/data/sources';

describe('sources', () => {
  it('has exactly 12 funding sources', () => {
    expect(sources).toHaveLength(12);
  });

  it('9% LIHTC takes 280 days', () => {
    expect(getSource('9-lihtc').daysToProcess).toBe(280);
  });

  it('DOH loan takes 45 days', () => {
    expect(getSource('doh-loan').daysToProcess).toBe(45);
  });

  it('TIF takes 90 days and costs alder goodwill', () => {
    const tif = getSource('tif');
    expect(tif.daysToProcess).toBe(90);
    expect(tif.alderGoodwillCost).toBeGreaterThan(0);
  });

  it('HED Bond takes 90 days and costs alder goodwill', () => {
    const hed = getSource('hed-bond');
    expect(hed.daysToProcess).toBe(90);
    expect(hed.alderGoodwillCost).toBeGreaterThan(0);
  });

  it('Deferred developer fee costs 0 days', () => {
    expect(getSource('deferred-dev-fee').daysToProcess).toBe(0);
  });
});
