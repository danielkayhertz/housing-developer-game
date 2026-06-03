import { NeighborhoodProfile, NeighborhoodId } from '../game/types';

export const neighborhoods: NeighborhoodProfile[] = [
  {
    id: 'englewood',
    name: 'Englewood',
    emoji: '🌳',
    description: 'South Side · disinvested, low-cost, supportive alder, simpler entitlement',
    landCostPerUnit: 12_000,
    marketRentPerUnit: 1_150,
    alderName: 'Asha Tran',
    alderTone: 'green',
    alderGreeting: 'Welcome to the ward. I\'m supportive in principle — let\'s make sure the block club has its say and we keep this affordable. Get me the pro forma when you\'re ready.',
    tifAvailable: true,
    status: 'mvp',
  },
  {
    id: 'pilsen',
    name: 'Pilsen',
    emoji: '🌮',
    description: 'Gentrification pressure, displacement concerns dominate community input',
    landCostPerUnit: 60_000,
    marketRentPerUnit: 2_100,
    alderName: 'Carlos Reyes',
    alderTone: 'yellow',
    alderGreeting: '(Coming soon — Pilsen is a v2 neighborhood.)',
    tifAvailable: true,
    status: 'stub',
  },
  {
    id: 'lakeview',
    name: 'Lakeview',
    emoji: '🏙️',
    description: 'North Side, hot market, neighbors push back hard on density',
    landCostPerUnit: 110_000,
    marketRentPerUnit: 2_900,
    alderName: 'Bennett Lawson',
    alderTone: 'yellow',
    alderGreeting: '(Coming soon — Lakeview is a v2 neighborhood.)',
    tifAvailable: false,
    status: 'stub',
  },
  {
    id: 'albany-park',
    name: 'Albany Park',
    emoji: '🌐',
    description: 'NW Side, immigrant-heavy, multilingual engagement essential, mid-cost',
    landCostPerUnit: 55_000,
    marketRentPerUnit: 1_800,
    alderName: 'Samantha Nugent',
    alderTone: 'yellow',
    alderGreeting: '(Coming soon — Albany Park is a v2 neighborhood.)',
    tifAvailable: true,
    status: 'stub',
  },
];

export function getNeighborhood(id: NeighborhoodId): NeighborhoodProfile {
  const n = neighborhoods.find(n => n.id === id);
  if (!n) throw new Error(`Unknown neighborhood: ${id}`);
  return n;
}
