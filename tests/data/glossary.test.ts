import { describe, it, expect } from 'vitest';
import { glossary, lookup } from '../../src/data/glossary';

describe('glossary data', () => {
  it('has all 17 canonical entries', () => {
    expect(glossary).toHaveLength(17);
  });

  it('every entry has non-empty required fields', () => {
    for (const e of glossary) {
      expect(e.term).toBeTruthy();
      expect(e.expansion).toBeTruthy();
      expect(e.definition).toBeTruthy();
      expect(e.inGameContext).toBeTruthy();
      expect(['financial', 'sources', 'entitlement', 'compliance']).toContain(e.category);
    }
  });

  it('category counts match the spec', () => {
    const counts = glossary.reduce((acc, e) => { acc[e.category] = (acc[e.category] ?? 0) + 1; return acc; }, {} as Record<string, number>);
    expect(counts.financial).toBe(4);
    expect(counts.sources).toBe(7);
    expect(counts.entitlement).toBe(5);
    expect(counts.compliance).toBe(1);
  });

  it('lookup is case-insensitive and alias-aware', () => {
    expect(lookup('LIHTC')?.term).toBe('LIHTC');
    expect(lookup('lihtc')?.term).toBe('LIHTC');
    expect(lookup('9% LIHTC')?.term).toBe('LIHTC');
    expect(lookup('4% LIHTC')?.term).toBe('LIHTC');
  });

  it('lookup returns undefined for unknown term', () => {
    expect(lookup('not-a-term')).toBeUndefined();
  });

  it('no duplicate strings across term + aliases', () => {
    const seen = new Set<string>();
    for (const e of glossary) {
      const all = [e.term.toLowerCase(), ...(e.aliases ?? []).map((a) => a.toLowerCase())];
      for (const s of all) {
        expect(seen.has(s)).toBe(false);
        seen.add(s);
      }
    }
  });
});
