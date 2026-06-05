import { useGameStore } from '../game/state';
import { computeEffectiveGap } from '../game/gapResolution';

export function LiveGapRow() {
  const state = useGameStore((s) => s);
  if (!state.project.neighborhood) return null;
  const result = computeEffectiveGap(state);

  return (
    <div className="bg-bg p-3 rounded-lg text-sm tabular grid grid-cols-3 gap-2">
      <div>
        <div className="text-xs text-muted uppercase tracking-wider">TDC</div>
        <b>${(result.tdcAllIn / 1_000_000).toFixed(1)}M</b>
      </div>
      <div>
        <div className="text-xs text-muted uppercase tracking-wider">Committed</div>
        <b>${(result.committed / 1_000_000).toFixed(1)}M</b>
        <div className="text-[10px] text-muted">incl. ${(result.bankLoan / 1_000_000).toFixed(1)}M debt</div>
      </div>
      <div>
        <div className="text-xs text-muted uppercase tracking-wider">Gap</div>
        <b className={result.gap > 100_000 ? 'text-gap' : 'text-equity'}>
          ${(result.gap / 1_000_000).toFixed(1)}M
        </b>
      </div>
    </div>
  );
}
