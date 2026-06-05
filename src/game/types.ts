// src/game/types.ts

export type NeighborhoodId = 'englewood' | 'pilsen' | 'jefferson-park' | 'albany-park';
export type BuildingType = 'walkup' | 'midrise' | 'larger';
export type Intent = 'all-affordable' | 'mixed-income';
export type FinishLevel = 'basic' | 'standard' | 'elevated';
export type AmiBand = 30 | 60 | 80;
export type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type SourceId =
  | '9-lihtc'
  | '4-lihtc-bonds'
  | 'doh-loan'
  | 'ihda-loan'
  | 'tif'
  | 'hed-bond'
  | 'cdbg'
  | 'home'
  | 'iahtc'
  | 'philanthropy'
  | 'bank-loan'
  | 'deferred-dev-fee';

export interface NeighborhoodHooks {
  pilsenDeepThirtyAmiBonus?: boolean;
  jeffersonParkParkingChoice?: boolean;
  jeffersonParkSfrOnly?: boolean;
  albanyParkMultilingualChoice?: boolean;
  albanyParkCboAmplified?: boolean;
}

export interface NeighborhoodProfile {
  id: NeighborhoodId;
  name: string;
  emoji: string;
  description: string;
  landCostPerUnit: number;     // dollars
  marketRentPerUnit: number;   // monthly dollars
  alderName: string;
  alderTone: AlderTone;
  alderGreeting: string;
  tifAvailable: boolean;
  startingAlderGoodwill: number;     // NEW
  startingCommunitySupport: number;  // NEW
  hooks: NeighborhoodHooks;          // NEW
  status: 'mvp' | 'stub';
}

export interface SourceProfile {
  id: SourceId;
  name: string;
  emoji: string;
  shortDescription: string;
  daysToProcess: number;
  amountRange: { min: number; max: number } | null; // null = computed elsewhere
  alderGoodwillCost: number; // 0 unless TIF / HED Bond
  usesComplexityPenalty: boolean;
  // eligibility: returns null if eligible, or a string explaining why not
  eligibilityCheck?: (state: GameState) => string | null;
}

export interface SourceAward {
  sourceId: SourceId;
  amount: number;
  daysSpent: number;
}

export interface SourceApplication {
  sourceId: SourceId;
  amount: number;
  daysSpent: number;
  outcome: 'pending' | 'awarded' | 'denied';
}

export type EntitlementStep = 1 | 2 | 3 | 4;
export type StepChoiceKey =
  | 'preapp-quiet' | 'preapp-formal-cbo' | 'preapp-public'
  | 'preapp-multilingual'                                                                        // Albany Park
  | 'community-data' | 'community-story' | 'community-coalition'
  | 'community-jp-full-parking' | 'community-jp-traffic-data' | 'community-jp-refuse-parking'  // Jefferson Park
  | 'zoning-hold' | 'zoning-shrink' | 'zoning-accept'
  | 'finance-reframe' | 'finance-concede' | 'finance-stakeholders';

export interface StepChoice {
  step: number;
  choice: StepChoiceKey;
  alderDelta: number;
  communityDelta: number;
  tdcDelta?: number;
  shrinkBy?: number;
}

export type AlderTone = 'green' | 'yellow' | 'red';

export type Outcome =
  | 'in-progress'
  | 'closed'
  | 'shelved-stack'
  | 'shelved-finance'
  | 'shelved-alder'
  | 'shelved-community'
  | 'shelved-aro';   // NEW — affordable share < 25% at close

export interface GameState {
  phase: Phase;
  monthsElapsed: number;
  costEscalation: number; // accrued dollars added to TDC

  project: {
    neighborhood: NeighborhoodId | null;
    units: number;
    buildingType: BuildingType;
    intent: Intent;
    hasCboPartner: boolean;
    cboTimePaid: boolean;
  };

  proForma: {
    amiBreakdown: Record<AmiBand, number>;
    marketUnits: number;
    finishLevel: FinishLevel;
    opexRatio: number; // 0-1
  };

  stack: {
    awarded: SourceAward[];
    applied: SourceApplication[];
    lihtcSubmitted: boolean;
    lihtcAwarded: boolean;
    lihtcResubmits: number;   // count of "Submit again" presses after a denial
    lihtcRevisions: number;   // count of "Revise + resubmit" presses; each adds REVISION_SOFT_PENALTY to TDC
  };

  entitlement: {
    currentStep: EntitlementStep;
    pastChoices: StepChoice[];
    alderGoodwill: number;
    communitySupport: number;
    projectShrinkBy: number;
    conditionsImposed: string[];
  };

  gapResolution: {
    extraSubsidy: number;       // cumulative $ added by "Ask for more subsidy"
    shrinkBy: number;           // cumulative units removed by "Redesign smaller"
    lowerQualityUsed: boolean;  // one-shot flag; multiplies hard cost by LOWER_QUALITY_HARD_MULTIPLIER
  };

  outcome: Outcome;
  lastRecap: {
    months: number;
    escalationAdded: number;
  } | null;
}

// Constants
export const COST_ESCALATION_PER_YEAR = 0.05; // 5%
export const COMPLEXITY_PENALTY_THRESHOLD = 5; // soft costs hit at source #6
export const COMPLEXITY_PENALTY_PER_UNIT = 20_000; // $20k/u per extra source
export const LIHTC_BASELINE_WIN_RATE = 0.20; // 20% statewide

export const AMI_SCORE_MULTIPLIERS: Record<AmiBand, number> = {
  30: 4,
  60: 1.75,
  80: 1,
};

export const HARD_COST_PER_UNIT: Record<BuildingType, number> = {
  walkup: 376_000,    // was 470_000 in v2
  midrise: 448_000,   // was 560_000 in v2
  larger: 496_000,    // was 620_000 in v2
};

export const LAND_COST_BUILDING_MULTIPLIER: Record<BuildingType, number> = {
  walkup: 1.25,
  midrise: 1.00,
  larger: 0.75,
};

export const UNIT_DEFAULTS_BY_BUILDING_TYPE: Record<BuildingType, number> = {
  walkup: 24,
  midrise: 50,
  larger: 80,
};

export const MIXED_INCOME_QAP_PENALTY = 12;
export const ARO_FLOOR_AFFORDABLE_SHARE = 0.25;
export const DENSITY_VARIANCE_TDC_PER_UNIT = 25_000;
export const DENSITY_VARIANCE_MONTHS = 3;

export const FINISH_MULTIPLIER: Record<FinishLevel, number> = {
  basic: 0.90,
  standard: 1.00,
  elevated: 1.15,
};

export const SOFT_COST_RATIO = 0.27; // 27% of hard
export const CONTINGENCY_RATIO = 0.05; // 5% of hard

export const LOWER_QUALITY_HARD_MULTIPLIER = 0.9;  // 10% hard-cost reduction when lower-quality used
export const REVISION_SOFT_PENALTY = 150_000;       // $ added to TDC per LIHTC revise+resubmit
export const GAP_ADVANCE_THRESHOLD = 100_000;       // gap ≤ this means stack/resolution is "closed"
export const MIN_UNITS_FLOOR = 20;                  // GapResolution redesign-smaller floor
