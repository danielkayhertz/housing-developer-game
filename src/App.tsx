import { useGameStore } from './game/state';
import { IntroScreen } from './screens/IntroScreen';
import { SiteAndConcept } from './screens/SiteAndConcept';
import { ProForma } from './screens/ProForma';
import { CapitalStack } from './screens/CapitalStack';
import { GapResolution } from './screens/GapResolution';
import { Entitlement } from './screens/Entitlement';
import { Close } from './screens/Close';

export default function App() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div className="min-h-screen bg-bg text-ink">
      {phase === 1 && <IntroScreen />}
      {phase === 2 && <SiteAndConcept />}
      {phase === 3 && <ProForma />}
      {phase === 4 && <CapitalStack />}
      {phase === 5 && <GapResolution />}
      {phase === 6 && <Entitlement />}
      {phase === 7 && <Close />}
    </div>
  );
}
