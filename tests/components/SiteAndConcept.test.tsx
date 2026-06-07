import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SiteAndConcept } from '../../src/screens/SiteAndConcept';
import { useGameStore } from '../../src/game/state';

describe('SiteAndConcept live preview alder (v5 item 2)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('shows Asha for Englewood', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    render(<SiteAndConcept />);
    expect(screen.getByText(/Alder Asha Tran/)).toBeInTheDocument();
  });

  it('shows Carlos for Pilsen', () => {
    useGameStore.getState().selectNeighborhood('pilsen');
    render(<SiteAndConcept />);
    expect(screen.getByText(/Alder Carlos Reyes/)).toBeInTheDocument();
  });

  it('shows Frank for Jefferson Park', () => {
    useGameStore.getState().selectNeighborhood('jefferson-park');
    render(<SiteAndConcept />);
    expect(screen.getByText(/Alder Frank Kovac/)).toBeInTheDocument();
  });

  it('shows Naila for Albany Park', () => {
    useGameStore.getState().selectNeighborhood('albany-park');
    render(<SiteAndConcept />);
    expect(screen.getByText(/Alder Naila Hassan/)).toBeInTheDocument();
  });
});
