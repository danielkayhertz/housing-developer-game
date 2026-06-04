import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviseSubScreen } from '../../src/components/ReviseSubScreen';

describe('ReviseSubScreen', () => {
  it('renders title, time-cost label, body, and primary action label', () => {
    render(
      <ReviseSubScreen
        title="Revise to cut costs"
        timeCostLabel="+3 mo cost escalation"
        primaryLabel="Done — back to stack"
        onPrimary={() => {}}
      >
        <div>body content</div>
      </ReviseSubScreen>,
    );
    expect(screen.getByText('Revise to cut costs')).toBeTruthy();
    expect(screen.getByText(/\+3 mo cost escalation/)).toBeTruthy();
    expect(screen.getByText('body content')).toBeTruthy();
    expect(screen.getByText('Done — back to stack')).toBeTruthy();
  });

  it('calls onPrimary when the primary button is clicked', () => {
    const onPrimary = vi.fn();
    render(
      <ReviseSubScreen
        title="t"
        timeCostLabel="l"
        primaryLabel="go"
        onPrimary={onPrimary}
      >
        <div />
      </ReviseSubScreen>,
    );
    fireEvent.click(screen.getByText('go'));
    expect(onPrimary).toHaveBeenCalledOnce();
  });

  it('disables the primary button when primaryDisabled is true', () => {
    const onPrimary = vi.fn();
    render(
      <ReviseSubScreen
        title="t"
        timeCostLabel="l"
        primaryLabel="go"
        primaryDisabled
        onPrimary={onPrimary}
      >
        <div />
      </ReviseSubScreen>,
    );
    fireEvent.click(screen.getByText('go'));
    expect(onPrimary).not.toHaveBeenCalled();
  });
});
