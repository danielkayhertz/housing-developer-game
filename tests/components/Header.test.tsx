import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../../src/components/Header';
import { useGameStore } from '../../src/game/state';
import { computeEffectiveGap } from '../../src/game/gapResolution';

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

  it('TDC and gap match computeEffectiveGap (walk-up)', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setBuildingType('walkup');
    useGameStore.getState().setUnits(40);
    const eg = computeEffectiveGap(useGameStore.getState());
    render(<Header />);
    const tdcM = (eg.tdcAllIn / 1_000_000).toFixed(1);
    const gapM = (eg.gap / 1_000_000).toFixed(1);
    expect(screen.getByText(new RegExp(`\\$${tdcM}M`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`\\$${gapM}M`))).toBeInTheDocument();
  });

  it('CapitalStack-phase gap equals canonical after awarding a source', () => {
    useGameStore.getState().selectNeighborhood('pilsen');
    useGameStore.getState().setUnits(50);
    useGameStore.getState().awardSource({ sourceId: 'tif', amount: 2_000_000, daysSpent: 0 });
    const eg = computeEffectiveGap(useGameStore.getState());
    expect(eg.committed).toBeGreaterThan(eg.bankLoan); // award + debt both counted
    expect(eg.gap).toBe(Math.max(0, eg.tdcAllIn - eg.committed));
  });
});
