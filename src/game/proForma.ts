import {
  AmiBand,
  BuildingType,
  FinishLevel,
  GameState,
  NeighborhoodId,
  HARD_COST_PER_UNIT,
  FINISH_MULTIPLIER,
  SOFT_COST_RATIO,
  CONTINGENCY_RATIO,
  LAND_COST_BUILDING_MULTIPLIER,
  MIN_UNITS_FLOOR,
  LOWER_QUALITY_HARD_MULTIPLIER,
} from './types';
import { getNeighborhood } from '../data/neighborhoods';
import { rentAtAmi } from '../data/amiRents';

export interface TdcParts {
  land: number;
  hard: number;
  soft: number;
  contingency: number;
  total: number;
}

export function computeTdc(input: {
  neighborhood: NeighborhoodId;
  units: number;
  buildingType: BuildingType;
  finishLevel: FinishLevel;
}): TdcParts {
  const n = getNeighborhood(input.neighborhood);
  const land = n.landCostPerUnit * LAND_COST_BUILDING_MULTIPLIER[input.buildingType] * input.units;
  const hardPerUnit = HARD_COST_PER_UNIT[input.buildingType] * FINISH_MULTIPLIER[input.finishLevel];
  const hard = hardPerUnit * input.units;
  const soft = hard * SOFT_COST_RATIO;
  const contingency = hard * CONTINGENCY_RATIO;
  return { land, hard, soft, contingency, total: land + hard + soft + contingency };
}

export function weightedAvgAmi(breakdown: Record<AmiBand, number>): number {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const sum = (30 * breakdown[30]) + (60 * breakdown[60]) + (80 * breakdown[80]);
  return sum / total;
}

export function isLihtcEligible(breakdown: Record<AmiBand, number>): boolean {
  return weightedAvgAmi(breakdown) <= 60;
}

export function computeNoi(input: {
  amiBreakdown: Record<AmiBand, number>;
  marketUnits: number;
  marketRent: number;
  opexRatio: number;
  vacancyRatio: number;
}): number {
  let gpr = 0;
  for (const ami of [30, 60, 80] as AmiBand[]) {
    gpr += input.amiBreakdown[ami] * rentAtAmi(ami) * 12;
  }
  gpr += input.marketUnits * input.marketRent * 12;
  const egi = gpr * (1 - input.vacancyRatio);
  return egi * (1 - input.opexRatio);
}

export interface SupportableDebt {
  amount: number;
  binding: 'DSCR' | 'LTV';
}

function mortgageConstant(annualRate: number, years: number): number {
  const i = annualRate / 12;
  const n = years * 12;
  if (i === 0) return 1 / years;
  return 12 * (i / (1 - Math.pow(1 + i, -n)));
}

export function computeSupportableDebt(input: {
  noi: number;
  dscr: number;
  annualRate: number;
  amortYears: number;
  ltv: number;
  stabilizedValue: number;
}): SupportableDebt {
  const k = mortgageConstant(input.annualRate, input.amortYears);
  const dscrLoan = (input.noi / input.dscr) / k;
  const ltvLoan = input.stabilizedValue * input.ltv;
  const amount = Math.max(0, Math.min(dscrLoan, ltvLoan));
  return { amount, binding: dscrLoan <= ltvLoan ? 'DSCR' : 'LTV' };
}

export function computeGap(input: {
  tdc: number;
  costEscalation: number;
  supportableDebt: number;
}): number {
  return Math.max(0, input.tdc + input.costEscalation - input.supportableDebt);
}

export function getEffectiveUnits(state: GameState): number {
  return Math.max(
    MIN_UNITS_FLOOR,
    state.project.units - state.entitlement.projectShrinkBy - state.gapResolution.shrinkBy
  );
}

export function effectiveHardPerUnit(state: GameState): number {
  return (
    HARD_COST_PER_UNIT[state.project.buildingType]
    * FINISH_MULTIPLIER[state.proForma.finishLevel]
    * (state.entitlement.designUpgrade ? 1.15 : 1)
    * (state.gapResolution.lowerQualityUsed ? LOWER_QUALITY_HARD_MULTIPLIER : 1)
  );
}

export function computeTdcFromState(state: GameState): { hard: number; land: number; soft: number; contingency: number; total: number } {
  if (!state.project.neighborhood) {
    return { hard: 0, land: 0, soft: 0, contingency: 0, total: 0 };
  }
  const units = getEffectiveUnits(state);
  const hardPerUnit = effectiveHardPerUnit(state);
  const hard = hardPerUnit * units;
  const n = getNeighborhood(state.project.neighborhood);
  const land = n.landCostPerUnit * LAND_COST_BUILDING_MULTIPLIER[state.project.buildingType] * units;
  const soft = hard * SOFT_COST_RATIO;
  const contingency = hard * CONTINGENCY_RATIO;
  return { hard, land, soft, contingency, total: hard + land + soft + contingency };
}
