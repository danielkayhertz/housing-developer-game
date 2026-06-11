import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SourceCard } from '../../src/components/SourceCard';
import { getSource } from '../../src/data/sources';

describe('SourceCard onRemove (v4 item 8)', () => {
  it('shows a remove button when awarded and onRemove is provided', () => {
    const onRemove = vi.fn();
    render(
      <SourceCard
        source={getSource('doh-loan')}
        status="awarded"
        awardedAmount={5_000_000}
        onRemove={onRemove}
      />
    );
    const btn = screen.getByRole('button', { name: /remove|×/i });
    fireEvent.click(btn);
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('does not show a remove button when no onRemove is provided', () => {
    render(
      <SourceCard
        source={getSource('doh-loan')}
        status="awarded"
        awardedAmount={5_000_000}
      />
    );
    expect(screen.queryByRole('button', { name: /remove|×/i })).toBeNull();
  });
});

describe('SourceCard applyVia hint', () => {
  it('renders the applyVia hint and no Apply button when redirected', () => {
    render(
      <SourceCard
        source={getSource('9-lihtc')}
        status="available"
        applyVia="↑ Submit via the QAP card above"
      />
    );
    expect(screen.getByText(/Submit via the QAP card above/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /apply/i })).toBeNull();
  });

  it('still shows the Apply button for normal available sources', () => {
    const onApply = vi.fn();
    render(
      <SourceCard source={getSource('doh-loan')} status="available" onApply={onApply} />
    );
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
  });
});
