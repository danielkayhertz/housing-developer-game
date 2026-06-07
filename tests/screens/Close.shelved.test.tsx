import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Close } from '../../src/screens/Close';
import { useGameStore } from '../../src/game/state';

describe('Bug 12 — Close shows shelved, not closed, for failures', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('shelved-finance shows the shelved header and not success', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    useGameStore.getState().setUnits(50);
    useGameStore.setState({ outcome: 'shelved-finance' });
    render(<Close />);
    expect(screen.getByText(/The project was shelved\./)).toBeInTheDocument();
    expect(screen.queryByText(/You closed\./)).toBeNull();
  });
});
