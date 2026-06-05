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
