import { describe, it, expect } from 'vitest';
import { formatElapsed } from '../../src/util/formatElapsed';

describe('formatElapsed', () => {
  it('zero months → "0 mo"', () => {
    expect(formatElapsed(0)).toBe('0 mo');
  });

  it('under a year → "X mo"', () => {
    expect(formatElapsed(1)).toBe('1 mo');
    expect(formatElapsed(6)).toBe('6 mo');
    expect(formatElapsed(11)).toBe('11 mo');
  });

  it('exact year boundaries → "X yr"', () => {
    expect(formatElapsed(12)).toBe('1 yr');
    expect(formatElapsed(24)).toBe('2 yr');
    expect(formatElapsed(36)).toBe('3 yr');
  });

  it('year + months → "X yr Y mo"', () => {
    expect(formatElapsed(18)).toBe('1 yr 6 mo');
    expect(formatElapsed(13)).toBe('1 yr 1 mo');
    expect(formatElapsed(35)).toBe('2 yr 11 mo');
  });

  it('rounds down fractional months', () => {
    expect(formatElapsed(18.7)).toBe('1 yr 6 mo');
  });
});
