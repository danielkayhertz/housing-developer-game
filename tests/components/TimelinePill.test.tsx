import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelinePill } from '../../src/components/TimelinePill';

describe('TimelinePill', () => {
  it('renders 0 months as "0 mo"', () => {
    render(<TimelinePill months={0} />);
    expect(screen.getByText(/0 mo/)).toBeTruthy();
  });

  it('renders 18 months as "1 yr 6 mo"', () => {
    render(<TimelinePill months={18} />);
    expect(screen.getByText(/1 yr 6 mo/)).toBeTruthy();
  });

  it('includes the calendar emoji', () => {
    render(<TimelinePill months={12} />);
    expect(screen.getByText(/📅/)).toBeTruthy();
  });
});
