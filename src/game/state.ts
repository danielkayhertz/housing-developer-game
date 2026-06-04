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
} from './types';
import { applyChoice } from './entitlement';

const initialState: GameState = {
  phase: 1,
  monthsElapsed: 0,
  costEscalation: 0,
  project: {
    neighborhood: null,
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
  tickMonths: (n: number) => void;
  takeEntitlementStep: (choice: StepChoiceKey, ctx?: { shrinkBy?: number }) => void;
  setOutcome: (o: GameState['outcome']) => void;
}

export const useGameStore = create<GameState & StoreActions>((set, get) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  advancePhase: () => {
    // Ceiling stays at 6 until Phase 2 ships the GapResolution screen at phase 5.
    // Update to Math.min(7, ...) and add phaseNames[7] in Header when that lands.
    const next = Math.min(6, get().phase + 1) as Phase;
    set({ phase: next });
    track('phase_advanced', { to: next });
  },

  selectNeighborhood: (id) => set((s) => ({ project: { ...s.project, neighborhood: id } })),

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

  setBuildingType: (t) => set((s) => ({ project: { ...s.project, buildingType: t } })),
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

  tickMonths: (n: number) => set((s) => {
    if (!s.project.neighborhood) return {};
    const hardPerU = HARD_COST_PER_UNIT[s.project.buildingType] * FINISH_MULTIPLIER[s.proForma.finishLevel];
    const hard = hardPerU * s.project.units;
    const escalationPerMonth = hard * (COST_ESCALATION_PER_YEAR / 12) * (1 + SOFT_COST_RATIO + CONTINGENCY_RATIO);
    return {
      monthsElapsed: s.monthsElapsed + n,
      costEscalation: s.costEscalation + escalationPerMonth * n,
    };
  }),

  takeEntitlementStep: (choice, ctx = {}) => set((s) => {
    const consequence = applyChoice(choice, ctx);
    return {
      entitlement: {
        ...s.entitlement,
        currentStep: Math.min(4, (s.entitlement.currentStep + 1)) as EntitlementStep,
        pastChoices: [
          ...s.entitlement.pastChoices,
          {
            step: s.entitlement.currentStep,
            choice,
            alderDelta: consequence.alderDelta,
            communityDelta: consequence.communityDelta,
            shrinkBy: consequence.shrinkBy,
            tdcDelta: consequence.tdcDelta,
          },
        ],
        alderGoodwill: Math.max(0, Math.min(100, s.entitlement.alderGoodwill + consequence.alderDelta)),
        communitySupport: Math.max(0, Math.min(100, s.entitlement.communitySupport + consequence.communityDelta)),
        projectShrinkBy: s.entitlement.projectShrinkBy + consequence.shrinkBy,
      },
    };
  }),

  setOutcome: (o) => set({ outcome: o }),
}));
