import { describe, it, expect } from 'vitest';
import { resolveRecapNarrative } from '../../src/data/characters';
import { useGameStore } from '../../src/game/state';

describe('resolveRecapNarrative (v5 item 1)', () => {
  it('returns null for an unknown key', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    expect(resolveRecapNarrative(useGameStore.getState(), 'no-such-key')).toBeNull();
  });

  it('returns asha-spoken narrative for community-story in englewood', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    const r = resolveRecapNarrative(useGameStore.getState(), 'community-story');
    expect(r).not.toBeNull();
    expect(r!.characterId).toBe('asha');
    expect(r!.line.length).toBeGreaterThan(10);
  });

  it('uses the neighborhood alder for entitlement choices (pilsen → carlos)', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('pilsen');
    const r = resolveRecapNarrative(useGameStore.getState(), 'community-story');
    expect(r!.characterId).toBe('carlos');
  });

  it('returns david-spoken narrative for redesignSmaller', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    const r = resolveRecapNarrative(useGameStore.getState(), 'redesignSmaller');
    expect(r!.characterId).toBe('david');
  });

  it('returns janelle-spoken narrative for lihtcSubmit win/loss', () => {
    useGameStore.getState().reset();
    useGameStore.getState().selectNeighborhood('englewood');
    const win = resolveRecapNarrative(useGameStore.getState(), 'lihtcSubmit-win');
    const loss = resolveRecapNarrative(useGameStore.getState(), 'lihtcSubmit-loss');
    expect(win!.characterId).toBe('janelle');
    expect(loss!.characterId).toBe('janelle');
    expect(win!.line).not.toBe(loss!.line);
  });
});
