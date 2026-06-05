export type GlossaryCategory = 'financial' | 'sources' | 'entitlement' | 'compliance';

export interface GlossaryEntry {
  term: string;
  aliases?: string[];
  expansion: string;
  definition: string;
  inGameContext: string;
  category: GlossaryCategory;
}

export const glossary: GlossaryEntry[] = [
  // FINANCIAL (4)
  {
    term: 'AMI',
    expansion: 'Area Median Income',
    definition: 'The HUD-set income benchmark for a metro area; affordability tiers are defined as percentages of AMI.',
    inGameContext: 'Your AMI mix (30/60/80) sets what rents you can charge and how QAP scores you for deep affordability.',
    category: 'financial',
  },
  {
    term: 'DSCR',
    expansion: 'Debt Service Coverage Ratio',
    definition: 'Net operating income divided by annual debt service; lenders require ≥1.20 to underwrite.',
    inGameContext: 'Marcus uses DSCR to size your supportable loan — higher NOI means more debt the bank will fund.',
    category: 'financial',
  },
  {
    term: 'NOI',
    expansion: 'Net Operating Income',
    definition: 'Annual rental income minus operating expenses; the foundation of any real-estate valuation.',
    inGameContext: 'Your NOI flows into DSCR to determine how much loan you can support; raising NOI shrinks the gap.',
    category: 'financial',
  },
  {
    term: 'TDC',
    expansion: 'Total Development Cost',
    definition: 'All-in cost of the project — hard, soft, contingency, land, and any conditions.',
    inGameContext: 'TDC is the number your capital stack must cover. Every cost decision rolls up here.',
    category: 'financial',
  },

  // SOURCES (7)
  {
    term: 'LIHTC',
    aliases: ['9% LIHTC', '4% LIHTC'],
    expansion: 'Low-Income Housing Tax Credit',
    definition: 'A federal tax-credit program allocated by states via a competitive Qualified Allocation Plan (QAP).',
    inGameContext: '9% LIHTC is usually your largest single source. Winning means scoring high on the QAP factors and getting picked.',
    category: 'sources',
  },
  {
    term: 'QAP',
    expansion: 'Qualified Allocation Plan',
    definition: 'The state-set scoring rubric for allocating LIHTC credits; weighted by affordability depth, location, and other factors.',
    inGameContext: 'Your projected QAP score on Pro Forma determines your odds when you apply for 9% LIHTC.',
    category: 'sources',
  },
  {
    term: 'TIF',
    expansion: 'Tax Increment Financing',
    definition: 'A municipal tool that captures future property-tax growth within a designated district to fund development.',
    inGameContext: 'TIF is available in some Chicago neighborhoods (not all). It costs alder goodwill but adds real capital.',
    category: 'sources',
  },
  {
    term: 'HED Bond',
    expansion: 'Housing & Economic Development Bond',
    definition: 'Chicago-issued bond proceeds dedicated to affordable housing and economic development projects.',
    inGameContext: 'HED Bonds are a city subsidy lane available alongside DOH loans. Costs alder goodwill to secure.',
    category: 'sources',
  },
  {
    term: 'CDBG',
    expansion: 'Community Development Block Grant',
    definition: 'Federal HUD grants distributed through cities and states for community development uses.',
    inGameContext: 'CDBG is a smaller flexible source — useful for closing the last few hundred thousand of gap.',
    category: 'sources',
  },
  {
    term: 'HOME',
    expansion: 'HOME Investment Partnerships Program',
    definition: 'A federal HUD block grant specifically for affordable rental and homeownership development.',
    inGameContext: 'HOME funds layer cleanly with LIHTC and DOH loans. Modest amount, modest complexity.',
    category: 'sources',
  },
  {
    term: 'IAHTC',
    expansion: 'Illinois Affordable Housing Tax Credit',
    definition: 'A state-level donation tax credit that yields a fixed amount of equity per qualifying donation.',
    inGameContext: 'IAHTC fills a smaller slice of the stack but every source past five triggers complexity penalty.',
    category: 'sources',
  },

  // ENTITLEMENT (5)
  {
    term: 'By-right',
    expansion: 'By-right development',
    definition: 'Development permitted under existing zoning without a discretionary approval from the city.',
    inGameContext: 'A by-right path skips the Committee on Zoning step — three entitlement steps instead of four.',
    category: 'entitlement',
  },
  {
    term: 'ZMA',
    expansion: 'Zoning Map Amendment',
    definition: 'A formal rezoning request that changes the zoning designation of a specific parcel.',
    inGameContext: 'ZMA is the standard path for mid-rise and for any multifamily in single-family-zoned Jefferson Park.',
    category: 'entitlement',
  },
  {
    term: 'PD',
    expansion: 'Planned Development',
    definition: 'A larger, site-specific zoning vehicle with negotiated design controls; required for substantial projects.',
    inGameContext: 'PD is the path for Larger buildings — adds friction at the Committee on Zoning step.',
    category: 'entitlement',
  },
  {
    term: 'CBO',
    expansion: 'Community-Based Organization',
    definition: 'A non-profit organization with deep ties to a specific neighborhood, often a development partner.',
    inGameContext: 'Partnering with a CBO costs +6 months pre-app but boosts QAP score and community support.',
    category: 'entitlement',
  },
  {
    term: 'Density variance',
    expansion: 'Density variance',
    definition: 'A zoning condition allowing more density than base zoning permits, usually with offsetting conditions.',
    inGameContext: 'Larger buildings automatically pick up a density-variance condition at Committee on Zoning: +$25k/u, +3 mo.',
    category: 'entitlement',
  },

  // COMPLIANCE (1)
  {
    term: 'ARO',
    expansion: 'Affordable Requirements Ordinance',
    definition: "Chicago's inclusionary-zoning law requiring affordable units in new residential developments above a size threshold.",
    inGameContext: "Your project needs at least 25% affordable share to close — below that, the city won't subsidize.",
    category: 'compliance',
  },
];

export function lookup(termOrAlias: string): GlossaryEntry | undefined {
  const needle = termOrAlias.toLowerCase();
  return glossary.find(
    (e) =>
      e.term.toLowerCase() === needle ||
      (e.aliases ?? []).some((a) => a.toLowerCase() === needle)
  );
}
