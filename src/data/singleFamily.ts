import { NeighborhoodId } from '../game/types';

export const EQUITY_BUDGET = 2_000_000;
export const AFFORDABLE_PRICE = 250_000;
export const PERMIT_DAYS = 120;
export const SFH_MIN_UNITS = 1;
export const SFH_MAX_UNITS = 15;

export type SfhUnitTier = '1' | '2' | '3-5' | '6-15';

export function sfhUnitTier(units: number): SfhUnitTier {
  if (units <= 1) return '1';
  if (units === 2) return '2';
  if (units <= 5) return '3-5';
  return '6-15';
}

export const SFH_TDC_PER_UNIT: Record<SfhUnitTier, number> = {
  '1': 500_000,
  '2': 400_000,
  '3-5': 350_000,
  '6-15': 300_000,
};

// Market sales price per unit, by neighborhood × unit tier.
export const SFH_MARKET_PRICE: Record<NeighborhoodId, Record<SfhUnitTier, number>> = {
  'jefferson-park': { '1': 1_300_000, '2': 1_100_000, '3-5': 900_000, '6-15': 750_000 },
  pilsen:           { '1': 1_300_000, '2': 1_100_000, '3-5': 900_000, '6-15': 750_000 },
  'albany-park':    { '1': 1_100_000, '2': 1_000_000, '3-5': 800_000, '6-15': 600_000 },
  englewood:        { '1':   400_000, '2':   375_000, '3-5': 300_000, '6-15': 275_000 },
};
