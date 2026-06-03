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

export function StackBar({ tdc, awarded, bankLoan = 0 }: StackBarProps) {
  const totalAwarded = awarded.reduce((s, a) => s + a.amount, 0) + bankLoan;
  const gap = Math.max(0, tdc - totalAwarded);

  const items: { label: string; amount: number; color: string }[] = [
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
    items.push({ label: 'GAP', amount: gap, color: 'bg-gap' });
  }

  return (
    <div className="flex h-6 rounded overflow-hidden text-xs text-white font-bold">
      {items.map((it, i) => {
        const pct = (it.amount / tdc) * 100;
        if (pct < 0.5) return null;
        return (
          <div
            key={i}
            className={`${it.color} flex items-center justify-center px-1`}
            style={{ flexBasis: `${pct}%` }}
            title={`${it.label}: $${(it.amount / 1_000_000).toFixed(1)}M`}
          >
            {pct >= 8 && (it.label === 'GAP' ? 'GAP' : '')}
          </div>
        );
      })}
    </div>
  );
}
