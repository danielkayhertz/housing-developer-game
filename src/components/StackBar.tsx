import { SourceAward } from '../game/types';
import { getSource } from '../data/sources';

interface StackBarProps {
  tdc: number;
  awarded: SourceAward[];
  bankLoan?: number;
}

const SOURCE_COLORS: Record<string, string> = {
  '9-lihtc': 'bg-equity',
  '4-lihtc-bonds': 'bg-equity',
  'doh-loan': 'bg-accent',
  'ihda-loan': 'bg-accent',
  'tif': 'bg-caution',
  'hed-bond': 'bg-caution',
  'cdbg': 'bg-debt',
  'home': 'bg-debt',
  'iahtc': 'bg-debt',
  'philanthropy': 'bg-debt',
  'bank-loan': 'bg-debt',
  'deferred-dev-fee': 'bg-muted',
};

// Diagonal hatch overlay so an unfunded gap reads as an alarming hole, not just a color.
const GAP_HATCH =
  'repeating-linear-gradient(45deg, transparent 0, transparent 5px, rgba(0,0,0,0.22) 5px, rgba(0,0,0,0.22) 10px)';

function fmt(amount: number): string {
  return `$${(amount / 1_000_000).toFixed(1)}M`;
}

export function StackBar({ tdc, awarded, bankLoan = 0 }: StackBarProps) {
  const totalAwarded = awarded.reduce((s, a) => s + a.amount, 0) + bankLoan;
  const gap = Math.max(0, tdc - totalAwarded);

  const items: { label: string; amount: number; color: string; isGap?: boolean }[] = [
    ...awarded.map((a) => ({
      label: getSource(a.sourceId).name,
      amount: a.amount,
      color: SOURCE_COLORS[a.sourceId] ?? 'bg-muted',
    })),
  ];
  if (bankLoan > 0) {
    items.push({ label: 'Bank loan', amount: bankLoan, color: 'bg-debt' });
  }
  if (gap > 0) {
    items.push({ label: 'GAP', amount: gap, color: 'bg-gap', isGap: true });
  }

  return (
    <div>
      <div className="flex h-7 rounded-sm overflow-hidden text-[11px] text-white font-bold border-b-2 border-ink/15">
        {items.map((it, i) => {
          const pct = (it.amount / tdc) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={i}
              className={`stack-seg ${it.color} flex items-center justify-center px-1`}
              style={{ flexBasis: `${pct}%`, backgroundImage: it.isGap ? GAP_HATCH : undefined }}
              title={`${it.label}: ${fmt(it.amount)}`}
            >
              {it.isGap && pct >= 8 && 'GAP'}
            </div>
          );
        })}
      </div>

      {/* Legend — readable without hovering; amounts in mono ledger type */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {items.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span
              className={`${it.color} inline-block w-2.5 h-2.5 rounded-[2px]`}
              style={{ backgroundImage: it.isGap ? GAP_HATCH : undefined }}
            />
            <span className={it.isGap ? 'text-gap font-bold' : 'text-muted'}>{it.label}</span>
            <span className="tabular text-ink">{fmt(it.amount)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
