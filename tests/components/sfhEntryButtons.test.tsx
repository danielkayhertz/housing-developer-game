import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SiteAndConcept } from '../../src/screens/SiteAndConcept';
import { GapResolution } from '../../src/screens/GapResolution';
import { CapitalStack } from '../../src/screens/CapitalStack';
import { useGameStore } from '../../src/game/state';

describe('single-family entry buttons', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('Site & Concept button is disabled until a neighborhood is chosen', () => {
    render(<SiteAndConcept />);
    const btn = screen.getByRole('button', { name: /give up and build single-family/i });
    expect(btn).toBeDisabled();
  });

  it('Site & Concept button opens the modal once a neighborhood is chosen', () => {
    useGameStore.getState().selectNeighborhood('jefferson-park');
    render(<SiteAndConcept />);
    fireEvent.click(screen.getByRole('button', { name: /give up and build single-family/i }));
    expect(useGameStore.getState().sfhOpen).toBe(true);
  });

  it('Gap Resolution exposes the give-up button', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    render(<GapResolution />);
    fireEvent.click(screen.getByRole('button', { name: /give up and build single-family/i }));
    expect(useGameStore.getState().sfhOpen).toBe(true);
  });

  it('Capital Stack exposes the give-up button', () => {
    useGameStore.getState().selectNeighborhood('jefferson-park');
    render(<CapitalStack />);
    fireEvent.click(screen.getByRole('button', { name: /give up and build single-family/i }));
    expect(useGameStore.getState().sfhOpen).toBe(true);
  });
});
