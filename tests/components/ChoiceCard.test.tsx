import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChoiceCard } from '../../src/components/ChoiceCard';

describe('ChoiceCard', () => {
  it('renders timeLabel when provided', () => {
    render(
      <ChoiceCard
        title="Test"
        description="d"
        consequences="c"
        timeLabel="+6 mo · +$0.4M cost escalation"
        onClick={() => {}}
      />,
    );
    expect(screen.getByText(/\+6 mo/)).toBeTruthy();
  });

  it('omits timeLabel block when not provided', () => {
    const { container } = render(
      <ChoiceCard title="Test" description="d" consequences="c" onClick={() => {}} />,
    );
    expect(container.querySelector('.text-caution')).toBeNull();
  });
});
