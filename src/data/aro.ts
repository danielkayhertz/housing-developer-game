import { NeighborhoodId } from '../game/types';

export function aroMinimumFraction(_neighborhood: NeighborhoodId, units: number): number {
  if (units < 10) return 0;
  return 0.20;
}
