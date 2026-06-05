import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipTerm } from '../../src/components/TooltipTerm';
import { JargonScreenScope } from '../../src/components/JargonScreenScope';

describe('TooltipTerm', () => {
  it('first instance has jargon-term class', () => {
    render(
      <JargonScreenScope>
        <TooltipTerm term="LIHTC">LIHTC</TooltipTerm>
      </JargonScreenScope>
    );
    const el = screen.getByText('LIHTC');
    expect(el.className).toContain('jargon-term');
  });

  it('second instance of same term renders plain', () => {
    render(
      <JargonScreenScope>
        <TooltipTerm term="LIHTC">LIHTC</TooltipTerm>
        <TooltipTerm term="LIHTC">LIHTC again</TooltipTerm>
      </JargonScreenScope>
    );
    const second = screen.getByText('LIHTC again');
    expect(second.className).not.toContain('jargon-term');
  });

  it('alias-aware: 9% LIHTC after LIHTC renders plain', () => {
    render(
      <JargonScreenScope>
        <TooltipTerm term="LIHTC">LIHTC</TooltipTerm>
        <TooltipTerm term="9% LIHTC">9% LIHTC</TooltipTerm>
      </JargonScreenScope>
    );
    const second = screen.getByText('9% LIHTC');
    expect(second.className).not.toContain('jargon-term');
  });

  it('unknown term renders plain + dev warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <JargonScreenScope>
        <TooltipTerm term="not-a-real-term">test</TooltipTerm>
      </JargonScreenScope>
    );
    const el = screen.getByText('test');
    expect(el.className).not.toContain('jargon-term');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
