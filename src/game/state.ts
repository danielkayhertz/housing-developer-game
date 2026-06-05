import { create } from 'zustand';
import { track } from './analytics';
import {
  GameState,
  Phase,
  NeighborhoodId,
  BuildingType,
  Intent,
  AmiBand,
  FinishLevel,
  StepChoiceKey,
  EntitlementStep,
  SourceAward,
  COST_ESCALATION_PER_YEAR,
  HARD_COST_PER_UNIT,
  FINISH_MULTIPLIER,
  SOFT_COST_RATIO,
  CONTINGENCY_RATIO,
  LOWER_QUALITY_HARD_MULTIPLIER,
  GAP_ADVANCE_THRESHOLD,
  UNIT_DEFAULTS_BY_BUILDING_TYPE,
} from './types';
import { applyChoice } from './entitlement';
import { computeEffectiveGap } from './gapResolution';
import { getNeighborhood } from '../data/neighborhoods';

const initialState: GameState = {
  phase: 1,
  monthsElapsed: 0,
  costEscalation: 0,
  project: {
    neighborhood: null,
    units: 50, // v3: midrise default 50
    buildingType: 'midrise',
    intent: 'all-affordable',
    hasCboPartner: false,
    cboTimePaid: false,
  },
  proForma: {
    amiBreakdown: { 30: 10, 60: 30, 80: 10 }, // v3: midrise default 50
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
  gapResolution: {
    extraSubsidy: 0,
    shrinkBy: 0,
    lowerQualityUsed: false,
  },
  entitlement: {
    currentStep: 1,
    pastChoices: [],
    alderGoodwill: 75,
    communitySupport: 50,
    projectShrinkBy: 0,
    conditionsImposed: [],
  },
  outcome: 'in-progress',
  lastRecap: null,
};

interface StoreActions {
  reset: () => void;
  advancePhase: () => void;
  selectNeighborhood: (id: NeighborhoodId) => void;
  setUnits: (n: number) => void;
  setBuildingType: (t: BuildingType) => void;
  setIntent: (i: Intent) => void;
  setCboPartner: (value: boolean) => void;
  setAmiUnit: (ami: AmiBand, n: number) => void;
  setMarketUnits: (n: number) => void;
  setFinishLevel: (f: FinishLevel) => void;
  awardSource: (award: SourceAward) => void;
  removeSource: (sourceId: string) => void;
  submitLihtc: (awarded: boolean) => void;
  resubmitLihtc: (awarded: boolean) => void;
  reviseLihtc: (awarded: boolean) => void;
  applyGapAction: (action: 'askSubsidy' | 'redesignSmaller' | 'lowerQuality') => void;
  tickMonths: (n: number) => void;
  takeEntitlementStep: (choice: StepChoiceKey, step: number, ctx?: { shrinkBy?: number }) => void;
  addCostEscalation: (delta: number) => void;
  setOutcome: (o: GameState['outcome']) => void;
  shelveProject: () => void;
  clearRecap: () => void;
  retreatPhase: () => void;
}

export const useGameStore = create<GameState & StoreActions>((set, get) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  advancePhase: () => {
    const s = get();
    let next: Phase;
    if (s.phase === 4) {
      // Capital Stack → GapResolution if the gap is still too big, else Entitlement.
      const { gap } = computeEffectiveGap(s);
      next = gap > GAP_ADVANCE_THRESHOLD ? 5 : 6;
    } else {
      next = Math.min(7, s.phase + 1) as Phase;
    }

    // Hook firings on Phase 6 entry
    let entitlement = s.entitlement;
    if (next === 6 && s.phase !== 6) {
      const n = s.project.neighborhood ? getNeighborhood(s.project.neighborhood) : null;
      if (n?.hooks.pilsenDeepThirtyAmiBonus) {
        const affordable = s.proForma.amiBreakdown[30] + s.proForma.amiBreakdown[60] + s.proForma.amiBreakdown[80];
        const totalUnits = affordable + s.proForma.marketUnits;
        const thirtyShare = totalUnits > 0 ? s.proForma.amiBreakdown[30] / totalUnits : 0;

        if (thirtyShare >= 0.20) {
          entitlement = { ...entitlement, communitySupport: Math.min(100, entitlement.communitySupport + 15) };
        } else if (thirtyShare < 0.10) {
          entitlement = { ...entitlement, communitySupport: Math.max(0, entitlement.communitySupport - 10) };
        }
      }
      // CBO amplified community delta
      if (s.project.hasCboPartner) {
        const delta = n?.hooks.albanyParkCboAmplified ? 12 : 6;
        entitlement = {
          ...entitlement,
          communitySupport: Math.min(100, entitlement.communitySupport + delta),
        };
      }
    }

    set({ phase: next, entitlement });
    track('phase_advanced', { to: next });
  },

  selectNeighborhood: (id) => {
    const n = getNeighborhood(id);
    set((s) => ({
      project: { ...s.project, neighborhood: id },
      entitlement: {
        ...s.entitlement,
        alderGoodwill: n.startingAlderGoodwill,
        communitySupport: n.startingCommunitySupport,
      },
    }));
  },

  setUnits: (n) => set((s) => {
    const totalAffordable = Object.values(s.proForma.amiBreakdown).reduce((a, b) => a + b, 0);
    if (totalAffordable === 0) return { project: { ...s.project, units: n } };
    const ratio = n / totalAffordable;
    const newBreakdown = {
      30: Math.round(s.proForma.amiBreakdown[30] * ratio),
      60: Math.round(s.proForma.amiBreakdown[60] * ratio),
      80: Math.round(s.proForma.amiBreakdown[80] * ratio),
    };
    return {
      project: { ...s.project, units: n },
      proForma: { ...s.proForma, amiBreakdown: newBreakdown },
    };
  }),

  setBuildingType: (t) => {
    const newUnits = UNIT_DEFAULTS_BY_BUILDING_TYPE[t];
    get().setUnits(newUnits);          // existing setUnits rebalances AMI proportionally
    set((s) => ({ project: { ...s.project, buildingType: t } }));
  },
  setIntent: (i) => set((s) => ({ project: { ...s.project, intent: i } })),

  setCboPartner: (value) => {
    const s = get();
    const firstTimeOn = value && !s.project.cboTimePaid;
    set({
      project: {
        ...s.project,
        hasCboPartner: value,
        cboTimePaid: s.project.cboTimePaid || value,
      },
      entitlement: firstTimeOn
        ? {
            ...s.entitlement,
            communitySupport: Math.min(100, s.entitlement.communitySupport + 6),
          }
        : s.entitlement,
    });
    // tickMonths is a second set() call — two-step by design so communitySupport
    // and cboTimePaid are committed before the month counter advances.
    if (firstTimeOn) {
      get().tickMonths(6);
    }
  },

  setAmiUnit: (ami, n) => set((s) => ({
    proForma: {
      ...s.proForma,
      amiBreakdown: { ...s.proForma.amiBreakdown, [ami]: n },
    },
  })),

  setMarketUnits: (n) => set((s) => ({ proForma: { ...s.proForma, marketUnits: n } })),
  setFinishLevel: (f) => set((s) => ({ proForma: { ...s.proForma, finishLevel: f } })),

  awardSource: (award) => set((s) => ({
    stack: { ...s.stack, awarded: [...s.stack.awarded, award] },
  })),

  removeSource: (sourceId) => set((s) => ({
    stack: { ...s.stack, awarded: s.stack.awarded.filter((a) => a.sourceId !== sourceId) },
  })),

  submitLihtc: (awarded) => set((s) => ({
    stack: { ...s.stack, lihtcSubmitted: true, lihtcAwarded: awarded },
  })),

  resubmitLihtc: (awarded) => set((s) => ({
    stack: {
      ...s.stack,
      lihtcResubmits: s.stack.lihtcResubmits + 1,
      lihtcAwarded: awarded,
    },
  })),

  reviseLihtc: (awarded) => set((s) => ({
    stack: {
      ...s.stack,
      lihtcRevisions: s.stack.lihtcRevisions + 1,
      lihtcAwarded: awarded,
    },
    entitlement: {
      ...s.entitlement,
      alderGoodwill: Math.max(0, s.entitlement.alderGoodwill - 4),
      communitySupport: Math.max(0, s.entitlement.communitySupport - 2),
    },
  })),

  applyGapAction: (action) => {
    const s = get();
    if (action === 'askSubsidy') {
      set({
        gapResolution: {
          ...s.gapResolution,
          extraSubsidy: s.gapResolution.extraSubsidy + 1_000_000,
        },
        entitlement: {
          ...s.entitlement,
          alderGoodwill: Math.max(0, s.entitlement.alderGoodwill - 15),
        },
      });
      get().tickMonths(9);
    } else if (action === 'redesignSmaller') {
      set({
        gapResolution: {
          ...s.gapResolution,
          shrinkBy: s.gapResolution.shrinkBy + 10,
        },
        entitlement: {
          ...s.entitlement,
          communitySupport: Math.min(100, s.entitlement.communitySupport + 8),
        },
      });
      get().tickMonths(6);
    } else if (action === 'lowerQuality') {
      if (s.gapResolution.lowerQualityUsed) return; // one-shot guard
      set({
        gapResolution: {
          ...s.gapResolution,
          lowerQualityUsed: true,
        },
        entitlement: {
          ...s.entitlement,
          communitySupport: Math.max(0, s.entitlement.communitySupport - 12),
        },
      });
      get().tickMonths(3);
    }
  },

  tickMonths: (n: number) => set((s) => {
    if (!s.project.neighborhood) return {};
    const qualityMul = s.gapResolution.lowerQualityUsed ? LOWER_QUALITY_HARD_MULTIPLIER : 1;
    const effectiveUnits = Math.max(0, s.project.units - s.gapResolution.shrinkBy);
    const hardPerU = HARD_COST_PER_UNIT[s.project.buildingType] * FINISH_MULTIPLIER[s.proForma.finishLevel] * qualityMul;
    const hard = hardPerU * effectiveUnits;
    const escalationPerMonth = hard * (COST_ESCALATION_PER_YEAR / 12) * (1 + SOFT_COST_RATIO + CONTINGENCY_RATIO);
    const escalationAdded = escalationPerMonth * n;
    return {
      monthsElapsed: s.monthsElapsed + n,
      costEscalation: s.costEscalation + escalationAdded,
      ...(n >= 3 ? { lastRecap: { months: n, escalationAdded } } : {}),
    };
  }),

  takeEntitlementStep: (choice, step, ctx = {}) => {
    const s = get();
    const consequence = applyChoice(choice, ctx);
    if (consequence.tdcDelta) {
      get().addCostEscalation(consequence.tdcDelta * s.project.units);
    }
    set((s) => {
      const consequence = applyChoice(choice, ctx);
      let newCommunity = Math.max(0, Math.min(100, s.entitlement.communitySupport + consequence.communityDelta));

      // Albany Park multilingual-skip cap
      const n = s.project.neighborhood ? getNeighborhood(s.project.neighborhood) : null;
      if (n?.hooks.albanyParkMultilingualChoice) {
        const skippedMultilingual = s.entitlement.pastChoices.some(
          (c) => c.step === 1 && c.choice !== 'preapp-multilingual'
        );
        if (skippedMultilingual) {
          newCommunity = Math.min(50, newCommunity);
        }
      }

      return {
        entitlement: {
          ...s.entitlement,
          currentStep: Math.min(4, (s.entitlement.currentStep + 1)) as EntitlementStep,
          pastChoices: [
            ...s.entitlement.pastChoices,
            {
              step,
              choice,
              alderDelta: consequence.alderDelta,
              communityDelta: consequence.communityDelta,
              shrinkBy: consequence.shrinkBy,
              tdcDelta: consequence.tdcDelta,
            },
          ],
          alderGoodwill: Math.max(0, Math.min(100, s.entitlement.alderGoodwill + consequence.alderDelta)),
          communitySupport: newCommunity,
          projectShrinkBy: s.entitlement.projectShrinkBy + consequence.shrinkBy,
        },
      };
    });
  },

  addCostEscalation: (delta) => set((s) => ({ costEscalation: s.costEscalation + delta })),

  setOutcome: (o) => set({ outcome: o }),

  shelveProject: () => set({ outcome: 'shelved-stack', phase: 7 }),

  clearRecap: () => set({ lastRecap: null }),

  retreatPhase: () => set((s) => ({
    phase: Math.max(1, s.phase - 1) as Phase,
  })),
}));
