import { describe, it, expect } from 'vitest';
import { rentAtAmi } from '../../src/data/amiRents';

describe('rentAtAmi', () => {
  it('returns ~$1,250 for 60% AMI (1BR Chicago FY24 benchmark)', () => {
    expect(rentAtAmi(60)).toBe(1_250);
  });

  it('returns proportionally lower for 30% AMI', () => {
    expect(rentAtAmi(30)).toBe(625);
  });

  it('returns 80% AMI rent', () => {
    expect(rentAtAmi(80)).toBe(1_665);
  });
});
