import { BuildingType, NeighborhoodId, StepChoiceKey } from './types';
import { getNeighborhood } from '../data/neighborhoods';

export type EntitlementPath = 'by-right' | 'zma' | 'pd';

export function resolveEntitlementPath(input: {
  buildingType: BuildingType;
  units: number;
  neighborhood: NeighborhoodId;
}): EntitlementPath {
  const n = getNeighborhood(input.neighborhood);
  if (input.buildingType === 'larger') return 'pd';
  if (n.hooks.jeffersonParkSfrOnly) return 'zma';
  if (input.buildingType === 'walkup' && input.units >= 40) return 'pd';
  if (input.buildingType === 'midrise') return 'zma';
  return 'by-right'; // walkup < 40 units
}

export interface ChoiceConsequence {
  alderDelta: number;
  communityDelta: number;
  tdcDelta: number;
  shrinkBy: number;
  extraSubsidyDelta?: number;
}

export function applyChoice(
  choice: StepChoiceKey,
  ctx: { shrinkBy?: number; concessionAmount?: number } = {},
): ChoiceConsequence {
  const base: ChoiceConsequence = { alderDelta: 0, communityDelta: 0, tdcDelta: 0, shrinkBy: 0, extraSubsidyDelta: 0 };

  switch (choice) {
    case 'preapp-quiet':
      return { ...base, alderDelta: 2, communityDelta: 0 };
    case 'preapp-formal-cbo':
      return { ...base, alderDelta: 5, communityDelta: 6 };
    case 'preapp-public':
      return { ...base, alderDelta: -10, communityDelta: -5 };
    case 'preapp-multilingual':
      return { ...base, alderDelta: 0, communityDelta: 15 };

    case 'community-none':
      return { ...base, alderDelta: -20, communityDelta: -25 };
    case 'community-story':
      return { ...base, alderDelta: 0, communityDelta: 12 };
    case 'community-coalition':
      return { ...base, alderDelta: 4, communityDelta: 10 };

    case 'community-jp-full-parking':
      return { ...base, alderDelta: 12, communityDelta: 15, tdcDelta: 30_000 };
    case 'community-jp-traffic-data':
      return { ...base, alderDelta: 5, communityDelta: 6, tdcDelta: 15_000 };
    case 'community-jp-refuse-parking':
      return { ...base, alderDelta: -5, communityDelta: -10, tdcDelta: 0 };

    case 'zoning-hold':
      return { ...base, alderDelta: -14, communityDelta: -4 };
    case 'zoning-shrink':
      return { ...base, alderDelta: -6, communityDelta: 15, shrinkBy: ctx.shrinkBy ?? 12 };
    case 'zoning-accept':
      return { ...base, alderDelta: -8, communityDelta: 0, tdcDelta: 1_400_000 };

    case 'finance-reframe':
      return { ...base, alderDelta: -2, communityDelta: 0 };
    case 'finance-concede':
      return { ...base, alderDelta: 5, communityDelta: 0, extraSubsidyDelta: -3_000_000 };
    case 'finance-stakeholders':
      return { ...base, alderDelta: 0, communityDelta: -15 };

    default:
      return base;
  }
}

export function isPathFailed(input: {
  alderGoodwill: number;
  communitySupport: number;
}): 'alder' | 'community' | null {
  if (input.alderGoodwill < 20) return 'alder';
  if (input.communitySupport < 25) return 'community';
  return null;
}
