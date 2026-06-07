import { describe, it, expect } from 'vitest';
import { carlosLines, frankLines, nailaLines, davidLines, characters, getNeighborhoodAlderId } from '../../src/data/characters';

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

describe('Powell character renamed to Cunningham', () => {
  it("powell character's display name is 'Ald. Cunningham'", () => {
    expect(characters.powell.name).toBe('Ald. Cunningham');
  });
});

describe('v5 — new neighborhood alder characters', () => {
  it('characters map includes carlos / frank / naila with non-empty fields', () => {
    for (const id of ['carlos', 'frank', 'naila'] as const) {
      expect(characters[id], `characters.${id}`).toBeDefined();
      expect(characters[id].name, `characters.${id}.name`).toBeTruthy();
      expect(characters[id].emoji, `characters.${id}.emoji`).toBeTruthy();
      expect(characters[id].role, `characters.${id}.role`).toBeTruthy();
    }
  });

  it('alder names all carry the "Alder" prefix', () => {
    expect(characters.asha.name).toMatch(/^Alder /);
    expect(characters.carlos.name).toMatch(/^Alder /);
    expect(characters.frank.name).toMatch(/^Alder /);
    expect(characters.naila.name).toMatch(/^Alder /);
  });
});

describe('getNeighborhoodAlderId', () => {
  it('returns asha for englewood', () => {
    expect(getNeighborhoodAlderId('englewood')).toBe('asha');
  });
  it('returns carlos for pilsen', () => {
    expect(getNeighborhoodAlderId('pilsen')).toBe('carlos');
  });
  it('returns frank for jefferson-park', () => {
    expect(getNeighborhoodAlderId('jefferson-park')).toBe('frank');
  });
  it('returns naila for albany-park', () => {
    expect(getNeighborhoodAlderId('albany-park')).toBe('naila');
  });
});

describe('v5 — David Park complexity-penalty rationale', () => {
  it('capitalStackIntro contains the compliance/legal explanation', () => {
    expect(davidLines.capitalStackIntro).toContain('compliance and legal paperwork');
  });
});
