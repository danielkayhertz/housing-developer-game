import { NeighborhoodId } from './types';
import {
  EQUITY_BUDGET,
  AFFORDABLE_PRICE,
  SFH_TDC_PER_UNIT,
  SFH_MARKET_PRICE,
  sfhUnitTier,
} from '../data/singleFamily';

export interface SfhDeal {
  units: number;
  aroAffordableCount: number;
  marketUnits: number;
  tdcPerUnit: number;
  totalTDC: number;
  marketPricePerUnit: number;
  salesRevenue: number;
  loan: number;
  loanBinding: 'construction' | 'sales';
  equity: number;
  gap: number;
  profit: number;
  needsSubsidy: boolean;
  requiresZoning: boolean;
  aroTriggered: boolean;
}

export function aroAffordableCount(units: number): number {
  if (units <= 10) return 0;
  if (units <= 15) return 2;
  return Math.floor(0.2 * units);
}

export function computeSfhDeal(neighborhood: NeighborhoodId, units: number): SfhDeal {
  const tier = sfhUnitTier(units);
  const tdcPerUnit = SFH_TDC_PER_UNIT[tier];
  const totalTDC = units * tdcPerUnit;

  const affordable = aroAffordableCount(units);
  const marketUnits = units - affordable;
  const marketPricePerUnit = SFH_MARKET_PRICE[neighborhood][tier];
  const salesRevenue = marketUnits * marketPricePerUnit + affordable * AFFORDABLE_PRICE;

  const constructionCap = 0.8 * totalTDC;
  const salesCap = 0.7 * salesRevenue;
  const loan = Math.min(constructionCap, salesCap);
  const loanBinding: 'construction' | 'sales' =
    constructionCap <= salesCap ? 'construction' : 'sales';

  const equity = Math.min(totalTDC - loan, EQUITY_BUDGET);
  const gap = Math.max(0, totalTDC - loan - EQUITY_BUDGET);
  const profit = salesRevenue - totalTDC;

  return {
    units,
    aroAffordableCount: affordable,
    marketUnits,
    tdcPerUnit,
    totalTDC,
    marketPricePerUnit,
    salesRevenue,
    loan,
    loanBinding,
    equity,
    gap,
    profit,
    needsSubsidy: totalTDC > salesRevenue,
    requiresZoning: units > 5,
    aroTriggered: units > 10,
  };
}
