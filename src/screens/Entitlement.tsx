import { useGameStore } from '../game/state';
import { resolveEntitlementPath } from '../game/entitlement';
import { getNeighborhood } from '../data/neighborhoods';
import { Header } from '../components/Header';
import { Meter } from '../components/Meter';
import { ChoiceCard } from '../components/ChoiceCard';
import { CharacterBubble } from '../components/CharacterBubble';
import { ashaLines, financeAttackLines } from '../data/characters';
import { StepChoiceKey } from '../game/types';

const STEP_NAMES = ['', 'Pre-app intake', 'Community meeting', 'Committee on Zoning', 'Committee on Finance'];

const STEP_CHOICES: Record<number, { key: StepChoiceKey; title: string; description: string; consequences: string }[]> = {
  1: [
    { key: 'preapp-quiet', title: 'Quiet alder meeting', description: 'Just you and Asha. Low-key, no public attention yet.', consequences: '+2 alder · ±0 community' },
    { key: 'preapp-formal-cbo', title: 'Formal w/ CBO partner', description: 'Bring a community development partner to the first conversation.', consequences: '+5 alder · +6 community' },
    { key: 'preapp-public', title: 'Public pre-launch w/ press', description: 'Announce intentions broadly. Bold; reads as committed.', consequences: '−3 alder · +4 community' },
  ],
  2: [
    { key: 'community-data', title: 'Data-led', description: 'Lead with rent, jobs, taxes. Facts, charts, evidence.', consequences: '+3 alder · +4 community' },
    { key: 'community-story', title: 'Story-led', description: 'Resident testimonials. Make it about people, not numbers.', consequences: '−2 alder · +12 community' },
    { key: 'community-coalition', title: 'Coalition-led', description: 'Clergy, CBO, advocates speak first. Show breadth of support.', consequences: '+4 alder · +10 community' },
  ],
  3: [
    { key: 'zoning-hold', title: 'Hold the line', description: 'Keep current size. Make the case at Committee.', consequences: '−14 alder · −4 community · vote risk' },
    { key: 'zoning-shrink', title: 'Shrink the project (−12 units)', description: 'Concede unit count. Defuse NIMBY testimony.', consequences: '−6 alder · +15 community · TDC ↓ · impact ↓' },
    { key: 'zoning-accept', title: 'Accept conditions', description: "Take Committee's height cap & unit-mix conditions.", consequences: '−8 alder · ±0 community · TDC +$1.4M' },
  ],
  4: [
    { key: 'finance-reframe', title: 'Reframe the cost', description: 'Make the per-unit-of-impact case. Make Powell own his comparison.', consequences: '−2 alder · ±0 community' },
    { key: 'finance-concede', title: 'Concede TIF/HED reduction', description: 'Reduce ask to defuse Reyes. Reopens gap.', consequences: '+5 alder · gap reopens' },
    { key: 'finance-stakeholders', title: 'Bring stakeholders', description: 'Coalition testimony. Powerful but spends community support.', consequences: '±0 alder · −15 community' },
  ],
};

export function Entitlement() {
  const project = useGameStore((s) => s.project);
  const stack = useGameStore((s) => s.stack);
  const entitlement = useGameStore((s) => s.entitlement);
  const takeStep = useGameStore((s) => s.takeEntitlementStep);
  const tickMonths = useGameStore((s) => s.tickMonths);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const setOutcome = useGameStore((s) => s.setOutcome);

  if (!project.neighborhood) return null;
  const n = getNeighborhood(project.neighborhood);
  const path = resolveEntitlementPath({ buildingType: project.buildingType, units: project.units });

  const currentStep = entitlement.currentStep;
  const allStepsComplete = entitlement.pastChoices.length >= 4;

  function onChoose(choice: StepChoiceKey) {
    takeStep(choice);
    tickMonths(12);
  }

  function onComplete() {
    if (entitlement.alderGoodwill < 20) {
      setOutcome('shelved-alder');
    } else if (entitlement.communitySupport < 25) {
      setOutcome('shelved-community');
    } else {
      setOutcome('closed');
    }
    advancePhase();
  }

  const hasTif = stack.awarded.some((a) => a.sourceId === 'tif');
  const hasHedBond = stack.awarded.some((a) => a.sourceId === 'hed-bond');

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Header />
      <h2 className="text-2xl mt-6 mb-4">Entitlement</h2>

      {/* Path */}
      <div className="bg-panel border border-line rounded-lg p-3 mb-3 text-xs">
        <b>Path:</b> {path === 'pd' ? 'Planned Development' : 'Zoning Map Amendment'} ·{' '}
        Pre-app → Community → Committee on Zoning → Committee on Finance → Council (narrative)
      </div>

      {/* Meters */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Meter
          label={`🧑‍💼 Ald. ${n.alderName}'s goodwill`}
          value={entitlement.alderGoodwill}
          color="bg-equity"
        />
        <Meter
          label="👥 Community support"
          value={entitlement.communitySupport}
          color={entitlement.communitySupport >= 50 ? 'bg-equity' : 'bg-caution'}
        />
      </div>

      {/* Past steps */}
      {entitlement.pastChoices.length > 0 && (
        <div className="bg-panel border border-line rounded-lg p-3 mb-3">
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">Steps taken</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {entitlement.pastChoices.map((c, i) => (
              <div key={i} className="bg-bg p-2 rounded">
                <b>{i + 1}. {STEP_NAMES[c.step]}</b><br/>
                <span className="text-muted">{c.choice}</span><br/>
                <span className="text-equity">α{c.alderDelta >= 0 ? '+' : ''}{c.alderDelta} · c{c.communityDelta >= 0 ? '+' : ''}{c.communityDelta}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active step */}
      {!allStepsComplete && (
        <div className="bg-bg border-2 border-caution rounded-lg p-4 mb-3">
          <div className="text-xs uppercase tracking-wider text-caution font-bold">
            ▶ Step {currentStep} — {STEP_NAMES[currentStep]}
          </div>

          {/* Finance committee — show attacks */}
          {currentStep === 4 && (
            <div className="grid grid-cols-3 gap-2 my-3">
              <div className="bg-panel border-l-2 border-gap p-2 text-xs">
                <b>Ald. Powell:</b> "{financeAttackLines.tooExpensive(800_000)}"
              </div>
              {hasTif && (
                <div className="bg-panel border-l-2 border-gap p-2 text-xs">
                  <b>Ald. Reyes:</b> "{financeAttackLines.tifCorrupt}"
                </div>
              )}
              {hasHedBond && (
                <div className="bg-panel border-l-2 border-gap p-2 text-xs">
                  <b>Ald. Chen:</b> "{financeAttackLines.hedWardJealousy}"
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-3">
            {STEP_CHOICES[currentStep].map((c) => (
              <ChoiceCard
                key={c.key}
                title={c.title}
                description={c.description}
                consequences={c.consequences}
                onClick={() => onChoose(c.key)}
              />
            ))}
          </div>

          <div className="mt-3">
            <CharacterBubble
              characterId="asha"
              line={
                currentStep === 1 ? 'Ready when you are. How do you want to start this?' :
                currentStep === 2 ? "The room will be skeptical. How are we going to lead this meeting?" :
                currentStep === 3 ? "Block club has been organizing. They'll be there. Pick your stance." :
                currentStep === 4 ? ashaLines.financeReframe :
                ''
              }
              whisper={currentStep === 4}
            />
          </div>
        </div>
      )}

      {allStepsComplete && (
        <div className="bg-bg p-4 rounded-lg text-sm">
          <b>Council vote (narrative):</b><br/>
          <i className="text-muted">On a Wednesday in March, the City Council passed the ordinance 41–9. Asha posted on Instagram from the floor.</i>
          <button
            onClick={onComplete}
            className="block w-full mt-4 bg-accent text-white py-3 rounded-lg font-bold"
          >
            See your result →
          </button>
        </div>
      )}
    </div>
  );
}
