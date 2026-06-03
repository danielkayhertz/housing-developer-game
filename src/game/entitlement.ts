import { BuildingType, StepChoiceKey } from './types';

export type EntitlementPath = 'by-right' | 'zma' | 'pd';

export function resolveEntitlementPath(input: {
  buildingType: BuildingType;
  units: number;
}): EntitlementPath {
  if (input.buildingType === 'larger') return 'pd';
  if (input.buildingType === 'walkup' && input.units >= 40) return 'pd';
  return 'zma';
}

export interface ChoiceConsequence {
  alderDelta: number;
  communityDelta: number;
  tdcDelta: number;
  shrinkBy: number;
}

export function applyChoice(
  choice: StepChoiceKey,
  ctx: { shrinkBy?: number; concessionAmount?: number } = {},
): ChoiceConsequence {
  const base: ChoiceConsequence = { alderDelta: 0, communityDelta: 0, tdcDelta: 0, shrinkBy: 0 };

  switch (choice) {
    case 'preapp-quiet':
      return { ...base, alderDelta: 2, communityDelta: 0 };
    case 'preapp-formal-cbo':
      return { ...base, alderDelta: 5, communityDelta: 6 };
    case 'preapp-public':
      return { ...base, alderDelta: -3, communityDelta: 4 };

    case 'community-data':
      return { ...base, alderDelta: 3, communityDelta: 4 };
    case 'community-story':
      return { ...base, alderDelta: -2, communityDelta: 12 };
    case 'community-coalition':
      return { ...base, alderDelta: 4, communityDelta: 10 };

    case 'zoning-hold':
      return { ...base, alderDelta: -14, communityDelta: -4 };
    case 'zoning-shrink':
      return { ...base, alderDelta: -6, communityDelta: 15, shrinkBy: ctx.shrinkBy ?? 12 };
    case 'zoning-accept':
      return { ...base, alderDelta: -8, communityDelta: 0, tdcDelta: 1_400_000 };

    case 'finance-reframe':
      return { ...base, alderDelta: -2, communityDelta: 0 };
    case 'finance-concede':
      return { ...base, alderDelta: 5, communityDelta: 0 };
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
