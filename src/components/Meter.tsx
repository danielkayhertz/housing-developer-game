interface MeterProps {
  label: string;
  value: number;
  color?: string;
  caption?: string;
  threshold?: number;
}

export function Meter({ label, value, color = 'bg-equity', caption, threshold }: MeterProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="card p-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xs uppercase tracking-wider text-accent">{label}</div>
        <div className="tabular text-sm font-bold leading-none">
          {Math.round(value)}
          <span className="text-muted font-normal">/100</span>
        </div>
      </div>

      <div className="relative mt-2 h-2 bg-line rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
        {threshold != null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-ink/70"
            style={{ left: `${threshold}%` }}
            title={`Passing threshold: ${threshold}`}
          />
        )}
      </div>

      {threshold != null && (
        <div className="mt-1 text-[10px] text-muted tabular">pass ≥ {threshold}</div>
      )}
      {caption && <div className="mt-2 text-xs text-muted">{caption}</div>}
    </div>
  );
}
