import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SingleFamilyModal } from '../../src/components/SingleFamilyModal';
import { useGameStore } from '../../src/game/state';

function openWith(neighborhood: 'jefferson-park' | 'englewood' | 'albany-park' | 'pilsen') {
  useGameStore.getState().reset();
  useGameStore.getState().selectNeighborhood(neighborhood);
  useGameStore.getState().openSfh();
}

describe('SingleFamilyModal', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('renders nothing when closed', () => {
    useGameStore.getState().selectNeighborhood('jefferson-park');
    const { container } = render(<SingleFamilyModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the banker loan rule when open', () => {
    openWith('jefferson-park');
    render(<SingleFamilyModal />);
    expect(screen.getByText(/lesser of 80%/i)).toBeInTheDocument();
  });

  it('shows the zoning warning above 5 units', () => {
    openWith('jefferson-park');
    render(<SingleFamilyModal />);
    fireEvent.change(screen.getByLabelText(/number of homes/i), { target: { value: '6' } });
    expect(screen.getByText(/would require a zoning change/i)).toBeInTheDocument();
  });

  it('shows the ARO note above 10 units', () => {
    openWith('jefferson-park');
    render(<SingleFamilyModal />);
    fireEvent.change(screen.getByLabelText(/number of homes/i), { target: { value: '11' } });
    expect(screen.getByText(/ARO kicks in/i)).toBeInTheDocument();
  });

  it('Englewood shows the DOH dead-end and disables the permit button', () => {
    openWith('englewood');
    render(<SingleFamilyModal />);
    expect(screen.getByText(/higher than the anticipated sales price/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply for permits/i })).toBeDisabled();
  });

  it('disables the permit button above 5 units (zoning change required)', () => {
    openWith('jefferson-park');
    render(<SingleFamilyModal />);
    const btn = screen.getByRole('button', { name: /apply for permits/i });
    expect(btn).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText(/number of homes/i), { target: { value: '6' } });
    expect(btn).toBeDisabled();
  });

  it('Jefferson Park buildable deal grants the permit and shows profit', () => {
    openWith('jefferson-park');
    render(<SingleFamilyModal />);
    fireEvent.click(screen.getByRole('button', { name: /apply for permits/i }));
    expect(screen.getByText(/Permit granted/i)).toBeInTheDocument();
    expect(screen.getByText(/120 days/i)).toBeInTheDocument();
    expect(screen.getByText(/\$0\.80M/)).toBeInTheDocument();
  });

  it('shows the TDC and sales math breakdowns', () => {
    openWith('jefferson-park');
    render(<SingleFamilyModal />);
    fireEvent.change(screen.getByLabelText(/number of homes/i), { target: { value: '4' } });
    expect(screen.getByText('$350k × 4')).toBeInTheDocument(); // TDC: 4 × $350k
    expect(screen.getByText('$900k × 4')).toBeInTheDocument(); // sales: 4 × $900k
  });

  it('always shows the alder, with the by-right line at 5 units or fewer', () => {
    openWith('jefferson-park');
    render(<SingleFamilyModal />);
    expect(screen.getByText(/one single-family home per lot/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/number of homes/i), { target: { value: '6' } });
    expect(screen.getByText(/would require a zoning change/i)).toBeInTheDocument();
  });

  it('permit page offers only "Play again", with no Close button', () => {
    openWith('jefferson-park');
    render(<SingleFamilyModal />);
    fireEvent.click(screen.getByRole('button', { name: /apply for permits/i }));
    expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /close/i })).toBeNull();
  });
});
