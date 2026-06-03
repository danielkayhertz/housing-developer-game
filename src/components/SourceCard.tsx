import { SourceProfile } from '../game/types';

type Status = 'available' | 'applied' | 'awarded' | 'locked' | 'secured';

interface SourceCardProps {
  source: SourceProfile;
  status: Status;
  awardedAmount?: number;
  complexityWarning?: boolean;
  onApply?: () => void;
}

const STATUS_STYLES: Record<Status, { badgeClass: string; cardClass: string; label: string }> = {
  available: { badgeClass: 'bg-caution', cardClass: 'border-line', label: 'AVAILABLE' },
  applied:   { badgeClass: 'bg-debt',    cardClass: 'border-debt', label: 'APPLIED' },
  awarded:   { badgeClass: 'bg-equity',  cardClass: 'border-equity', label: 'AWARDED' },
  locked:    { badgeClass: 'bg-muted',   cardClass: 'border-line opacity-50', label: 'LOCKED' },
  secured:   { badgeClass: 'bg-debt',    cardClass: 'border-debt', label: 'SECURED' },
};

export function SourceCard({ source, status, awardedAmount, complexityWarning, onApply }: SourceCardProps) {
  const s = STATUS_STYLES[status];
  return (
    <div className={`bg-panel border-2 ${s.cardClass} rounded-lg p-2 text-xs relative`}>
      <div className={`absolute top-1 right-1 ${s.badgeClass} text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold`}>
        {s.label}
      </div>
      <div className="text-base">{source.emoji} <b>{source.name}</b></div>
      <div className="text-muted text-[11px]">{source.shortDescription}</div>
      <div className="mt-2">
        {awardedAmount !== undefined ? (
          <b className="tabular">${(awardedAmount / 1_000_000).toFixed(1)}M</b>
        ) : source.amountRange ? (
          <span>
            <b className="tabular">${(source.amountRange.min / 1_000_000).toFixed(1)}-{(source.amountRange.max / 1_000_000).toFixed(1)}M</b>
          </span>
        ) : null}
        {' '}· {source.daysToProcess} d
      </div>
      {complexityWarning && (
        <div className="mt-1 text-caution text-[11px]">⚠ +complexity penalty</div>
      )}
      {status === 'available' && onApply && (
        <button
          className="w-full mt-1 bg-accent text-white text-[11px] py-1 rounded hover:opacity-90"
          onClick={onApply}
        >
          Apply →
        </button>
      )}
    </div>
  );
}
