import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecapCard } from '../../src/components/RecapCard';
import { useGameStore } from '../../src/game/state';

describe('RecapCard narrative row (v5 item 1)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('renders narrative when present', () => {
    useGameStore.setState({
      lastRecap: {
        months: 9,
        escalationAdded: 100_000,
        narrative: { characterId: 'asha', line: 'Six listening sessions before the formal meeting.' },
      },
    } as any);
    render(<RecapCard />);
    expect(screen.getByText(/Six listening sessions/)).toBeInTheDocument();
    expect(screen.getByText(/Alder Asha Tran/)).toBeInTheDocument();
  });

  it('does not render narrative section when absent', () => {
    useGameStore.setState({
      lastRecap: { months: 9, escalationAdded: 100_000, narrative: null },
    } as any);
    render(<RecapCard />);
    expect(screen.queryByText(/Alder Asha Tran/)).toBeNull();
  });

  it('renders nothing when lastRecap is null', () => {
    useGameStore.setState({ lastRecap: null } as any);
    const { container } = render(<RecapCard />);
    expect(container).toBeEmptyDOMElement();
  });
});
