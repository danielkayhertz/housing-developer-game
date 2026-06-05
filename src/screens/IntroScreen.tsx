import { useGameStore } from '../game/state';
import { JargonScreenScope } from '../components/JargonScreenScope';

export function IntroScreen() {
  const advancePhase = useGameStore((s) => s.advancePhase);

  return (
    <JargonScreenScope>
    <div className="max-w-2xl mx-auto pt-16 pb-8">
      <p className="text-xs uppercase tracking-widest text-accent font-bold mb-2">A civic finance game</p>
      <h1 className="text-4xl mb-4">Welcome, developer.</h1>
      <p className="text-lg text-muted mb-6">
        You're going to build one affordable housing project in Chicago — from a vacant site,
        through the pro forma, the capital stack, the alder and the community, all the way
        to financial close.
      </p>
      <p className="text-base text-muted mb-8">
        Real projects take 2–4 years. This one will take you about 15 minutes. The numbers
        and the process steps are grounded in actual Chicago deals from 2023. The puzzle
        is real.
      </p>
      <button
        onClick={advancePhase}
        className="bg-accent text-white px-6 py-3 rounded-lg font-bold hover:opacity-90"
      >
        Start a project →
      </button>
    </div>
    </JargonScreenScope>
  );
}
