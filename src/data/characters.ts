export type CharacterId = 'marcus' | 'asha' | 'janelle' | 'david' | 'powell' | 'reyes' | 'chen';

export interface Character {
  id: CharacterId;
  name: string;
  emoji: string;
  role: string;
}

export const characters: Record<CharacterId, Character> = {
  marcus: { id: 'marcus', name: 'Marcus Bell', emoji: '🏦', role: 'Construction Lender, Loop Federal Bank' },
  asha:   { id: 'asha', name: 'Asha Tran', emoji: '🧑‍💼', role: 'Your alderperson' },
  janelle:{ id: 'janelle', name: 'Janelle', emoji: '🏛️', role: 'IHDA reviewer' },
  david:  { id: 'david', name: 'David Park', emoji: '🏛️', role: 'Senior Analyst, Chicago Department of Housing' },
  powell: { id: 'powell', name: 'Ald. Powell', emoji: '⚖️', role: 'Fiscal hawk' },
  reyes:  { id: 'reyes', name: 'Ald. Reyes', emoji: '📣', role: 'TIF reformer' },
  chen:   { id: 'chen', name: 'Ald. Chen', emoji: '🏢', role: 'Other-ward alder' },
};

export const marcusLines = {
  dscrLimited: 'Honestly, my loan barely matters here. At 60% AMI rents the income only supports a small piece — and that\'s most of what any bank will give you on this deal. The real work is in front of you: IHDA, DOH, TIF, and credits.',
  ltvLimited: 'Your value\'s healthy enough that I could lend more on paper, but the income still has to service it. We\'re LTV-limited, not DSCR — that\'s a rare position for affordable.',
  generic: 'Your project pencils on the income side. Let me know when you\'re ready to close the construction loan.',
  intro: 'I\'ll size your loan against the income. The bank rule is Debt Service Coverage Ratio (DSCR) ≥ 1.20 — you have to generate at least 20% more rent than the loan needs each year.',
  walkthroughClosing: (loan: number, tdc: number) =>
    `Translation: I can lend you about $${(loan / 1_000_000).toFixed(1)}M against a $${(tdc / 1_000_000).toFixed(0)}M project. The other $${((tdc - loan) / 1_000_000).toFixed(0)}M is where the work gets real.`,
};

export const ashaLines = {
  preappQuiet: 'I appreciate the heads up. A quieter rollout works for me — let\'s see how the block club takes it.',
  preappFormalCBO: 'Bringing a CBO partner in early is the right move. The community will read it as respect.',
  preappPublic: 'A public pre-launch is bold. I hope you\'re ready for the calls I\'ll get on Monday.',
  communityData: 'Data-led works on me. It might not land for everyone in the room, though.',
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
};

export const janelleLines = {
  qapScoreLow: 'Your QAP score is weak. You can submit and gamble, or strengthen the application — deepening affordability or lining up other commitments first.',
  qapScoreMid: 'You\'re in the mix. Statewide, roughly one in five applications win in any round. The other commitments you\'re lining up will help.',
  qapScoreHigh: 'Strong application. If the IHDA staff likes the project on its merits, you have a real shot this round.',
  fiveSources: 'You\'re at 5 sources — anything more comes with a soft-cost penalty. Look hard at HED Bond or a small IAHTC for clean fill.',
};

export const davidLines = {
  dohWelcome: 'DOH is on board with your profile. We\'ll need a coherent stack before final commitment — show me what else you\'re lining up.',
  capitalStackIntro: 'Putting this together is what we call assembling the capital stack — soft loans, grants, tax credits, and equity stacked to your TDC. Three rules: every source closes more of the gap; every source takes time, and time is money (hard costs escalate ~5%/year); past 5 sources, complexity penalty kicks in at ~$20k/unit per extra source. The art is closing the gap with the smallest, fastest set of sources you can.',
};

export const financeAttackLines = {
  tooExpensive: (perUnit: number) =>
    `$${(perUnit / 1000).toFixed(0)}k per unit. We could buy existing buildings for half that.`,
  tifCorrupt: 'That\'s exactly the pattern we promised to stop. Englewood TIF is drained dry as it is.',
  hedWardJealousy: 'Why is HED money going to a ward that\'s already getting TIF? My residents would like a turn.',
};
