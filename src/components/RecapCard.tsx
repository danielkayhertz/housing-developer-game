import { useGameStore } from '../game/state';
import { formatElapsed } from '../util/formatElapsed';
import { characters } from '../data/characters';

export function RecapCard() {
  const lastRecap = useGameStore((s) => s.lastRecap);
  const clearRecap = useGameStore((s) => s.clearRecap);

  if (!lastRecap) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card p-6 max-w-sm w-full mx-4">
        <div className="text-xs uppercase tracking-wider text-accent font-bold mb-3">What just happened</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Time added</span>
            <b className="text-caution tabular">+{formatElapsed(lastRecap.months)}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Cost escalation accrued</span>
            <b className="text-gap tabular">+${(lastRecap.escalationAdded / 1_000_000).toFixed(2)}M</b>
          </div>
        </div>
        {lastRecap.narrative && (
          <div className="mt-3 border-t border-line pt-3 text-xs">
            <b>
              {characters[lastRecap.narrative.characterId as keyof typeof characters].emoji}
              {' '}
              {characters[lastRecap.narrative.characterId as keyof typeof characters].name}:
            </b>{' '}
            <i className="text-muted">{lastRecap.narrative.line}</i>
          </div>
        )}
        <button
          onClick={clearRecap}
          className="w-full mt-4 btn-primary py-2"
        >
          Got it →
        </button>
      </div>
    </div>
  );
}
