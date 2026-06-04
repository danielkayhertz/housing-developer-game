import { GameState } from '../game/types';
import { weightedAvgAmi, computeTdc } from '../game/proForma';
import { ashaLines, marcusLines, characters } from './characters';

export interface Reaction {
  voice: string;
  affiliation: string;
  emoji: string;
  line: string;
}

export function getReactions(state: GameState): Reaction[] {
  if (state.outcome === 'closed') return successReactions(state);
  if (state.outcome === 'in-progress') return [];
  return failureReactions(state);
}

function successReactions(state: GameState): Reaction[] {
  if (!state.project.neighborhood) return [];

  const finalUnits = Math.max(1, state.project.units - state.entitlement.projectShrinkBy);
  const tdcParts = computeTdc({
    neighborhood: state.project.neighborhood,
    units: finalUnits,
    buildingType: state.project.buildingType,
    finishLevel: state.proForma.finishLevel,
  });
  const perUnitTdc = (tdcParts.total + state.costEscalation) / finalUnits;
  const avgAmi = weightedAvgAmi(state.proForma.amiBreakdown);
  const { alderGoodwill } = state.entitlement;
  const pastChoiceKeys = state.entitlement.pastChoices.map((c) => c.choice);
  const parkingConcerned =
    state.project.buildingType === 'larger' || pastChoiceKeys.includes('zoning-accept');

  const ashaLine =
    alderGoodwill >= 70
      ? ashaLines.closingHigh.replace('{units}', String(finalUnits))
      : alderGoodwill >= 40
      ? ashaLines.closingMid
      : ashaLines.closingLow;

  const editorialLine =
    perUnitTdc < 400_000
      ? "The cost discipline here is worth noting. Under $400k per unit — this is how public subsidy should work."
      : perUnitTdc < 500_000
      ? "A real development. We have questions about the subsidy per unit, but the city needed these homes."
      : "Over $500k a unit. We'll support it — but taxpayers deserve to know what they paid for.";

  const blockClubLine = parkingConcerned
    ? "We still have concerns about parking. The project got approved, but this block deserves better coordination."
    : "We're glad to see it happen. Affordable housing for families who actually live here.";

  const advocateLine =
    avgAmi > 55
      ? "The units matter. But 60% and 80% AMI doesn't reach the people most at risk of displacement."
      : "This is what real affordable housing looks like. 30% AMI units are the difference between housed and homeless.";

  return [
    {
      voice: characters.asha.name,
      affiliation: 'Your alderperson',
      emoji: characters.asha.emoji,
      line: ashaLine,
    },
    {
      voice: 'Editorial Board',
      affiliation: 'Chicago Reader editorial board',
      emoji: '📰',
      line: editorialLine,
    },
    {
      voice: 'Block Club',
      affiliation: 'Englewood neighborhood block club',
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

function failureReactions(state: GameState): Reaction[] {
  switch (state.outcome) {
    case 'shelved-stack':
      return [
        {
          voice: characters.asha.name,
          affiliation: 'Your alderperson',
          emoji: characters.asha.emoji,
          line: ashaLines.closingShelvedStack,
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
          voice: characters.asha.name,
          affiliation: 'Your alderperson',
          emoji: characters.asha.emoji,
          line: ashaLines.closingShelvedFinance,
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
          voice: characters.asha.name,
          affiliation: 'Your alderperson',
          emoji: characters.asha.emoji,
          line: ashaLines.closingShelvedAlder,
        },
        {
          voice: 'Housing Advocate',
          affiliation: 'Chicago Housing Coalition',
          emoji: '✊',
          line: "Another site lost. We needed those units.",
        },
      ];
    case 'shelved-community':
      return [
        {
          voice: 'Block Club',
          affiliation: 'Englewood neighborhood block club',
          emoji: '🏘️',
          line: "We couldn't get behind it. Community engagement matters. This is what happens when it breaks down.",
        },
        {
          voice: characters.asha.name,
          affiliation: 'Your alderperson',
          emoji: characters.asha.emoji,
          line: ashaLines.closingShelvedCommunity,
        },
      ];
    default:
      return [];
  }
}
