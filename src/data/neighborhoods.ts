import { NeighborhoodProfile, NeighborhoodId } from '../game/types';

export const neighborhoods: NeighborhoodProfile[] = [
  {
    id: 'englewood',
    name: 'Englewood',
    emoji: '🌳',
    description: 'South Side · disinvested, low-cost, supportive alder, simpler entitlement',
    landCostPerUnit: 12_000,
    marketRentPerUnit: 1_438,
    alderName: 'Asha Tran',
    alderTone: 'green',
    alderGreeting: "Welcome to the ward. I'm supportive in principle — let's make sure the block club has its say and we keep this affordable. Get me the pro forma when you're ready.",
    tifAvailable: true,
    startingAlderGoodwill: 75,
    startingCommunitySupport: 50,
    hooks: {},
    status: 'mvp',
  },
  {
    id: 'pilsen',
    name: 'Pilsen',
    emoji: '🏘️',
    description: 'Lower West Side · gentrification pressure, displacement concerns dominate community input',
    landCostPerUnit: 60_000,
    marketRentPerUnit: 2_625,
    alderName: 'Carlos Reyes',
    alderTone: 'yellow',
    alderGreeting: "Look — we've lost too many longtime residents already. Show me you're serious about depth. Shallow won't fly here.",
    tifAvailable: true,
    startingAlderGoodwill: 65,
    startingCommunitySupport: 35,
    hooks: { pilsenDeepThirtyAmiBonus: true },
    status: 'mvp',
  },
  {
    id: 'jefferson-park',
    name: 'Jefferson Park',
    emoji: '🅿️',
    description: 'NW Side · car-dependent, density-averse, single-family zoning',
    landCostPerUnit: 110_000,
    marketRentPerUnit: 3_625,
    alderName: 'Frank Kovac',
    alderTone: 'red',
    alderGreeting: "I'm not going to lie — most of my constituents don't want this. Bring something with parking and you might get a hearing. Otherwise, expect a fight.",
    tifAvailable: false,
    startingAlderGoodwill: 35,
    startingCommunitySupport: 30,
    hooks: { jeffersonParkParkingChoice: true, jeffersonParkSfrOnly: true },
    status: 'mvp',
  },
  {
    id: 'albany-park',
    name: 'Albany Park',
    emoji: '🌐',
    description: 'NW Side · immigrant-heavy, multilingual engagement essential, mid-cost',
    landCostPerUnit: 55_000,
    marketRentPerUnit: 2_250,
    alderName: 'Naila Hassan',
    alderTone: 'yellow',
    alderGreeting: "Welcome. Our community speaks half a dozen languages on a slow day — meet people where they are and you'll find real partners here.",
    tifAvailable: true,
    startingAlderGoodwill: 60,
    startingCommunitySupport: 45,
    hooks: { albanyParkMultilingualChoice: true, albanyParkCboAmplified: true },
    status: 'mvp',
  },
];

export function getNeighborhood(id: NeighborhoodId): NeighborhoodProfile {
  const n = neighborhoods.find(n => n.id === id);
  if (!n) throw new Error(`Unknown neighborhood: ${id}`);
  return n;
}
