import { useGameStore } from '../game/state';
import { Header } from '../components/Header';
import { JargonScreenScope } from '../components/JargonScreenScope';
import { GapCloseModal } from '../components/GapCloseModal';

export function GapResolution() {
  const advancePhase = useGameStore((s) => s.advancePhase);
  const retreatPhase = useGameStore((s) => s.retreatPhase);
  const neighborhood = useGameStore((s) => s.project.neighborhood);

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
    </div>
    </JargonScreenScope>
  );
}
