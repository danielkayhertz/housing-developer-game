import type { NeighborhoodId, GameState } from '../game/types';

export type CharacterId =
  | 'marcus' | 'asha' | 'janelle' | 'david'
  | 'powell' | 'reyes' | 'chen'
  | 'carlos' | 'frank' | 'naila';

export interface Character {
  id: CharacterId;
  name: string;
  emoji: string;
  role: string;
}

export const characters: Record<CharacterId, Character> = {
  marcus: { id: 'marcus', name: 'Marcus Bell', emoji: '🏦', role: 'Construction Lender, Loop Federal Bank' },
  asha:   { id: 'asha', name: 'Alder Asha Tran', emoji: '🧑‍💼', role: 'Your alderperson' },
  janelle:{ id: 'janelle', name: 'Janelle', emoji: '🏛️', role: 'IHDA reviewer' },
  david:  { id: 'david', name: 'David Park', emoji: '🏛️', role: 'Senior Analyst, Chicago Department of Housing' },
  powell: { id: 'powell', name: 'Ald. Cunningham', emoji: '⚖️', role: 'Fiscal hawk' },
  reyes:  { id: 'reyes', name: 'Ald. Reyes', emoji: '📣', role: 'TIF reformer' },
  chen:   { id: 'chen', name: 'Ald. Chen', emoji: '🏢', role: 'Other-ward alder' },
  carlos: { id: 'carlos', name: 'Alder Carlos Reyes', emoji: '📣', role: 'Alder · Pilsen' },
  frank:  { id: 'frank',  name: 'Alder Frank Kovac',  emoji: '🏙️', role: 'Alder · Jefferson Park' },
  naila:  { id: 'naila',  name: 'Alder Naila Hassan', emoji: '🤝', role: 'Alder · Albany Park' },
};

export const marcusLines = {
  dscrLimited: 'Honestly, my loan barely matters here. At 60% AMI rents the income only supports a small piece — and that\'s most of what any bank will give you on this deal. The real work is in front of you: IHDA, DOH, TIF, and credits.',
  ltvLimited: 'Your value\'s healthy enough that I could lend more on paper, but the income still has to service it. We\'re LTV-limited, not DSCR — that\'s a rare position for affordable.',
  generic: 'Your project pencils on the income side. Let me know when you\'re ready to close the construction loan.',
  intro: 'I\'ll size your loan against the income. The bank rule is Debt Service Coverage Ratio (DSCR) ≥ 1.20 — you have to generate at least 20% more rent than the loan needs each year.',
  walkthroughClosing: (loan: number, tdc: number) =>
    `Translation: I can lend you about $${(loan / 1_000_000).toFixed(1)}M against a $${(tdc / 1_000_000).toFixed(0)}M project. The other $${((tdc - loan) / 1_000_000).toFixed(0)}M is where the work gets real.`,
  capitalStackBubble: 'Each source you add closes more gap — but also adds complexity and time. Past 5 sources, you hit a $20k/unit soft-cost penalty per extra source. My rule: close the gap with the fewest, fastest sources you can.',
  shelvedStack: 'I tried to hold the loan terms as long as I could. Cost escalation just outran what any lender would underwrite.',
};

export const ashaLines = {
  preappQuiet: 'I appreciate the heads up. A quieter rollout works for me — let\'s see how the block club takes it.',
  preappFormalCBO: 'Bringing a CBO partner in early is the right move. The community will read it as respect.',
  preappPublic: 'A public pre-launch is bold. I hope you\'re ready for the calls I\'ll get on Monday.',
  communityNone: "No meeting? OK. The block club will hear about this from somewhere else, and not from us. Brace yourself.",
  communityStory: 'The story-led pitch is the right read for Englewood. People want to feel seen.',
  communityCoalition: 'Coalition-led is strong. Make sure the coalition partners feel led, not used.',
  zoningHold: 'If we hold at the original size, I\'ll need to lean on my chair vote at Committee. Doable.',
  zoningShrink: 'If you shrink to {newUnits}, I keep my chair\'s vote and you cruise to Council.',
  zoningAccept: 'Accepting Committee conditions is the safe play. We lose some impact but we don\'t lose the project.',
  financeReframe: 'The cost number is going to follow you forever. If you can shift the conversation to per-unit-of-impact, A is your best path.',
  financeConcede: 'Conceding on TIF costs you real money. Find that gap from somewhere — quickly.',
  financeStakeholders: 'Coalition testimony works but burns the goodwill you\'ll want at lease-up and beyond.',
  gapResolutionIntro: "It doesn't go to Council with an open gap. Three ways out — pick what you can stomach.",
  gapResolutionShelve: "I'm sorry. Sometimes the math just doesn't work in this neighborhood. We'll come back to this site.",
  closingHigh: "I'm proud of this one. {units} units deep in Englewood — this is why I ran.",
  closingMid: "Good work getting this over the finish line. Not perfect, but real affordable homes.",
  closingLow: "It's done. I'm glad for the units. Our relationship will need some rebuilding.",
  closingShelvedStack: "I'm sorry. The stack just never came together. Sometimes the numbers win.",
  closingShelvedFinance: "I couldn't put my name on this one. The goodwill we needed just wasn't there at the end — and in my ward, nothing moves that I won't carry. I'm sorry.",
  closingShelvedAlder: "I couldn't make this work in my ward. I know that's not what you wanted to hear.",
  shelvedAlder: "I couldn't make this work in my ward. I know that's not what you wanted to hear.",
  closingShelvedCommunity: "The neighborhood never came around, and I won't get out ahead of my own community. Without the block club behind it, I couldn't keep this moving forward.",
};

export const janelleLines = {
  qapScoreLow: 'Your QAP score is weak. You can submit and gamble, or strengthen the application — deepening affordability or lining up other commitments first.',
  qapScoreMid: 'You\'re in the mix. Statewide, roughly one in five applications win in any round. The other commitments you\'re lining up will help.',
  qapScoreHigh: 'Strong application. If the IHDA staff likes the project on its merits, you have a real shot this round.',
  fiveSources: 'You\'re at 5 sources — anything more comes with a soft-cost penalty. Look hard at HED Bond or a small IAHTC for clean fill.',
};

export const davidLines = {
  dohWelcome: 'DOH is on board with your profile. We\'ll need a coherent stack before final commitment — show me what else you\'re lining up.',
  capitalStackIntro: 'Putting this together is what we call assembling the capital stack — soft loans, grants, tax credits, and equity stacked to your TDC. Three rules: every source closes more of the gap; every source takes time, and time is money (hard costs escalate ~5%/year); past 5 sources, complexity penalty kicks in at ~$20k/unit per extra source, because of all the compliance and legal paperwork your staff and attorneys will need to deal with. The art is closing the gap with the smallest, fastest set of sources you can.',
  capitalStackQuipWalkup: "You chose Walk-up — lowest hard cost per unit, but a smaller building means LIHTC has less to work with. Watch the gap percentage.",
  capitalStackQuipLarger: "You chose Larger — that's why the hard cost per unit is at the top of the band. Worth it if you can stack the gap.",
  shelvedAro: "The ARO requires 20% affordability anyway. We're not going to subsidize that.",
  gapResolutionExhausted: "We've tried a bunch of different things, but this project isn't penciling. Start over.",
};

export const sfhLines = {
  bankerRule:
    "Here's how I'll size this. My construction loan is the lesser of 80% of your total construction cost or 70% of your projected sales price. Whatever that doesn't cover, you fill with your own equity — and you've got $2 million to put in.",
  alderByRight:
    "Basically everywhere allows one single-family home per lot without a zoning change, and you've got five lots.",
  alderZoning: "This would require a zoning change. It's probably not worth it.",
  aroNote:
    "One more thing — above ten units the ARO kicks in. Twenty percent of your homes have to be sold affordable, at 80% AMI.",
  dohNoSubsidy:
    "Your construction costs are higher than the anticipated sales price. You need public subsidy, but DOH doesn't have an open application for that right now.",
  permitFlavor:
    "The affordable homes you set out to build? Those are someone else's project now.",
};

export const carlosLines = {
  greeting: "Look — we've lost too many longtime residents already. Show me you're serious about depth. Shallow won't fly here.",
  bonusFired: "Twenty percent at 30% AMI. That's the depth we need. I can carry this to my council colleagues.",
  closingHigh: "You actually built what you said you'd build. People here have heard a lot of promises — thanks for keeping yours.",
  closingMid: "It's not perfect, but it's a start. Hold the line on rents and we won't have a problem.",
  closingLow: "Look, I'll vote for it because we need units. But you didn't earn what some of the neighborhood was hoping for.",
  shelvedAlder: "I can't sell this to the ward right now. Come back when you've got a deeper mix.",
};

export const frankLines = {
  greeting: "I'm not going to lie — most of my constituents don't want this. Bring something with parking and you might get a hearing. Otherwise, expect a fight.",
  parkingAccepted: "All right, that's the kind of partnership the block-club has been asking for. Good.",
  parkingMinimal: "It's not what they wanted but the data helps. I can defend it at the meeting.",
  parkingRefused: "You're going to make this very difficult. Don't say I didn't warn you.",
  closingHigh: "I didn't expect to back this one, but you actually listened. I'll go to bat for it.",
  closingMid: "Close call. Some folks are still mad. But it's going to get built.",
  closingLow: "I'm voting no. You can take it to council without me.",
  shelvedAlder: "I'm not bringing this to a vote. The ward isn't there yet — neither am I.",
};

export const nailaLines = {
  greeting: "Welcome. Our community speaks half a dozen languages on a slow day — meet people where they are and you'll find real partners here.",
  multilingualChoice: "Thank you for showing up the way you did. Real engagement looks like this.",
  closingHigh: "Beautiful work. The whole community feels heard. They'll fill these units the day you open.",
  closingMid: "It's good. Could've been deeper engagement but the design is solid.",
  closingLow: "We needed more from you. The mayor's office will hear about this.",
  shelvedAlder: "I can't take this forward. Come back when you've taken the time to actually meet the people who live here.",
};

export const financeAttackLines = {
  tooExpensive: (perUnit: number) =>
    `$${(perUnit / 1000).toFixed(0)}k per unit. We could buy existing buildings for half that.`,
  tifCorrupt: (neighborhoodName: string) =>
    `That's exactly the pattern we promised to stop. The ${neighborhoodName} TIF is drained dry as it is.`,
  hedWardJealousy: 'Why is HED money going to a ward that\'s already getting TIF? My residents would like a turn.',
};

export const entitlementIntroLines = {
  withZoning:
    "You've agreed with the Department of Housing on how to finance the project, but current zoning doesn't allow a building this big, so you'll need to get a zoning change from City Council. You'll also need Council to approve your financing. I expect you to work with the community to gain support. And of course this takes time, which can reopen your financing gap.",
  withoutZoning:
    "You've agreed with the Department of Housing on how to finance the project. You'll need Council to approve your financing. I expect you to work with the community to gain support. And of course this takes time, which can reopen your financing gap.",
};

export function getNeighborhoodAlderId(n: NeighborhoodId): CharacterId {
  const map: Record<NeighborhoodId, CharacterId> = {
    englewood: 'asha',
    pilsen: 'carlos',
    'jefferson-park': 'frank',
    'albany-park': 'naila',
  };
  return map[n];
}

type RecapCategory = 'alder' | 'david' | 'janelle' | 'asha';

interface RecapEntry {
  category: RecapCategory;
  line: string;
}

export const recapNarratives: Record<string, RecapEntry> = {
  // Pre-application
  'preapp-quiet': { category: 'alder', line: "We met privately over coffee. No reporters, no block-club. It bought us time but the rumor mill started anyway." },
  'preapp-formal-cbo': { category: 'alder', line: "Bringing a CBO partner in early is the right move — letters of support, MOU drafts, joint press. It's how you build the kind of legitimacy that survives a contentious zoning hearing." },
  'preapp-public': { category: 'alder', line: "The press release went out and my phone lit up. We had to spend the next half-year managing the political fallout before any productive conversation could happen." },
  'preapp-multilingual': { category: 'alder', line: "Door-knocking in five languages, printing materials in Spanish, Arabic, Tagalog — this is how you actually reach people. It takes more time, but the trust pays back later." },

  // Community meeting
  'community-none': { category: 'alder', line: "Skipping the meeting bought time, but the block-club heard from the alder's chief of staff, and that conversation went poorly. We're starting CoZ in a hole." },
  'community-story': { category: 'alder', line: "We did six listening sessions before the formal meeting. People wanted to be heard, and that takes calendar time. But they showed up for us at CoZ." },
  'community-coalition': { category: 'alder', line: "Stacking the meeting with clergy, advocates, and CBO partners is a months-long coordination job. It signals breadth and quiets the loudest opponents." },

  // Jefferson Park parking
  'community-jp-full-parking': { category: 'alder', line: "Structured parking is expensive to design, expensive to build. The block-club is happier. The pro forma is not." },
  'community-jp-traffic-data': { category: 'alder', line: "Traffic studies, transit-mode data, a smaller parking variance — defensible, evidence-based, time-consuming." },
  'community-jp-refuse-parking': { category: 'alder', line: "Refusing parking is principled. It is also why the next eight months of the entitlement timeline are going to be hostile." },

  // Zoning committee
  'zoning-hold': { category: 'alder', line: "Holding the line means making the case in committee, defending each unit count, each setback. My chair vote will carry it if I can keep my coalition." },
  'zoning-shrink': { category: 'alder', line: "Shrinking the project gave the block-club a win, which means they're not testifying against us. But the per-unit subsidy math just got worse." },
  'zoning-design-upgrade': { category: 'alder', line: "The committee wanted upgrades — better facade, better common spaces. The community likes the result. The hard cost is 15% higher than what you penciled." },
  'densityVariance': { category: 'david', line: "The committee attached a density-variance condition — height modulation, a setback tweak, a façade study. It adds review months and pushes your hard costs up before you can advance to the vote." },

  // Finance committee
  'finance-reframe': { category: 'alder', line: "Making the per-unit-of-impact argument took preparation — pulling comp data, lining up testimony. It moved the conversation but Cunningham's not letting it go." },
  'finance-concede': { category: 'alder', line: "Conceding on TIF defused Reyes but reopened a $3M gap. The room calmed, but you have to fill that gap before the vote." },
  'finance-stakeholders': { category: 'alder', line: "Bringing in coalition testimony moves the room. It also spends down community goodwill — they showed up for you and they'll expect something back." },

  // Gap resolution
  'askSubsidy': { category: 'david', line: "An additional ask of HOM or HOPWA takes nine months minimum — application, review, NEPA, approval. Your alder spent real political capital to keep the ask moving." },
  'redesignSmaller': { category: 'david', line: "Resizing the project means new architectural drawings, revised pro forma, often a new MEP coordination pass. Six months, minimum." },
  'lowerQuality': { category: 'david', line: "Value-engineering the spec saves on hard costs but takes three months of redesign and resourcing. The block-club will notice." },

  // LIHTC — outcome-aware
  'lihtcSubmit-win': { category: 'janelle', line: "Your application scored above the cutoff — the AMI depth and the project readiness carried it. The 9% allocation is yours. The catch is the calendar: a full year passed waiting for the QAP round to resolve." },
  'lihtcSubmit-loss': { category: 'janelle', line: "The round was competitive and your score landed under the cutoff. No allocation this cycle. To improve next time, deepen the AMI mix or add a CBO partner — and you've already lost twelve months." },
  'lihtcResubmit-win': { category: 'janelle', line: "Resubmitting unchanged paid off — the reviewer pool shifted and your score cleared this year. Allocation secured, twelve months later." },
  'lihtcResubmit-loss': { category: 'janelle', line: "Same application, same result — the score wasn't competitive enough and you lost another twelve months. Without changes, the next round is the same bet." },
  'lihtcRevise-win': { category: 'janelle', line: "The revisions worked: deeper affordability, a stronger CBO letter, cleaner exhibits pushed you over the cutoff. Allocation awarded — at the cost of a year and the rework." },
  'lihtcRevise-loss': { category: 'janelle', line: "Even with the revisions the round stayed out of reach this cycle. The reworked application is stronger for next time, but that's another twelve months gone." },

  // CBO partner first-time
  'cboFirstTime': { category: 'alder', line: "Bringing the CBO on board took six months of conversations, MOU drafting, and joint planning. It was the right call." },

  // Cut-costs sub-screen exit
  'cutCostsExit': { category: 'david', line: "Re-pricing the value-engineering pass took three months. The bank's underwriting moved sideways while you worked." },
};

export function resolveRecapNarrative(
  state: GameState,
  key: string,
): { characterId: string; line: string } | null {
  const entry = recapNarratives[key];
  if (!entry) return null;
  let characterId: string;
  switch (entry.category) {
    case 'alder':
      characterId = state.project.neighborhood ? getNeighborhoodAlderId(state.project.neighborhood) : 'asha';
      break;
    case 'asha':    characterId = 'asha'; break;
    case 'david':   characterId = 'david'; break;
    case 'janelle': characterId = 'janelle'; break;
  }
  return { characterId, line: entry.line };
}
