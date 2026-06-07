import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Entitlement } from '../../src/screens/Entitlement';
import { useGameStore } from '../../src/game/state';
import { Outcome } from '../../src/game/types';

function seedShelved(outcome: Outcome) {
  useGameStore.getState().reset();
  useGameStore.getState().selectNeighborhood('englewood');
  useGameStore.getState().setUnits(50);
  useGameStore.setState((s) => ({
    outcome,
    entitlement: {
      ...s.entitlement,
      pastChoices: [{ step: 4, choice: 'finance-reframe', alderDelta: -2, communityDelta: 0 }],
    },
  }));
}

describe('Bug 12 — shelved entitlement shows the ordinance pulled, not approved', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('shelved-finance: pulled the ordinance, no Council-vote success', () => {
    seedShelved('shelved-finance');
    render(<Entitlement />);
    expect(screen.getByText(/pulled the ordinance/i)).toBeInTheDocument();
    expect(screen.queryByText(/Council vote \(narrative\)/i)).toBeNull();
    expect(screen.queryByText(/passed the ordinance/i)).toBeNull();
  });

  it('shelved-community: pulled the ordinance', () => {
    seedShelved('shelved-community');
    render(<Entitlement />);
    expect(screen.getByText(/pulled the ordinance/i)).toBeInTheDocument();
    expect(screen.queryByText(/Council vote \(narrative\)/i)).toBeNull();
  });
});
