interface MeterProps {
  label: string;
  value: number;
  color?: string;
  caption?: string;
}

export function Meter({ label, value, color = 'bg-equity', caption }: MeterProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="bg-panel border border-line rounded-lg p-3">
      <div className="text-xs uppercase tracking-wider text-accent">{label}</div>
      <div className="mt-2 bg-line h-2.5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted mt-1">
        <span>0</span>
        <span className="font-bold">{Math.round(value)} / 100</span>
        <span>100</span>
      </div>
      {caption && <div className="mt-2 text-xs text-muted">{caption}</div>}
    </div>
  );
}
