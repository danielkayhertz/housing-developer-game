export type GapActionKey = 'askSubsidy' | 'redesignSmaller' | 'lowerQuality';

export interface GapActionMeta {
  key: GapActionKey;
  emoji: string;
  title: string;
  effectLabel: string;
  monthsCost: number;
  repeatable: boolean;
  disabledMsg: string;
}

export const gapActions: GapActionMeta[] = [
  {
    key: 'askSubsidy',
    emoji: '🏛️',
    title: 'Ask for more subsidy',
    effectLabel: '+9 mo · −15 alder · +$1M closer',
    monthsCost: 9,
    repeatable: true,
    disabledMsg: 'Asha is out of political capital',
  },
  {
    key: 'redesignSmaller',
    emoji: '📐',
    title: 'Redesign smaller',
    effectLabel: '+6 mo · +8 community · −10 units',
    monthsCost: 6,
    repeatable: true,
    disabledMsg: 'Cannot shrink below 20 units',
  },
  {
    key: 'lowerQuality',
    emoji: '🔨',
    title: 'Lower-quality build',
    effectLabel: '+3 mo · −12 community · −10% hard cost',
    monthsCost: 3,
    repeatable: false,
    disabledMsg: 'Already used (one-shot)',
  },
];

export function getGapAction(key: GapActionKey): GapActionMeta {
  const a = gapActions.find((x) => x.key === key);
  if (!a) throw new Error(`Unknown gap action: ${key}`);
  return a;
}
