import { formatElapsed } from '../util/formatElapsed';

interface TimelinePillProps {
  months: number;
}

export function TimelinePill({ months }: TimelinePillProps) {
  return (
    <span className="inline-flex items-center gap-1 bg-bg border border-line rounded-full px-2 py-0.5 text-xs tabular">
      📅 <b className="text-ink">{formatElapsed(months)}</b>
    </span>
  );
}
