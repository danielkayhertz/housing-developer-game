import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlossaryPanel } from '../../src/components/GlossaryPanel';

describe('GlossaryPanel', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<GlossaryPanel open={false} onClose={() => {}} />);
    expect(container.querySelector('[data-glossary-panel]')).toBeNull();
  });

  it('renders all 17 entries when open', () => {
    render(<GlossaryPanel open={true} onClose={() => {}} />);
    expect(screen.getByText('LIHTC')).toBeInTheDocument();
    expect(screen.getByText('AMI')).toBeInTheDocument();
    expect(screen.getByText('ARO')).toBeInTheDocument();
    expect(screen.getByText('CDBG')).toBeInTheDocument();
  });

  it('renders category headings', () => {
    render(<GlossaryPanel open={true} onClose={() => {}} />);
    expect(screen.getByText(/Financial/i)).toBeInTheDocument();
    expect(screen.getByText(/Sources/i)).toBeInTheDocument();
    expect(screen.getByText(/Entitlement/i)).toBeInTheDocument();
    expect(screen.getByText(/Compliance/i)).toBeInTheDocument();
  });

  it('search filters entries by case-insensitive substring', () => {
    render(<GlossaryPanel open={true} onClose={() => {}} />);
    const search = screen.getByPlaceholderText(/search/i);
    fireEvent.change(search, { target: { value: 'tax' } });
    expect(screen.getByText('LIHTC')).toBeInTheDocument();
    expect(screen.getByText('TIF')).toBeInTheDocument();
    expect(screen.queryByText('CBO')).not.toBeInTheDocument();
  });

  it('Esc key triggers onClose', () => {
    const onClose = vi.fn();
    render(<GlossaryPanel open={true} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
