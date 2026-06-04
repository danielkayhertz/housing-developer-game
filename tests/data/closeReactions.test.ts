import { describe, it, expect } from 'vitest';
import { getReactions } from '../../src/data/closeReactions';
import { GameState } from '../../src/game/types';

// Deep-partial merge so nested fields can be overridden without spreading the whole object.
function makeState(overrides: Partial<GameState> = {}): GameState {
  const base: GameState = {
    phase: 7,
    monthsElapsed: 24,
    costEscalation: 0,
    project: {
      neighborhood: 'englewood',
      units: 60,
      buildingType: 'midrise',
      intent: 'all-affordable',
      hasCboPartner: false,
      cboTimePaid: false,
    },
    proForma: {
      amiBreakdown: { 30: 12, 60: 36, 80: 12 },
      marketUnits: 0,
      finishLevel: 'standard',
      opexRatio: 0.38,
    },
    stack: {
      awarded: [],
      applied: [],
      lihtcSubmitted: false,
      lihtcAwarded: false,
      lihtcResubmits: 0,
      lihtcRevisions: 0,
    },
    gapResolution: { extraSubsidy: 0, shrinkBy: 0, lowerQualityUsed: false },
    entitlement: {
      currentStep: 4,
      pastChoices: [],
      alderGoodwill: 75,
      communitySupport: 50,
      projectShrinkBy: 0,
      conditionsImposed: [],
    },
    outcome: 'closed',
  };
  return {
    ...base,
    ...overrides,
    project: { ...base.project, ...overrides.project },
    proForma: { ...base.proForma, ...overrides.proForma },
    entitlement: { ...base.entitlement, ...overrides.entitlement },
    gapResolution: { ...base.gapResolution, ...overrides.gapResolution },
  };
}

describe('getReactions — success path', () => {
  it('returns exactly 4 reactions on closed outcome', () => {
    expect(getReactions(makeState())).toHaveLength(4);
  });

  it('Asha closingHigh when alderGoodwill >= 70', () => {
    const s = makeState({ entitlement: { alderGoodwill: 70 } });
    const asha = getReactions(s).find((r) => r.voice === 'Asha Tran')!;
    expect(asha.line).toContain('proud');
  });

  it('Asha closingMid when alderGoodwill 40–69', () => {
    const s = makeState({ entitlement: { alderGoodwill: 55 } });
    const asha = getReactions(s).find((r) => r.voice === 'Asha Tran')!;
    expect(asha.line).toContain('finish line');
  });

  it('Asha closingLow when alderGoodwill < 40', () => {
    const s = makeState({ entitlement: { alderGoodwill: 20 } });
    const asha = getReactions(s).find((r) => r.voice === 'Asha Tran')!;
    expect(asha.line).toContain("done");
  });

  it('Asha closingHigh line interpolates final unit count', () => {
    const s = makeState({ entitlement: { alderGoodwill: 80, projectShrinkBy: 10 } });
    const asha = getReactions(s).find((r) => r.voice === 'Asha Tran')!;
    expect(asha.line).toContain('50'); // finalUnits = 60 - 10 = 50
  });

  // Editorial board — Englewood midrise 60u standard base TDC ~$45M → $751k/unit (always highCost).
  // Use negative costEscalation to test other buckets.
  it('Editorial highCost when perUnit >= $500k (default state)', () => {
    const editorial = getReactions(makeState()).find((r) => r.affiliation.includes('Reader'))!;
    expect(editorial.line).toContain('$500k');
  });

  it('Editorial midCost when perUnit $400k–499k', () => {
    // Base TDC ~$45,072,000. For $450k/unit (27,000,000 total): escalation = 27M - 45.072M = -18.072M
    const s = makeState({ costEscalation: -18_072_000 });
    const editorial = getReactions(s).find((r) => r.affiliation.includes('Reader'))!;
    expect(editorial.line).toContain('questions');
  });

  it('Editorial lowCost when perUnit < $400k', () => {
    // For $383k/unit (23,000,000 total): escalation = 23M - 45.072M = -22.072M
    const s = makeState({ costEscalation: -22_072_000 });
    const editorial = getReactions(s).find((r) => r.affiliation.includes('Reader'))!;
    expect(editorial.line).toContain('cost discipline');
  });

  it('Block Club parkingConcerned for larger building type', () => {
    const s = makeState({ project: { buildingType: 'larger' } });
    const bc = getReactions(s).find((r) => r.affiliation.includes('block club'))!;
    expect(bc.line).toContain('parking');
  });

  it('Block Club parkingConcerned when zoning-accept choice made', () => {
    const s = makeState({
      entitlement: {
        pastChoices: [{ step: 3, choice: 'zoning-accept', alderDelta: -5, communityDelta: 0, shrinkBy: 0 }],
      },
    });
    const bc = getReactions(s).find((r) => r.affiliation.includes('block club'))!;
    expect(bc.line).toContain('parking');
  });

  it('Block Club supportive for midrise without zoning-accept', () => {
    const bc = getReactions(makeState()).find((r) => r.affiliation.includes('block club'))!;
    expect(bc.line).toContain('glad');
  });

  it('Advocate depthCritical when weighted avg AMI > 55% (default 58%)', () => {
    // Default: {30:12, 60:36, 80:12} → avg = (360+2160+960)/60 = 58%
    const adv = getReactions(makeState()).find((r) => r.affiliation.includes('Housing Coalition'))!;
    expect(adv.line).toContain('displacement');
  });

  it('Advocate depthPraise when weighted avg AMI <= 55%', () => {
    // {30:30, 60:20, 80:10} → avg = (900+1200+800)/60 = 48.3%
    const s = makeState({ proForma: { amiBreakdown: { 30: 30, 60: 20, 80: 10 } } });
    const adv = getReactions(s).find((r) => r.affiliation.includes('Housing Coalition'))!;
    expect(adv.line).toContain('30%');
  });
});

describe('getReactions — failure path', () => {
  it('shelved-stack: Asha + Marcus', () => {
    const s = makeState({ outcome: 'shelved-stack' });
    const reactions = getReactions(s);
    expect(reactions.some((r) => r.voice === 'Asha Tran')).toBe(true);
    expect(reactions.some((r) => r.voice === 'Marcus Bell')).toBe(true);
  });

  it('shelved-finance: Asha + Powell + advocate', () => {
    const s = makeState({ outcome: 'shelved-finance' });
    const reactions = getReactions(s);
    expect(reactions.some((r) => r.voice === 'Asha Tran')).toBe(true);
    expect(reactions.some((r) => r.voice === 'Ald. Powell')).toBe(true);
    expect(reactions.some((r) => r.affiliation.includes('Housing Coalition'))).toBe(true);
  });

  it('shelved-alder: Asha + advocate', () => {
    const s = makeState({ outcome: 'shelved-alder' });
    const reactions = getReactions(s);
    expect(reactions.some((r) => r.voice === 'Asha Tran')).toBe(true);
    expect(reactions.some((r) => r.affiliation.includes('Housing Coalition'))).toBe(true);
  });

  it('shelved-community: block club + Asha', () => {
    const s = makeState({ outcome: 'shelved-community' });
    const reactions = getReactions(s);
    expect(reactions.some((r) => r.affiliation.includes('block club'))).toBe(true);
    expect(reactions.some((r) => r.voice === 'Asha Tran')).toBe(true);
  });

  it('in-progress returns empty array', () => {
    const s = makeState({ outcome: 'in-progress' });
    expect(getReactions(s)).toHaveLength(0);
  });
});
