import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../../src/components/Header';
import { useGameStore } from '../../src/game/state';

describe('Header effective units (v5 item 7)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('shows project.units when no shrinks', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    render(<Header />);
    expect(screen.getByText(/60 units/)).toBeInTheDocument();
  });

  it('shows reduced units after redesignSmaller', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState((s) => ({ phase: 5 } as const));
    useGameStore.getState().applyGapAction('redesignSmaller');
    render(<Header />);
    expect(screen.getByText(/50 units/)).toBeInTheDocument();
    expect(screen.queryByText(/60 units/)).toBeNull();
  });

  it('shows reduced units after entitlement.projectShrinkBy increases', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(60);
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, projectShrinkBy: 12 },
    }));
    render(<Header />);
    expect(screen.getByText(/48 units/)).toBeInTheDocument();
  });
});
