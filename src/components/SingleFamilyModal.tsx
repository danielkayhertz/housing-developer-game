import { useState, type ReactNode } from 'react';
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

function Overlay({ children }: { children: ReactNode }) {
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
