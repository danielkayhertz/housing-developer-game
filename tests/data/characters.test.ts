import { describe, it, expect } from 'vitest';
import { carlosLines, frankLines, nailaLines, davidLines } from '../../src/data/characters';

describe('v3 character lines', () => {
  it('Carlos Reyes has all required slots', () => {
    expect(carlosLines.greeting).toBeTruthy();
    expect(carlosLines.bonusFired).toBeTruthy();
    expect(carlosLines.closingHigh).toBeTruthy();
    expect(carlosLines.closingMid).toBeTruthy();
    expect(carlosLines.closingLow).toBeTruthy();
    expect(carlosLines.shelvedAlder).toBeTruthy();
  });

  it('Frank Kovac has all required slots', () => {
    for (const key of ['greeting', 'parkingAccepted', 'parkingMinimal', 'parkingRefused', 'closingHigh', 'closingMid', 'closingLow', 'shelvedAlder']) {
      expect((frankLines as any)[key], `frankLines.${key}`).toBeTruthy();
    }
  });

  it('Naila Hassan has all required slots', () => {
    for (const key of ['greeting', 'multilingualChoice', 'closingHigh', 'closingMid', 'closingLow', 'shelvedAlder']) {
      expect((nailaLines as any)[key], `nailaLines.${key}`).toBeTruthy();
    }
  });

  it('David Park has shelvedAro line', () => {
    expect(davidLines.shelvedAro).toBeTruthy();
  });
});
