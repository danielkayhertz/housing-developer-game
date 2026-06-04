import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CharacterIntroCard } from '../../src/components/CharacterIntroCard';

describe('CharacterIntroCard', () => {
  it('renders avatar, name, role, and body', () => {
    render(
      <CharacterIntroCard
        avatar="🏦"
        name="Marcus Bell"
        role="Construction Lender, Loop Federal Bank"
        body={<p>Test body content.</p>}
      />,
    );
    expect(screen.getByText(/🏦/)).toBeTruthy();
    expect(screen.getByText('Marcus Bell')).toBeTruthy();
    expect(screen.getByText(/Construction Lender/)).toBeTruthy();
    expect(screen.getByText('Test body content.')).toBeTruthy();
  });

  it('accepts an optional footer', () => {
    render(
      <CharacterIntroCard
        avatar="🏛️"
        name="David Park"
        role="DOH"
        body={<p>Body</p>}
        footer={<p>Footer note</p>}
      />,
    );
    expect(screen.getByText('Footer note')).toBeTruthy();
  });
});
