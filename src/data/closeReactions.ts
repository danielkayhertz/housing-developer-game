import { GameState, NeighborhoodId } from '../game/types';
import { weightedAvgAmi, computeTdc } from '../game/proForma';
import {
  ashaLines,
  carlosLines,
  frankLines,
  nailaLines,
  marcusLines,
  davidLines,
  characters,
} from './characters';

export interface Reaction {
  voice: string;
  affiliation: string;
  emoji: string;
  line: string;
}

// ---------------------------------------------------------------------------
// Per-neighborhood alder helpers
// ---------------------------------------------------------------------------

type AlderLines = {
  closingHigh: string;
  closingMid: string;
  closingLow: string;
  shelvedAlder: string;
  closingShelvedStack?: string;
  closingShelvedFinance?: string;
  closingShelvedCommunity?: string;
};

function alderLinesByNeighborhood(n: NeighborhoodId): AlderLines {
  const map: Record<NeighborhoodId, AlderLines> = {
    englewood: ashaLines,
    pilsen: carlosLines,
    'jefferson-park': frankLines,
    'albany-park': nailaLines,
  };
  return map[n];
}

function alderNameByNeighborhood(n: NeighborhoodId): string {
  const map: Record<NeighborhoodId, string> = {
    englewood: 'Asha Tran',
    pilsen: 'Carlos Reyes',
    'jefferson-park': 'Frank Kovac',
    'albany-park': 'Naila Hassan',
  };
  return map[n];
}

function alderEmojiByNeighborhood(n: NeighborhoodId): string {
  const map: Record<NeighborhoodId, string> = {
    englewood: characters.asha.emoji,
    pilsen: '📣',
    'jefferson-park': '🏙️',
    'albany-park': '🤝',
  };
  return map[n];
}

function alderAffiliationByNeighborhood(n: NeighborhoodId): string {
  const ward: Record<NeighborhoodId, string> = {
    englewood: 'Englewood',
    pilsen: 'Pilsen',
    'jefferson-park': 'Jefferson Park',
    'albany-park': 'Albany Park',
  };
  return `Alder · ${ward[n]}`;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function getReactions(state: GameState): Reaction[] {
  if (state.outcome === 'closed') return successReactions(state);
  if (state.outcome === 'in-progress') return [];
  return failureReactions(state);
}

// ---------------------------------------------------------------------------
// Success reactions
// ---------------------------------------------------------------------------

function successReactions(state: GameState): Reaction[] {
  if (!state.project.neighborhood) return [];

  const neighborhood = state.project.neighborhood;
  const finalUnits = Math.max(1, state.project.units - state.entitlement.projectShrinkBy);
  const tdcParts = computeTdc({
    neighborhood,
    units: finalUnits,
    buildingType: state.project.buildingType,
    finishLevel: state.proForma.finishLevel,
  });
  const perUnitTdc = (tdcParts.total + state.costEscalation) / finalUnits;
  const avgAmi = weightedAvgAmi(state.proForma.amiBreakdown);
  const { alderGoodwill } = state.entitlement;
  const pastChoiceKeys = state.entitlement.pastChoices.map((c) => c.choice);

  // Block-club parking concern: larger building type OR zoning-accept choice
  const parkingConcerned =
    state.project.buildingType === 'larger' || pastChoiceKeys.includes('zoning-accept');

  // Per-neighborhood alder
  const alderLines = alderLinesByNeighborhood(neighborhood);
  const alderLine =
    alderGoodwill >= 70
      ? alderLines.closingHigh.replace('{units}', String(finalUnits))
      : alderGoodwill >= 40
      ? alderLines.closingMid
      : alderLines.closingLow;

  const editorialLine =
    perUnitTdc < 400_000
      ? "The cost discipline here is worth noting. Under $400k per unit — this is how public subsidy should work."
      : perUnitTdc < 500_000
      ? "A real development. We have questions about the subsidy per unit, but the city needed these homes."
      : "Over $500k a unit. We'll support it — but taxpayers deserve to know what they paid for.";

  const blockClubLine = parkingConcerned
    ? "We still have concerns about parking. The project got approved, but this block deserves better coordination."
    : "We're glad to see it happen. Affordable housing for families who actually live here.";

  // Advocate voice: sharpened when mixed-income outside Englewood
  const isMixedIncomeOutsideEnglewood =
    state.project.intent === 'mixed-income' && neighborhood !== 'englewood';
  const advocateLine = isMixedIncomeOutsideEnglewood
    ? "You left units on the table. Every market-rate unit in a mixed-income project is a subsidy dollar diverted."
    : avgAmi > 55
    ? "The units matter. But 60% and 80% AMI doesn't reach the people most at risk of displacement."
    : "This is what real affordable housing looks like. 30% AMI units are the difference between housed and homeless.";

  // Block-club affiliation is neighborhood-aware
  const blockClubAffiliation = `${
    { englewood: 'Englewood', pilsen: 'Pilsen', 'jefferson-park': 'Jefferson Park', 'albany-park': 'Albany Park' }[neighborhood]
  } neighborhood block club`;

  return [
    {
      voice: alderNameByNeighborhood(neighborhood),
      affiliation: alderAffiliationByNeighborhood(neighborhood),
      emoji: alderEmojiByNeighborhood(neighborhood),
      line: alderLine,
    },
    {
      voice: 'Editorial Board',
      affiliation: 'Chicago Reader editorial board',
      emoji: '📰',
      line: editorialLine,
    },
    {
      voice: 'Block Club',
      affiliation: blockClubAffiliation,
      emoji: '🏘️',
      line: blockClubLine,
    },
    {
      voice: 'Housing Advocate',
      affiliation: 'Chicago Housing Coalition',
      emoji: '✊',
      line: advocateLine,
    },
  ];
}

// ---------------------------------------------------------------------------
// Failure reactions
// ---------------------------------------------------------------------------

function failureReactions(state: GameState): Reaction[] {
  const neighborhood = state.project.neighborhood ?? 'englewood';
  const alderLines = alderLinesByNeighborhood(neighborhood);
  const alderName = alderNameByNeighborhood(neighborhood);
  const alderEmoji = alderEmojiByNeighborhood(neighborhood);
  const alderAffiliation = alderAffiliationByNeighborhood(neighborhood);

  switch (state.outcome) {
    case 'shelved-stack':
      return [
        {
          voice: alderName,
          affiliation: alderAffiliation,
          emoji: alderEmoji,
          line: alderLines.closingShelvedStack ?? ashaLines.closingShelvedStack,
        },
        {
          voice: characters.marcus.name,
          affiliation: characters.marcus.role,
          emoji: characters.marcus.emoji,
          line: marcusLines.shelvedStack,
        },
      ];
    case 'shelved-finance':
      return [
        {
          voice: alderName,
          affiliation: alderAffiliation,
          emoji: alderEmoji,
          line: alderLines.closingShelvedFinance ?? ashaLines.closingShelvedFinance,
        },
        {
          voice: characters.powell.name,
          affiliation: characters.powell.role,
          emoji: characters.powell.emoji,
          line: "I told you it was too expensive. The city can't keep throwing subsidies at projects that don't pencil.",
        },
        {
          voice: 'Housing Advocate',
          affiliation: 'Chicago Housing Coalition',
          emoji: '✊',
          line: "This is why pre-development needs deeper subsidy. Without it, projects like this don't survive political resistance.",
        },
      ];
    case 'shelved-alder':
      return [
        {
          voice: alderName,
          affiliation: alderAffiliation,
          emoji: alderEmoji,
          line: alderLines.shelvedAlder,
        },
        {
          voice: 'Housing Advocate',
          affiliation: 'Chicago Housing Coalition',
          emoji: '✊',
          line: "Another site lost. We needed those units.",
        },
      ];
    case 'shelved-community': {
      const blockClubAffiliation = `${
        { englewood: 'Englewood', pilsen: 'Pilsen', 'jefferson-park': 'Jefferson Park', 'albany-park': 'Albany Park' }[neighborhood as NeighborhoodId]
      } neighborhood block club`;
      return [
        {
          voice: 'Block Club',
          affiliation: blockClubAffiliation,
          emoji: '🏘️',
          line: "We couldn't get behind it. Community engagement matters. This is what happens when it breaks down.",
        },
        {
          voice: alderName,
          affiliation: alderAffiliation,
          emoji: alderEmoji,
          line: alderLines.closingShelvedCommunity ?? ashaLines.closingShelvedCommunity,
        },
      ];
    }
    case 'shelved-aro':
      return [
        {
          voice: characters.david.name,
          affiliation: characters.david.role,
          emoji: characters.david.emoji,
          line: davidLines.shelvedAro,
        },
        {
          voice: characters.marcus.name,
          affiliation: characters.marcus.role,
          emoji: characters.marcus.emoji,
          line: "I can't hold the loan terms once DOH pulls out. I'm sorry — call me when you have a new structure.",
        },
        {
          voice: 'Housing Advocate',
          affiliation: 'Chicago Housing Coalition',
          emoji: '✊',
          line: "The ARO is a floor, not a ceiling. You can't use public subsidy to meet a baseline the market already owes.",
        },
      ];
    default:
      return [];
  }
}
