# Housing Developer Game v3 — Jargon Explainers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tooltip explainers to dotted-underlined jargon (first instance per screen) plus a glossary panel behind a "?" icon in the header. 17 entries across financial / sources / entitlement / compliance categories. Three new components (`TooltipTerm`, `GlossaryPanel`, `JargonScreenScope`), one data file (`data/glossary.ts`), no game-state changes.

**Architecture:** React context for screen-scoped first-instance tracking; pure-presentational components; data lives in `data/glossary.ts` with a `lookup` function. Wraps existing text — no game logic touched. Can ship before, after, or alongside Content Expansion.

**Tech Stack:** React 19 + Vite + TypeScript + Tailwind v4. Vitest + React Testing Library. Baseline: whatever's current after Content Expansion (~190 tests). Target after this plan: **~215 tests**.

**Spec:** `docs/superpowers/specs/2026-06-04-housing-game-jargon-explainers-design.md`

---

## Conventions

Commits prefixed `jargon:`. Component file naming matches existing convention (`PascalCase.tsx` in `src/components/`).

---

## Task 1: Glossary data file with types

Create `data/glossary.ts` with type definitions, the 17 entries, and a `lookup` function.

**Files:**
- Create: `src/data/glossary.ts`
- Create: `tests/data/glossary.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/data/glossary.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { glossary, lookup } from '../../src/data/glossary';

describe('glossary data', () => {
  it('has all 17 canonical entries', () => {
    expect(glossary).toHaveLength(17);
  });

  it('every entry has non-empty required fields', () => {
    for (const e of glossary) {
      expect(e.term).toBeTruthy();
      expect(e.expansion).toBeTruthy();
      expect(e.definition).toBeTruthy();
      expect(e.inGameContext).toBeTruthy();
      expect(['financial', 'sources', 'entitlement', 'compliance']).toContain(e.category);
    }
  });

  it('category counts match the spec', () => {
    const counts = glossary.reduce((acc, e) => { acc[e.category] = (acc[e.category] ?? 0) + 1; return acc; }, {} as Record<string, number>);
    expect(counts.financial).toBe(4);
    expect(counts.sources).toBe(7);
    expect(counts.entitlement).toBe(5);
    expect(counts.compliance).toBe(1);
  });

  it('lookup is case-insensitive and alias-aware', () => {
    expect(lookup('LIHTC')?.term).toBe('LIHTC');
    expect(lookup('lihtc')?.term).toBe('LIHTC');
    expect(lookup('9% LIHTC')?.term).toBe('LIHTC');
    expect(lookup('4% LIHTC')?.term).toBe('LIHTC');
  });

  it('lookup returns undefined for unknown term', () => {
    expect(lookup('not-a-term')).toBeUndefined();
  });

  it('no duplicate strings across term + aliases', () => {
    const seen = new Set<string>();
    for (const e of glossary) {
      const all = [e.term.toLowerCase(), ...(e.aliases ?? []).map((a) => a.toLowerCase())];
      for (const s of all) {
        expect(seen.has(s)).toBe(false);
        seen.add(s);
      }
    }
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- tests/data/glossary.test.ts`
Expected: FAIL — file doesn't exist.

- [ ] **Step 3: Create `src/data/glossary.ts`**

```ts
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
    inGameContext: "TDC is the number your capital stack must cover. Every cost decision rolls up here.",
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
    inGameContext: 'Your project needs at least 25% affordable share to close — below that, the city won\'t subsidize.',
    category: 'compliance',
  },
];

export function lookup(termOrAlias: string): GlossaryEntry | undefined {
  const needle = termOrAlias.toLowerCase();
  return glossary.find((e) =>
    e.term.toLowerCase() === needle ||
    (e.aliases ?? []).some((a) => a.toLowerCase() === needle)
  );
}
```

- [ ] **Step 4: Run all tests**

Run: `npm test -- tests/data/glossary.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/glossary.ts tests/data/glossary.test.ts
git commit -m "jargon: glossary data with 17 entries + lookup"
```

---

## Task 2: `JargonScreenScope` context component

A React context provider whose value is a `useRef<Set<string>>`. Each `TooltipTerm` reads + mutates this set to enforce first-instance behavior.

**Files:**
- Create: `src/components/JargonScreenScope.tsx`

- [ ] **Step 1: Implement the component**

```tsx
import { createContext, useContext, useRef, type ReactNode } from 'react';

interface JargonScopeValue {
  seen: Set<string>;
}

const JargonScopeContext = createContext<JargonScopeValue | null>(null);

export function JargonScreenScope({ children }: { children: ReactNode }) {
  const ref = useRef<Set<string>>(new Set());
  return (
    <JargonScopeContext.Provider value={{ seen: ref.current }}>
      {children}
    </JargonScopeContext.Provider>
  );
}

export function useJargonScope(): JargonScopeValue | null {
  return useContext(JargonScopeContext);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/JargonScreenScope.tsx
git commit -m "jargon: JargonScreenScope context provider"
```

---

## Task 3: `TooltipTerm` component

Wraps child text. First instance gets the dotted underline + interactive tooltip. Subsequent instances render plain.

**Files:**
- Create: `src/components/TooltipTerm.tsx`
- Create: `tests/components/TooltipTerm.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/TooltipTerm.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipTerm } from '../../src/components/TooltipTerm';
import { JargonScreenScope } from '../../src/components/JargonScreenScope';

describe('TooltipTerm', () => {
  it('first instance has dotted-underline class', () => {
    render(
      <JargonScreenScope>
        <TooltipTerm term="LIHTC">LIHTC</TooltipTerm>
      </JargonScreenScope>
    );
    const el = screen.getByText('LIHTC');
    expect(el.className).toContain('jargon-term');  // shared class name we apply
  });

  it('second instance of same term renders plain', () => {
    render(
      <JargonScreenScope>
        <TooltipTerm term="LIHTC">LIHTC</TooltipTerm>
        <TooltipTerm term="LIHTC">LIHTC again</TooltipTerm>
      </JargonScreenScope>
    );
    const second = screen.getByText('LIHTC again');
    expect(second.className).not.toContain('jargon-term');
  });

  it('alias-aware: 9% LIHTC after LIHTC renders plain', () => {
    render(
      <JargonScreenScope>
        <TooltipTerm term="LIHTC">LIHTC</TooltipTerm>
        <TooltipTerm term="9% LIHTC">9% LIHTC</TooltipTerm>
      </JargonScreenScope>
    );
    const second = screen.getByText('9% LIHTC');
    expect(second.className).not.toContain('jargon-term');
  });

  it('unknown term renders plain + dev warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <JargonScreenScope>
        <TooltipTerm term="not-a-real-term">test</TooltipTerm>
      </JargonScreenScope>
    );
    const el = screen.getByText('test');
    expect(el.className).not.toContain('jargon-term');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `npm test -- tests/components/TooltipTerm.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `TooltipTerm`**

Create `src/components/TooltipTerm.tsx`:

```tsx
import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { lookup } from '../data/glossary';
import { useJargonScope } from './JargonScreenScope';

interface Props {
  term: string;
  children: ReactNode;
}

export function TooltipTerm({ term, children }: Props) {
  const scope = useJargonScope();
  const entry = lookup(term);

  // Compute first-instance status once at mount. Set is mutated below.
  const isFirstInstance = useMemo(() => {
    if (!scope || !entry) return false;
    const key = entry.term.toLowerCase();
    if (scope.seen.has(key)) return false;
    scope.seen.add(key);
    return true;
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!entry && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`TooltipTerm: no glossary entry for "${term}"`);
    }
  }, [entry, term]);

  if (!entry || !isFirstInstance) {
    return <>{children}</>;
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        className="jargon-term"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        aria-expanded={open}
      >
        {children}
      </button>
      {open && (
        <span className="absolute bottom-full left-0 mb-1 w-72 z-20 rounded-lg border border-line bg-panel p-3 text-sm shadow-lg" role="tooltip">
          <div className="font-semibold">{entry.expansion}</div>
          <div className="text-muted mt-1">{entry.definition}</div>
          <div className="text-ink mt-2">{entry.inGameContext}</div>
        </span>
      )}
    </span>
  );
}
```

Add the `jargon-term` style in `src/index.css`:

```css
.jargon-term {
  border-bottom: 1px dotted currentColor;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font: inherit;
  color: inherit;
}
.jargon-term:hover { color: var(--accent); }
.jargon-term:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/TooltipTerm.tsx src/index.css tests/components/TooltipTerm.test.tsx
git commit -m "jargon: TooltipTerm component with first-instance + alias-aware behavior"
```

---

## Task 4: `GlossaryPanel` component

Slide-over panel triggered from Header. Lists all 17 entries grouped by category with a search box.

**Files:**
- Create: `src/components/GlossaryPanel.tsx`
- Create: `tests/components/GlossaryPanel.test.tsx`

- [ ] **Step 1: Write failing test**

Create `tests/components/GlossaryPanel.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlossaryPanel } from '../../src/components/GlossaryPanel';

describe('GlossaryPanel', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<GlossaryPanel open={false} onClose={() => {}} />);
    expect(container.querySelector('[data-glossary-panel]')).toBeNull();
  });

  it('renders all 17 entries when open', () => {
    render(<GlossaryPanel open={true} onClose={() => {}} />);
    expect(screen.getByText('LIHTC')).toBeInTheDocument();
    expect(screen.getByText('AMI')).toBeInTheDocument();
    expect(screen.getByText('ARO')).toBeInTheDocument();
    expect(screen.getByText('CDBG')).toBeInTheDocument();
  });

  it('renders category headings', () => {
    render(<GlossaryPanel open={true} onClose={() => {}} />);
    expect(screen.getByText(/Financial/i)).toBeInTheDocument();
    expect(screen.getByText(/Sources/i)).toBeInTheDocument();
    expect(screen.getByText(/Entitlement/i)).toBeInTheDocument();
    expect(screen.getByText(/Compliance/i)).toBeInTheDocument();
  });

  it('search filters entries by case-insensitive substring', () => {
    render(<GlossaryPanel open={true} onClose={() => {}} />);
    const search = screen.getByPlaceholderText(/search/i);
    fireEvent.change(search, { target: { value: 'tax' } });
    expect(screen.getByText('LIHTC')).toBeInTheDocument();   // "tax credit"
    expect(screen.getByText('TIF')).toBeInTheDocument();     // "tax increment"
    expect(screen.queryByText('CBO')).not.toBeInTheDocument();
  });

  it('Esc key triggers onClose', () => {
    const onClose = vi.fn();
    render(<GlossaryPanel open={true} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
```

(Import `vi` from vitest at the top.)

- [ ] **Step 2: Run failing test**

Run: `npm test -- tests/components/GlossaryPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `GlossaryPanel`**

Create `src/components/GlossaryPanel.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { glossary, type GlossaryCategory } from '../data/glossary';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_TITLES: Record<GlossaryCategory, string> = {
  financial: 'Financial',
  sources: 'Sources',
  entitlement: 'Entitlement',
  compliance: 'Compliance',
};

export function GlossaryPanel({ open, onClose }: Props) {
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = q.trim()
    ? glossary.filter((e) => {
        const n = q.trim().toLowerCase();
        return e.term.toLowerCase().includes(n)
          || e.expansion.toLowerCase().includes(n)
          || e.definition.toLowerCase().includes(n);
      })
    : glossary;

  const byCategory: Record<GlossaryCategory, typeof glossary> = {
    financial: [],
    sources: [],
    entitlement: [],
    compliance: [],
  };
  for (const e of filtered) byCategory[e.category].push(e);

  return (
    <div
      data-glossary-panel
      className="fixed inset-y-0 right-0 w-full md:w-[40rem] bg-panel border-l border-line shadow-xl z-50 flex flex-col"
      role="dialog"
      aria-label="Glossary"
    >
      <div className="flex items-center justify-between p-4 border-b border-line">
        <h2 className="text-lg font-semibold">Glossary</h2>
        <button type="button" onClick={onClose} aria-label="Close glossary">×</button>
      </div>
      <div className="p-4 border-b border-line">
        <input
          type="text"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full px-3 py-2 border border-line rounded-lg"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {(['financial', 'sources', 'entitlement', 'compliance'] as GlossaryCategory[]).map((cat) =>
          byCategory[cat].length > 0 ? (
            <section key={cat}>
              <h3 className="text-xs uppercase tracking-wide text-muted mb-2">{CATEGORY_TITLES[cat]}</h3>
              <div className="space-y-3">
                {byCategory[cat].map((e) => (
                  <div key={e.term} className="border border-line rounded-lg p-3">
                    <div className="font-semibold">{e.term}</div>
                    <div className="text-sm text-muted">{e.expansion}</div>
                    <div className="text-sm mt-1">{e.definition}</div>
                    <div className="text-sm mt-1 italic">{e.inGameContext}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/GlossaryPanel.tsx tests/components/GlossaryPanel.test.tsx
git commit -m "jargon: GlossaryPanel slide-over with search + category groups"
```

---

## Task 5: Wire "?" icon into `Header.tsx`

Header gets a "?" button next to `TimelinePill`. Clicking opens `GlossaryPanel`.

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Update `Header.tsx`**

```tsx
import { useState } from 'react';
import { GlossaryPanel } from './GlossaryPanel';
import { TimelinePill } from './TimelinePill';

export function Header() {
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <div /* ...existing left side... */ />
        <div className="flex items-center gap-2">
          <TimelinePill />
          <button
            type="button"
            onClick={() => setGlossaryOpen(true)}
            aria-label="Open glossary"
            className="w-7 h-7 flex items-center justify-center border border-line rounded-full hover:bg-panel"
          >
            ?
          </button>
        </div>
      </div>
      <GlossaryPanel open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </>
  );
}
```

- [ ] **Step 2: Manual verification**

Run dev server. The "?" icon shows in the Header on every screen. Click → glossary opens. Click outside / press Esc → closes.

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.tsx
git commit -m "jargon: ? icon in Header opens GlossaryPanel"
```

---

## Task 6: Wrap each screen with `JargonScreenScope`

Each screen's top-level JSX wraps in `<JargonScreenScope>`.

**Files:**
- Modify: `src/screens/IntroScreen.tsx`
- Modify: `src/screens/SiteAndConcept.tsx`
- Modify: `src/screens/ProForma.tsx`
- Modify: `src/screens/CapitalStack.tsx`
- Modify: `src/screens/Entitlement.tsx`
- Modify: `src/screens/Close.tsx`
- Modify: `src/screens/GapResolution.tsx` (if Phase 2-era spec retained it)

- [ ] **Step 1: For each screen**

Import the scope and wrap the top-level return:

```tsx
import { JargonScreenScope } from '../components/JargonScreenScope';

export function ProForma() {
  // ...existing
  return (
    <JargonScreenScope>
      <div className="max-w-6xl mx-auto p-6">
        {/* ...existing content */}
      </div>
    </JargonScreenScope>
  );
}
```

Repeat for every screen.

- [ ] **Step 2: Commit**

```bash
git add src/screens/
git commit -m "jargon: JargonScreenScope wraps every screen"
```

---

## Task 7: Add `TooltipTerm` wraps to Pro Forma

Wrap `TDC`, `AMI`, `DSCR`, `NOI`, `QAP`, `LIHTC` on first occurrence.

**Files:**
- Modify: `src/screens/ProForma.tsx`

- [ ] **Step 1: Wrap terms in JSX**

Find each first occurrence:

- TDC breakdown header: `<h3>TDC</h3>` → `<h3><TooltipTerm term="TDC">TDC</TooltipTerm></h3>`
- AMI section: `<h3>AMI breakdown</h3>` → `<h3><TooltipTerm term="AMI">AMI</TooltipTerm> breakdown</h3>`
- Marcus card heading or first DSCR mention → `<TooltipTerm term="DSCR">DSCR</TooltipTerm>`
- Marcus's NOI mention → `<TooltipTerm term="NOI">NOI</TooltipTerm>`
- QAP projection card heading → `<TooltipTerm term="QAP">QAP</TooltipTerm>`
- First LIHTC mention in QAP card → `<TooltipTerm term="LIHTC">LIHTC</TooltipTerm>`

Import:

```tsx
import { TooltipTerm } from '../components/TooltipTerm';
```

- [ ] **Step 2: Manual verification**

Run dev server. On Pro Forma, the six terms have dotted underlines on first occurrence. Click → tooltip opens with expansion/definition/inGameContext.

- [ ] **Step 3: Commit**

```bash
git add src/screens/ProForma.tsx
git commit -m "jargon: TooltipTerm wraps on Pro Forma (TDC, AMI, DSCR, NOI, QAP, LIHTC)"
```

---

## Task 8: Add `TooltipTerm` wraps to Capital Stack

Wrap source-card titles for TIF, HED Bond, CDBG, HOME, IAHTC. Wrap TDC in gap bar. Wrap LIHTC in LIHTC source card. Wrap QAP in QAP projection card.

**Files:**
- Modify: `src/screens/CapitalStack.tsx`

- [ ] **Step 1: Wrap source-card titles**

Each `SourceCard` title accepts a `name` string. Either:
- (a) Wrap the rendered title inside `SourceCard` with `<TooltipTerm term={n.name}>{n.name}</TooltipTerm>` for the canonical-term sources, or
- (b) Pre-process the rendered title at the call site.

Option (a) is cleanest. Modify `SourceCard.tsx` to wrap the title with `TooltipTerm`:

```tsx
<h3 className="font-semibold"><TooltipTerm term={source.name}>{source.name}</TooltipTerm></h3>
```

Glossary `lookup` will return `undefined` for non-jargon source names — TooltipTerm falls through to plain text. Safe.

- [ ] **Step 2: Wrap gap-bar TDC**

In `CapitalStack.tsx` gap bar, wrap `TDC` first occurrence with `<TooltipTerm term="TDC">TDC</TooltipTerm>`.

- [ ] **Step 3: Wrap QAP and LIHTC in projection card**

In the QAP projection card heading: `<TooltipTerm term="QAP">QAP</TooltipTerm>`.
In LIHTC source card description: `<TooltipTerm term="LIHTC">LIHTC</TooltipTerm>`.

- [ ] **Step 4: Manual verification**

Run dev server. Capital Stack shows dotted underlines on the eight jargon terms (TDC, LIHTC, QAP, TIF, HED Bond, CDBG, HOME, IAHTC) on first occurrence.

- [ ] **Step 5: Commit**

```bash
git add src/screens/CapitalStack.tsx src/components/SourceCard.tsx
git commit -m "jargon: TooltipTerm wraps on Capital Stack source cards + gap bar"
```

---

## Task 9: Add `TooltipTerm` wraps to Entitlement

Wrap the path token (`By-right` / `ZMA` / `PD`) on the path tracker. Wrap `CBO` on the preapp-formal-cbo choice. Wrap `density variance` on the larger-building info row.

**Files:**
- Modify: `src/screens/Entitlement.tsx`

- [ ] **Step 1: Wrap path token**

In the path tracker:

```tsx
<span className="uppercase">
  <TooltipTerm term={path === 'by-right' ? 'By-right' : path === 'zma' ? 'ZMA' : 'PD'}>
    {path === 'by-right' ? 'By-right' : path.toUpperCase()}
  </TooltipTerm>
</span>
```

- [ ] **Step 2: Wrap CBO**

In the preapp-formal-cbo choice card title or description:

```tsx
<TooltipTerm term="CBO">CBO</TooltipTerm>
```

- [ ] **Step 3: Wrap density variance**

In the larger-building zoning-step info row (added in Phase 2 task 5):

```tsx
<strong><TooltipTerm term="Density variance">Density variance</TooltipTerm> condition.</strong>
```

- [ ] **Step 4: Manual verification**

Run dev server. Entitlement screen shows dotted underlines on path token, CBO (when visible), and density variance (when larger building).

- [ ] **Step 5: Commit**

```bash
git add src/screens/Entitlement.tsx
git commit -m "jargon: TooltipTerm wraps on Entitlement (path token, CBO, density variance)"
```

---

## Task 10: Add `TooltipTerm` wraps to Site & Concept + Close

Site & Concept: wrap `CBO` (CBO partner row) and `ARO` (mixed-income subtitle).
Close: wrap `ARO` in shelved-aro David Park line; wrap `AMI` in impact breakdown.

**Files:**
- Modify: `src/screens/SiteAndConcept.tsx`
- Modify: `src/screens/Close.tsx`

- [ ] **Step 1: Site & Concept**

In the CBO partner row:

```tsx
<TooltipTerm term="CBO">CBO</TooltipTerm>
```

In the mixed-income Intent card subtitle, add the new ARO line (per spec): `"Some affordability still required under the ARO"`:

```tsx
<div className="text-xs text-muted mt-2">
  Some affordability still required under the <TooltipTerm term="ARO">ARO</TooltipTerm>.
</div>
```

- [ ] **Step 2: Close**

In the `shelvedAroReactions` block in `closeReactions.ts`, the David Park line includes "ARO". Wrap inline in `Close.tsx` when rendering the reaction:

The Reaction interface returns a `line: string`, so wrapping requires special-casing or a renderer. Simplest: replace the Close screen's `line` rendering with a token-aware renderer, OR add a `tooltipTerms?: string[]` field on Reaction and have the renderer wrap matching substrings.

Pragmatic minimal approach: hand-author the ARO mention as JSX in the `Close.tsx` render path for `shelved-aro`:

```tsx
if (state.outcome === 'shelved-aro') {
  return (
    <>
      <ReactionRow speaker="David Park" affiliation="Senior Analyst, Chicago Department of Housing">
        The <TooltipTerm term="ARO">ARO</TooltipTerm> requires 20% affordability anyway. We're not going to subsidize that.
      </ReactionRow>
      {/* other shelved-aro reactions */}
    </>
  );
}
```

For impact breakdown — find the AMI mention:

```tsx
<TooltipTerm term="AMI">AMI</TooltipTerm>
```

- [ ] **Step 3: Manual verification**

Run dev server. Site & Concept: CBO and ARO have dotted underlines. Close (shelved-aro outcome): ARO underlined.

- [ ] **Step 4: Commit**

```bash
git add src/screens/SiteAndConcept.tsx src/screens/Close.tsx
git commit -m "jargon: TooltipTerm wraps on Site & Concept (CBO, ARO) + Close (ARO, AMI)"
```

---

## Task 11: Final smoke test + deploy

- [ ] **Step 1: Run full suite**

Run: `npm test`
Expected: ~215 tests passing.

- [ ] **Step 2: Manual playthrough**

Run dev server. Walk through Englewood + mid-rise + all-affordable:
- Pro Forma: hover TDC, AMI, DSCR, NOI, QAP, LIHTC. Each shows tooltip.
- Capital Stack: hover TIF, CDBG, HOME, IAHTC, HED Bond. Each shows tooltip.
- Entitlement: hover ZMA (path token), CBO.
- "?" icon visible in Header on every screen.
- Open glossary. All 17 entries visible grouped by category. Search filters correctly.

- [ ] **Step 3: Push and deploy**

```bash
git push
```

Cloudflare auto-deploy. Verify "?" icon visible at live URL.

- [ ] **Step 4: No commit needed unless fixes**

---

## Done

**Jargon Explainers ships when:**
- `data/glossary.ts` has all 17 entries with non-empty `expansion`, `definition`, `inGameContext`.
- `TooltipTerm` first-instance + alias-aware behavior works.
- `GlossaryPanel` opens via "?" icon, lists all 17 grouped by 4 categories, search filters correctly, Esc closes.
- Every screen wraps in `JargonScreenScope`.
- TooltipTerm wraps applied on Pro Forma (6 terms), Capital Stack (8 terms), Entitlement (3 terms), Site & Concept (2 terms), Close (2 terms).
- Suite passing at ~215 tests, no regressions.
- Cloudflare deploy succeeds; "?" icon visible at live URL; at least one tooltip on each screen.
