# Single-Family "Give Up" Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Give up and build single-family homes" popup module that lets the player build 1–15 market-rate single-family homes for sale, with its own pro forma, financing, and two endings (permit granted, or DOH dead-end).

**Architecture:** A self-contained `SingleFamilyModal` rendered once in `App.tsx` (like `RecapCard`), toggled by a single `sfhOpen` store flag. Pure economics live in `src/game/singleFamily.ts` (data tables in `src/data/singleFamily.ts`); the modal reads them and the selected neighborhood. The existing phase system is untouched; only "Apply for permits" commits to the single-family ending.

**Tech Stack:** React 19, Zustand 5, TypeScript, Vitest + @testing-library/react, Tailwind.

**Design spec:** `docs/superpowers/specs/2026-06-10-single-family-pivot-design.md`

---

## File map

- **Create** `src/data/singleFamily.ts` — constants + sales-price matrix + TDC tiers + tier helper.
- **Create** `src/game/singleFamily.ts` — `SfhDeal` type, `aroAffordableCount`, `computeSfhDeal`.
- **Create** `src/components/SingleFamilyModal.tsx` — the overlay (form view + permit view + inline stack bar).
- **Modify** `src/game/types.ts` — add `sfhOpen` to `GameState`.
- **Modify** `src/game/state.ts` — add `sfhOpen` to `initialState`; add `openSfh` / `closeSfh` actions.
- **Modify** `src/data/characters.ts` — add `sfhLines`.
- **Modify** `src/App.tsx` — render `<SingleFamilyModal />`.
- **Modify** `src/screens/SiteAndConcept.tsx` — entry button.
- **Modify** `src/screens/CapitalStack.tsx` — entry button.
- **Modify** `src/screens/GapResolution.tsx` — entry button.
- **Create** tests: `tests/data/singleFamily.test.ts`, `tests/game/singleFamily.test.ts`, `tests/game/sfhStore.test.ts`, `tests/components/SingleFamilyModal.test.tsx`, `tests/components/sfhEntryButtons.test.tsx`.

---

## Task 1: Single-family data tables

**Files:**
- Create: `src/data/singleFamily.ts`
- Test: `tests/data/singleFamily.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/data/singleFamily.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  sfhUnitTier,
  SFH_TDC_PER_UNIT,
  SFH_MARKET_PRICE,
  EQUITY_BUDGET,
  AFFORDABLE_PRICE,
  PERMIT_DAYS,
  SFH_MIN_UNITS,
  SFH_MAX_UNITS,
} from '../../src/data/singleFamily';

describe('sfhUnitTier', () => {
  it('maps unit counts to tiers', () => {
    expect(sfhUnitTier(1)).toBe('1');
    expect(sfhUnitTier(2)).toBe('2');
    expect(sfhUnitTier(3)).toBe('3-5');
    expect(sfhUnitTier(5)).toBe('3-5');
    expect(sfhUnitTier(6)).toBe('6-15');
    expect(sfhUnitTier(15)).toBe('6-15');
  });
});

describe('SFH constants and tables', () => {
  it('TDC tiers match spec', () => {
    expect(SFH_TDC_PER_UNIT['1']).toBe(500_000);
    expect(SFH_TDC_PER_UNIT['2']).toBe(400_000);
    expect(SFH_TDC_PER_UNIT['3-5']).toBe(350_000);
    expect(SFH_TDC_PER_UNIT['6-15']).toBe(300_000);
  });

  it('market prices match spec for each neighborhood', () => {
    expect(SFH_MARKET_PRICE['jefferson-park']['1']).toBe(1_300_000);
    expect(SFH_MARKET_PRICE['pilsen']['6-15']).toBe(750_000);
    expect(SFH_MARKET_PRICE['albany-park']['3-5']).toBe(800_000);
    expect(SFH_MARKET_PRICE['englewood']['2']).toBe(375_000);
  });

  it('budget constants match spec', () => {
    expect(EQUITY_BUDGET).toBe(2_000_000);
    expect(AFFORDABLE_PRICE).toBe(250_000);
    expect(PERMIT_DAYS).toBe(120);
    expect(SFH_MIN_UNITS).toBe(1);
    expect(SFH_MAX_UNITS).toBe(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/data/singleFamily.test.ts`
Expected: FAIL — cannot find module `../../src/data/singleFamily`.

- [ ] **Step 3: Write minimal implementation**

Create `src/data/singleFamily.ts`:

```ts
import { NeighborhoodId } from '../game/types';

export const EQUITY_BUDGET = 2_000_000;
export const AFFORDABLE_PRICE = 250_000;
export const PERMIT_DAYS = 120;
export const SFH_MIN_UNITS = 1;
export const SFH_MAX_UNITS = 15;

export type SfhUnitTier = '1' | '2' | '3-5' | '6-15';

export function sfhUnitTier(units: number): SfhUnitTier {
  if (units <= 1) return '1';
  if (units === 2) return '2';
  if (units <= 5) return '3-5';
  return '6-15';
}

export const SFH_TDC_PER_UNIT: Record<SfhUnitTier, number> = {
  '1': 500_000,
  '2': 400_000,
  '3-5': 350_000,
  '6-15': 300_000,
};

// Market sales price per unit, by neighborhood × unit tier.
export const SFH_MARKET_PRICE: Record<NeighborhoodId, Record<SfhUnitTier, number>> = {
  'jefferson-park': { '1': 1_300_000, '2': 1_100_000, '3-5': 900_000, '6-15': 750_000 },
  pilsen:           { '1': 1_300_000, '2': 1_100_000, '3-5': 900_000, '6-15': 750_000 },
  'albany-park':    { '1': 1_100_000, '2': 1_000_000, '3-5': 800_000, '6-15': 600_000 },
  englewood:        { '1':   400_000, '2':   375_000, '3-5': 300_000, '6-15': 275_000 },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/data/singleFamily.test.ts`
Expected: PASS (all assertions).

- [ ] **Step 5: Commit**

```bash
git add src/data/singleFamily.ts tests/data/singleFamily.test.ts
git commit -m "feat: single-family data tables (TDC tiers, sales matrix, constants)"
```

---

## Task 2: Single-family economics (`computeSfhDeal`)

**Files:**
- Create: `src/game/singleFamily.ts`
- Test: `tests/game/singleFamily.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/game/singleFamily.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeSfhDeal, aroAffordableCount } from '../../src/game/singleFamily';

describe('aroAffordableCount', () => {
  it('is 0 at or below 10 units', () => {
    expect(aroAffordableCount(10)).toBe(0);
    expect(aroAffordableCount(1)).toBe(0);
  });
  it('is 2 for 11-14 units and 3 only at 15 (floor of 20%)', () => {
    expect(aroAffordableCount(11)).toBe(2);
    expect(aroAffordableCount(14)).toBe(2);
    expect(aroAffordableCount(15)).toBe(3);
  });
});

describe('computeSfhDeal — buildable high-cost deals', () => {
  it('Jefferson Park 1 unit: $800k profit, construction-bound loan', () => {
    const d = computeSfhDeal('jefferson-park', 1);
    expect(d.totalTDC).toBe(500_000);
    expect(d.salesRevenue).toBe(1_300_000);
    expect(d.loan).toBe(400_000);
    expect(d.loanBinding).toBe('construction');
    expect(d.equity).toBe(100_000);
    expect(d.gap).toBe(0);
    expect(d.profit).toBe(800_000);
    expect(d.needsSubsidy).toBe(false);
    expect(d.requiresZoning).toBe(false);
    expect(d.aroTriggered).toBe(false);
  });

  it('Jefferson Park 15 units: ARO 2 affordable, $5.75M profit', () => {
    const d = computeSfhDeal('jefferson-park', 15);
    expect(d.aroAffordableCount).toBe(2);
    expect(d.marketUnits).toBe(13);
    expect(d.totalTDC).toBe(4_500_000);
    // 13 × $750k + 2 × $250k = $9.75M + $0.5M = $10.25M
    expect(d.salesRevenue).toBe(10_250_000);
    expect(d.loan).toBe(3_600_000);
    expect(d.profit).toBe(5_750_000);
    expect(d.requiresZoning).toBe(true);
    expect(d.aroTriggered).toBe(true);
    expect(d.needsSubsidy).toBe(false);
  });

  it('Albany Park 5 units: $2.25M profit, no zoning/ARO', () => {
    const d = computeSfhDeal('albany-park', 5);
    expect(d.totalTDC).toBe(1_750_000);
    expect(d.salesRevenue).toBe(4_000_000);
    expect(d.loan).toBe(1_400_000);
    expect(d.equity).toBe(350_000);
    expect(d.profit).toBe(2_250_000);
    expect(d.requiresZoning).toBe(false);
  });
});

describe('computeSfhDeal — Englewood always dead-ends', () => {
  it('1 unit: TDC exceeds sales → needsSubsidy', () => {
    const d = computeSfhDeal('englewood', 1);
    expect(d.totalTDC).toBe(500_000);
    expect(d.salesRevenue).toBe(400_000);
    expect(d.profit).toBe(-100_000);
    expect(d.needsSubsidy).toBe(true);
    expect(d.loanBinding).toBe('sales');
  });

  it('15 units: ARO 2 affordable, still needsSubsidy', () => {
    const d = computeSfhDeal('englewood', 15);
    expect(d.aroAffordableCount).toBe(2);
    expect(d.totalTDC).toBe(4_500_000);
    // 13 × $275k + 2 × $250k = $3.575M + $0.5M = $4.075M
    expect(d.salesRevenue).toBe(4_075_000);
    expect(d.needsSubsidy).toBe(true);
  });
});

describe('computeSfhDeal — flags at boundaries', () => {
  it('requiresZoning turns on above 5 units', () => {
    expect(computeSfhDeal('pilsen', 5).requiresZoning).toBe(false);
    expect(computeSfhDeal('pilsen', 6).requiresZoning).toBe(true);
  });
  it('aroTriggered turns on above 10 units', () => {
    expect(computeSfhDeal('pilsen', 10).aroTriggered).toBe(false);
    expect(computeSfhDeal('pilsen', 11).aroTriggered).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/game/singleFamily.test.ts`
Expected: FAIL — cannot find module `../../src/game/singleFamily`.

- [ ] **Step 3: Write minimal implementation**

Create `src/game/singleFamily.ts`:

```ts
import { NeighborhoodId } from './types';
import {
  EQUITY_BUDGET,
  AFFORDABLE_PRICE,
  SFH_TDC_PER_UNIT,
  SFH_MARKET_PRICE,
  sfhUnitTier,
} from '../data/singleFamily';

export interface SfhDeal {
  units: number;
  aroAffordableCount: number;
  marketUnits: number;
  tdcPerUnit: number;
  totalTDC: number;
  marketPricePerUnit: number;
  salesRevenue: number;
  loan: number;
  loanBinding: 'construction' | 'sales';
  equity: number;
  gap: number;
  profit: number;
  needsSubsidy: boolean;
  requiresZoning: boolean;
  aroTriggered: boolean;
}

export function aroAffordableCount(units: number): number {
  return units > 10 ? Math.floor(0.2 * units) : 0;
}

export function computeSfhDeal(neighborhood: NeighborhoodId, units: number): SfhDeal {
  const tier = sfhUnitTier(units);
  const tdcPerUnit = SFH_TDC_PER_UNIT[tier];
  const totalTDC = units * tdcPerUnit;

  const affordable = aroAffordableCount(units);
  const marketUnits = units - affordable;
  const marketPricePerUnit = SFH_MARKET_PRICE[neighborhood][tier];
  const salesRevenue = marketUnits * marketPricePerUnit + affordable * AFFORDABLE_PRICE;

  const constructionCap = 0.8 * totalTDC;
  const salesCap = 0.7 * salesRevenue;
  const loan = Math.min(constructionCap, salesCap);
  const loanBinding: 'construction' | 'sales' =
    constructionCap <= salesCap ? 'construction' : 'sales';

  const equity = Math.min(totalTDC - loan, EQUITY_BUDGET);
  const gap = Math.max(0, totalTDC - loan - EQUITY_BUDGET);
  const profit = salesRevenue - totalTDC;

  return {
    units,
    aroAffordableCount: affordable,
    marketUnits,
    tdcPerUnit,
    totalTDC,
    marketPricePerUnit,
    salesRevenue,
    loan,
    loanBinding,
    equity,
    gap,
    profit,
    needsSubsidy: totalTDC > salesRevenue,
    requiresZoning: units > 5,
    aroTriggered: units > 10,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/game/singleFamily.test.ts`
Expected: PASS (all assertions).

- [ ] **Step 5: Commit**

```bash
git add src/game/singleFamily.ts tests/game/singleFamily.test.ts
git commit -m "feat: computeSfhDeal single-family pro forma"
```

---

## Task 3: Store flag and actions

**Files:**
- Modify: `src/game/types.ts` (add `sfhOpen` to `GameState`)
- Modify: `src/game/state.ts` (initial value + actions)
- Test: `tests/game/sfhStore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/game/sfhStore.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/game/state';

describe('single-family modal store flag', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('defaults to closed', () => {
    expect(useGameStore.getState().sfhOpen).toBe(false);
  });

  it('openSfh opens, closeSfh closes', () => {
    useGameStore.getState().openSfh();
    expect(useGameStore.getState().sfhOpen).toBe(true);
    useGameStore.getState().closeSfh();
    expect(useGameStore.getState().sfhOpen).toBe(false);
  });

  it('reset() closes the modal', () => {
    useGameStore.getState().openSfh();
    useGameStore.getState().reset();
    expect(useGameStore.getState().sfhOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/game/sfhStore.test.ts`
Expected: FAIL — `sfhOpen` is undefined / `openSfh` is not a function.

- [ ] **Step 3a: Add `sfhOpen` to the `GameState` interface**

In `src/game/types.ts`, inside the `GameState` interface, add the field right after `costEscalation: number;` (near the top of the interface):

```ts
  costEscalation: number; // accrued dollars added to TDC

  sfhOpen: boolean; // single-family "give up" modal visibility
```

- [ ] **Step 3b: Add `sfhOpen` to `initialState`**

In `src/game/state.ts`, in the `initialState` object, add the field right after `costEscalation: 0,`:

```ts
  monthsElapsed: 0,
  costEscalation: 0,
  sfhOpen: false,
```

- [ ] **Step 3c: Declare the actions in `StoreActions`**

In `src/game/state.ts`, in the `interface StoreActions` block, add:

```ts
  openSfh: () => void;
  closeSfh: () => void;
```

- [ ] **Step 3d: Implement the actions**

In `src/game/state.ts`, inside the `create(...)` store body, add these next to the other actions (e.g. just after the `reset:` line):

```ts
  openSfh: () => set({ sfhOpen: true }),
  closeSfh: () => set({ sfhOpen: false }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/game/sfhStore.test.ts`
Expected: PASS. Also run `npx vitest run tests/game/state.test.ts` to confirm no regression.

- [ ] **Step 5: Commit**

```bash
git add src/game/types.ts src/game/state.ts tests/game/sfhStore.test.ts
git commit -m "feat: sfhOpen store flag with open/close actions"
```

---

## Task 4: Single-family dialogue lines

**Files:**
- Modify: `src/data/characters.ts` (add `sfhLines`)
- Test: `tests/data/characters.test.ts` (append a describe block)

- [ ] **Step 1: Write the failing test**

First, add `sfhLines` to the existing import at the top of `tests/data/characters.test.ts`:

```ts
import { carlosLines, frankLines, nailaLines, davidLines, characters, getNeighborhoodAlderId, sfhLines } from '../../src/data/characters';
```

Then append this block at the end of the file:

```ts
describe('single-family pivot lines', () => {
  it('has all required SFH dialogue slots', () => {
    for (const key of ['bankerRule', 'alderZoning', 'aroNote', 'dohNoSubsidy', 'permitFlavor'] as const) {
      expect(sfhLines[key], `sfhLines.${key}`).toBeTruthy();
    }
  });

  it('DOH dead-end line names the subsidy gap', () => {
    expect(sfhLines.dohNoSubsidy).toMatch(/public subsidy/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/data/characters.test.ts`
Expected: FAIL — `sfhLines` is undefined.

- [ ] **Step 3: Write minimal implementation**

In `src/data/characters.ts`, add this exported object (place it after `davidLines`):

```ts
export const sfhLines = {
  bankerRule:
    "Here's how I'll size this. My construction loan is the lesser of 80% of your total construction cost or 70% of your projected sales price. Whatever that doesn't cover, you fill with your own equity — and you've got $2 million to put in.",
  alderZoning: "This would require a zoning change. It's probably not worth it.",
  aroNote:
    "One more thing — above ten units the ARO kicks in. Twenty percent of your homes have to be sold affordable, at 80% AMI.",
  dohNoSubsidy:
    "Your construction costs are higher than the anticipated sales price. You need public subsidy, but DOH doesn't have an open application for that right now.",
  permitFlavor:
    "The affordable homes you set out to build? Those are someone else's project now.",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/data/characters.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/characters.ts tests/data/characters.test.ts
git commit -m "feat: single-family pivot dialogue lines"
```

---

## Task 5: SingleFamilyModal component

**Files:**
- Create: `src/components/SingleFamilyModal.tsx`
- Test: `tests/components/SingleFamilyModal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/components/SingleFamilyModal.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SingleFamilyModal } from '../../src/components/SingleFamilyModal';
import { useGameStore } from '../../src/game/state';

function openWith(neighborhood: 'jefferson-park' | 'englewood' | 'albany-park' | 'pilsen') {
  useGameStore.getState().reset();
  useGameStore.getState().selectNeighborhood(neighborhood);
  useGameStore.getState().openSfh();
}

describe('SingleFamilyModal', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('renders nothing when closed', () => {
    useGameStore.getState().selectNeighborhood('jefferson-park');
    const { container } = render(<SingleFamilyModal />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the banker loan rule when open', () => {
    openWith('jefferson-park');
    render(<SingleFamilyModal />);
    expect(screen.getByText(/lesser of 80%/i)).toBeInTheDocument();
  });

  it('shows the zoning warning above 5 units', () => {
    openWith('jefferson-park');
    render(<SingleFamilyModal />);
    fireEvent.change(screen.getByLabelText(/number of homes/i), { target: { value: '6' } });
    expect(screen.getByText(/would require a zoning change/i)).toBeInTheDocument();
  });

  it('shows the ARO note above 10 units', () => {
    openWith('jefferson-park');
    render(<SingleFamilyModal />);
    fireEvent.change(screen.getByLabelText(/number of homes/i), { target: { value: '11' } });
    expect(screen.getByText(/ARO kicks in/i)).toBeInTheDocument();
  });

  it('Englewood shows the DOH dead-end and disables the permit button', () => {
    openWith('englewood');
    render(<SingleFamilyModal />);
    expect(screen.getByText(/higher than the anticipated sales price/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply for permits/i })).toBeDisabled();
  });

  it('Jefferson Park buildable deal grants the permit and shows profit', () => {
    openWith('jefferson-park');
    render(<SingleFamilyModal />);
    fireEvent.click(screen.getByRole('button', { name: /apply for permits/i }));
    expect(screen.getByText(/Permit granted/i)).toBeInTheDocument();
    expect(screen.getByText(/120 days/i)).toBeInTheDocument();
    expect(screen.getByText(/\$0\.80M/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/SingleFamilyModal.test.tsx`
Expected: FAIL — cannot find module `../../src/components/SingleFamilyModal`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/SingleFamilyModal.tsx`:

```tsx
import { useState } from 'react';
import { useGameStore } from '../game/state';
import { getNeighborhood } from '../data/neighborhoods';
import { getNeighborhoodAlderId, sfhLines } from '../data/characters';
import { CharacterBubble } from './CharacterBubble';
import { computeSfhDeal, SfhDeal } from '../game/singleFamily';
import {
  SFH_MIN_UNITS,
  SFH_MAX_UNITS,
  PERMIT_DAYS,
} from '../data/singleFamily';

function fmtM(n: number): string {
  return `$${(n / 1_000_000).toFixed(2)}M`;
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      {children}
    </div>
  );
}

function SfhStack({ deal }: { deal: SfhDeal }) {
  const segs: { label: string; amount: number; color: string }[] = [
    { label: 'Construction loan', amount: deal.loan, color: 'bg-debt' },
    { label: 'Your equity', amount: deal.equity, color: 'bg-equity' },
  ];
  if (deal.gap > 0) segs.push({ label: 'GAP', amount: deal.gap, color: 'bg-gap' });
  const total = deal.totalTDC;

  return (
    <div>
      <div className="flex h-7 rounded-sm overflow-hidden text-[11px] text-white font-bold">
        {segs.map((s, i) => {
          const pct = total > 0 ? (s.amount / total) * 100 : 0;
          if (pct < 0.5) return null;
          return (
            <div
              key={i}
              className={`${s.color} flex items-center justify-center px-1`}
              style={{ flexBasis: `${pct}%` }}
              title={`${s.label}: ${fmtM(s.amount)}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {segs.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span className={`${s.color} inline-block w-2.5 h-2.5 rounded-[2px]`} />
            <span className="text-muted">{s.label}</span>
            <span className="tabular text-ink">{fmtM(s.amount)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SingleFamilyModal() {
  const sfhOpen = useGameStore((s) => s.sfhOpen);
  const closeSfh = useGameStore((s) => s.closeSfh);
  const reset = useGameStore((s) => s.reset);
  const neighborhood = useGameStore((s) => s.project.neighborhood);

  const [units, setUnits] = useState(1);
  const [view, setView] = useState<'form' | 'permit'>('form');

  if (!sfhOpen || !neighborhood) return null;

  const n = getNeighborhood(neighborhood);
  const deal = computeSfhDeal(neighborhood, units);
  const alderId = getNeighborhoodAlderId(neighborhood);

  function handleClose() {
    setUnits(1);
    setView('form');
    closeSfh();
  }

  function handleReset() {
    setUnits(1);
    setView('form');
    reset();
  }

  if (view === 'permit') {
    return (
      <Overlay>
        <div className="card p-6 max-w-md w-full text-center">
          <div className="text-4xl">🏚️</div>
          <h2 className="text-2xl mt-2 mb-1">Permit granted.</h2>
          <p className="text-muted">
            You closed and got your permit in <b>{PERMIT_DAYS} days</b>. You built{' '}
            <b>{deal.units}</b> single-family home{deal.units > 1 ? 's' : ''} in {n.name} and
            walked away with <b className="text-equity">{fmtM(deal.profit)}</b>.
          </p>
          <p className="text-xs italic text-muted mt-3">{sfhLines.permitFlavor}</p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={handleReset} className="btn-primary py-3">
              ↻ Try a different choice
            </button>
            <button onClick={handleClose} className="btn-secondary py-3">
              Close
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay>
      <div className="card p-6 max-w-lg w-full">
        <div className="flex justify-between items-baseline mb-3">
          <h2 className="text-xl font-bold">Give up — build single-family homes</h2>
          <button onClick={handleClose} className="text-muted hover:text-ink text-sm" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mb-3">
          <CharacterBubble characterId="marcus" line={sfhLines.bankerRule} />
        </div>

        <div className="card p-3 mb-3">
          <label htmlFor="sfh-units" className="text-xs uppercase tracking-wider text-accent font-bold">
            Number of homes
          </label>
          <div className="text-xs text-muted mt-1">
            {n.name} · <b>{units}</b> home{units > 1 ? 's' : ''}
          </div>
          <input
            id="sfh-units"
            aria-label="Number of homes"
            type="range"
            min={SFH_MIN_UNITS}
            max={SFH_MAX_UNITS}
            value={units}
            onChange={(e) => setUnits(parseInt(e.target.value))}
            className="w-full mt-2"
          />
          <div className="flex justify-between text-xs text-muted tabular">
            <span>{SFH_MIN_UNITS}</span>
            <span>{SFH_MAX_UNITS}</span>
          </div>
        </div>

        {deal.requiresZoning && (
          <div className="mb-3">
            <CharacterBubble characterId={alderId} line={sfhLines.alderZoning} />
          </div>
        )}

        {deal.aroTriggered && (
          <div className="mb-3">
            <CharacterBubble characterId="david" line={sfhLines.aroNote} />
          </div>
        )}

        <div className="card p-3 mb-3 text-sm tabular space-y-1">
          <Row label="Total development cost" value={fmtM(deal.totalTDC)} />
          <Row label="Projected sales" value={fmtM(deal.salesRevenue)} />
          <Row
            label={`Construction loan (${deal.loanBinding === 'construction' ? '80% of cost' : '70% of sales'})`}
            value={fmtM(deal.loan)}
          />
          <Row label="Your equity" value={fmtM(deal.equity)} />
          <div className="border-t border-line pt-1 mt-1 flex justify-between">
            <span className="font-bold">Profit</span>
            <b className={deal.profit >= 0 ? 'text-equity' : 'text-gap'}>{fmtM(deal.profit)}</b>
          </div>
        </div>

        <div className="card p-3 mb-3">
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">Capital stack</div>
          <SfhStack deal={deal} />
        </div>

        {deal.needsSubsidy && (
          <div className="mb-3">
            <CharacterBubble characterId="david" line={sfhLines.dohNoSubsidy} />
          </div>
        )}

        <button
          onClick={() => setView('permit')}
          disabled={deal.needsSubsidy}
          className="w-full btn-primary py-3 disabled:opacity-40"
        >
          Apply for permits →
        </button>
      </div>
    </Overlay>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/SingleFamilyModal.test.tsx`
Expected: PASS (all six tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/SingleFamilyModal.tsx tests/components/SingleFamilyModal.test.tsx
git commit -m "feat: SingleFamilyModal popup (build form, DOH dead-end, permit page)"
```

---

## Task 6: Wire the modal into the app and add entry buttons

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/screens/SiteAndConcept.tsx`
- Modify: `src/screens/CapitalStack.tsx`
- Modify: `src/screens/GapResolution.tsx`
- Test: `tests/components/sfhEntryButtons.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/components/sfhEntryButtons.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SiteAndConcept } from '../../src/screens/SiteAndConcept';
import { GapResolution } from '../../src/screens/GapResolution';
import { useGameStore } from '../../src/game/state';

describe('single-family entry buttons', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('Site & Concept button is disabled until a neighborhood is chosen', () => {
    render(<SiteAndConcept />);
    const btn = screen.getByRole('button', { name: /give up and build single-family/i });
    expect(btn).toBeDisabled();
  });

  it('Site & Concept button opens the modal once a neighborhood is chosen', () => {
    useGameStore.getState().selectNeighborhood('jefferson-park');
    render(<SiteAndConcept />);
    fireEvent.click(screen.getByRole('button', { name: /give up and build single-family/i }));
    expect(useGameStore.getState().sfhOpen).toBe(true);
  });

  it('Gap Resolution exposes the give-up button', () => {
    useGameStore.getState().selectNeighborhood('englewood');
    render(<GapResolution />);
    fireEvent.click(screen.getByRole('button', { name: /give up and build single-family/i }));
    expect(useGameStore.getState().sfhOpen).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/sfhEntryButtons.test.tsx`
Expected: FAIL — no button matching `/give up and build single-family/i`.

- [ ] **Step 3a: Render the modal globally in `App.tsx`**

In `src/App.tsx`, add the import alongside the others:

```tsx
import { SingleFamilyModal } from './components/SingleFamilyModal';
```

Then add the modal next to `<RecapCard />` at the bottom of the returned JSX:

```tsx
      <RecapCard />
      <SingleFamilyModal />
    </div>
```

- [ ] **Step 3b: Add the entry button to `SiteAndConcept.tsx`**

In `src/screens/SiteAndConcept.tsx`, add the action selector near the other store selectors (e.g. after `const advancePhase = ...`):

```tsx
  const openSfh = useGameStore((s) => s.openSfh);
```

Then, immediately after the existing `Lock in &amp; continue →` button (the `</button>` that closes it), add:

```tsx
          <button
            onClick={openSfh}
            disabled={!project.neighborhood}
            className="w-full mt-2 btn-secondary py-2 disabled:opacity-40"
          >
            🏚️ Give up and build single-family homes
          </button>
```

- [ ] **Step 3c: Add the entry button to `CapitalStack.tsx`**

In `src/screens/CapitalStack.tsx`, add the selector near the other action selectors (e.g. after `const advancePhase = useGameStore((s) => s.advancePhase);`):

```tsx
  const openSfh = useGameStore((s) => s.openSfh);
```

Then, in the main `return` (the non-revise branch), add the button immediately after the closing `</button>` of the final advance button (`{canAdvance ? 'Stack closed...' : ...}`):

```tsx
      <button
        onClick={openSfh}
        className="w-full mt-2 btn-secondary py-2"
      >
        🏚️ Give up and build single-family homes
      </button>
```

- [ ] **Step 3d: Add the entry button to `GapResolution.tsx`**

Replace the body of `src/screens/GapResolution.tsx` with the version below (adds the `openSfh` selector and a button under the `GapCloseModal`):

```tsx
import { useGameStore } from '../game/state';
import { Header } from '../components/Header';
import { JargonScreenScope } from '../components/JargonScreenScope';
import { GapCloseModal } from '../components/GapCloseModal';

export function GapResolution() {
  const advancePhase = useGameStore((s) => s.advancePhase);
  const retreatPhase = useGameStore((s) => s.retreatPhase);
  const neighborhood = useGameStore((s) => s.project.neighborhood);
  const openSfh = useGameStore((s) => s.openSfh);

  if (!neighborhood) return null;

  return (
    <JargonScreenScope>
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={retreatPhase}
        className="text-muted text-sm mb-4 hover:text-ink inline-block"
      >
        ← Back
      </button>
      <Header />
      <h2 className="text-3xl mt-6 mb-2">Close the Gap</h2>
      <GapCloseModal context="phase-5" onClose={advancePhase} />
      <button
        onClick={openSfh}
        className="w-full mt-3 btn-secondary py-2"
      >
        🏚️ Give up and build single-family homes
      </button>
    </div>
    </JargonScreenScope>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/components/sfhEntryButtons.test.tsx`
Expected: PASS (all three).

Also run the existing screen tests to confirm no regression:
Run: `npx vitest run tests/components/SiteAndConcept.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/screens/SiteAndConcept.tsx src/screens/CapitalStack.tsx src/screens/GapResolution.tsx tests/components/sfhEntryButtons.test.tsx
git commit -m "feat: wire SingleFamilyModal + give-up entry buttons on 3 screens"
```

---

## Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the entire test suite**

Run: `npm test`
Expected: PASS — all prior tests (289) plus the new single-family tests, no failures.

- [ ] **Step 2: Type-check and build**

Run: `npm run build`
Expected: `tsc -b` reports no type errors and `vite build` completes successfully.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors. (If lint flags an unused import or `any`, fix it and re-run.)

- [ ] **Step 4: Manual smoke check (optional but recommended)**

Run: `npm run dev`, open the app, pick Jefferson Park, click "🏚️ Give up and build single-family homes," drag to 1 home (expect ~$0.80M profit, Apply enabled), drag to 6 (zoning warning), 11 (ARO note). Pick Englewood and confirm the DOH dead-end disables Apply. Click Apply on a buildable deal and confirm the 120-day permit page with profit and "Try a different choice."

- [ ] **Step 5: Final commit (if any lint/type fixes were made)**

```bash
git add -A
git commit -m "chore: single-family pivot — lint/type cleanup"
```

---

## Self-review notes

- **Spec coverage:** entry points on 3 screens (Task 6), neighborhood-gated button (Task 6 / SiteAndConcept disabled state), 1–15 picker (Task 5), TDC tiers + sales matrix (Task 1), banker loan rule = min(80% cost, 70% sales) + $2M equity (Tasks 2, 4, 5), zoning warning >5 (Tasks 2/5), ARO 20%@80% AMI with floor rounding >10 (Tasks 1/2), capital stack + gap + profit display (Task 5), DOH dead-end when TDC>sales (Tasks 2/5), permit page with 120 days + profit (Task 5), reset path (Task 5). All covered.
- **Type consistency:** `SfhDeal` field names used in the modal (`totalTDC`, `salesRevenue`, `loan`, `loanBinding`, `equity`, `gap`, `profit`, `needsSubsidy`, `requiresZoning`, `aroTriggered`, `marketUnits`, `aroAffordableCount`) match the interface in Task 2. `sfhLines` keys (`bankerRule`, `alderZoning`, `aroNote`, `dohNoSubsidy`, `permitFlavor`) match Tasks 4 and 5. Store members (`sfhOpen`, `openSfh`, `closeSfh`) match Task 3.
- **No placeholders:** every code step contains complete code; every test step contains real assertions.
