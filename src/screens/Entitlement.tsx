import React from 'react';
import { useGameStore } from '../game/state';
import { resolveEntitlementPath, EntitlementPath } from '../game/entitlement';
import { computeEffectiveGap } from '../game/gapResolution';
import { getNeighborhood } from '../data/neighborhoods';
import { Header } from '../components/Header';
import { Meter } from '../components/Meter';
import { JargonScreenScope } from '../components/JargonScreenScope';
import { TooltipTerm } from '../components/TooltipTerm';
import { ChoiceCard } from '../components/ChoiceCard';
import { CharacterBubble } from '../components/CharacterBubble';
import { GapCloseModal } from '../components/GapCloseModal';
import { ashaLines, financeAttackLines } from '../data/characters';
import {
  StepChoiceKey,
  HARD_COST_PER_UNIT,
  FINISH_MULTIPLIER,
  SOFT_COST_RATIO,
  CONTINGENCY_RATIO,
  COST_ESCALATION_PER_YEAR,
  DENSITY_VARIANCE_TDC_PER_UNIT,
  DENSITY_VARIANCE_MONTHS,
  ARO_FLOOR_AFFORDABLE_SHARE,
  GAP_ADVANCE_THRESHOLD,
} from '../game/types';

export const stepsByPath: Record<EntitlementPath, number[]> = {
  'by-right': [1, 2, 4],
  zma:        [1, 2, 3, 4],
  pd:         [1, 2, 3, 4],
};

const STEP_DURATIONS: Record<number, number> = {
  1: 6,  // pre-app
  2: 9,  // community
  3: 3,  // zoning committee
  4: 3,  // finance committee
};

const CHOICE_DURATION_OVERRIDES: Partial<Record<StepChoiceKey, number>> = {
  'preapp-public': 0,
  'community-none': 0,
};

function durationFor(step: number, choice: StepChoiceKey): number {
  return CHOICE_DURATION_OVERRIDES[choice] ?? STEP_DURATIONS[step] ?? 0;
}

const STEP_NAMES = ['', 'Pre-app intake', 'Community meeting', 'Committee on Zoning', 'Committee on Finance'];

const BASE_STEP1_CHOICES: { key: StepChoiceKey; title: string; description: string; consequences: string }[] = [
  { key: 'preapp-quiet', title: 'Quiet alder meeting', description: 'Just you and Asha. Low-key, no public attention yet.', consequences: '+2 alder · ±0 community' },
  { key: 'preapp-formal-cbo', title: 'Formal w/ CBO partner', description: 'Bring a community development partner to the first conversation.', consequences: '+5 alder · +6 community' },
  { key: 'preapp-public', title: 'Public pre-launch w/ press', description: 'Announce intentions broadly. Bold; reads as committed.', consequences: '−10 alder · −5 community' },
];

const MULTILINGUAL_CHOICE: { key: StepChoiceKey; title: string; description: string; consequences: string } = {
  key: 'preapp-multilingual',
  title: 'Multilingual community outreach',
  description: 'Lead with door-knocking and printed materials in the languages your future residents speak.',
  consequences: '+15 community · +3 mo',
};

const JP_STEP2_CHOICES: { key: StepChoiceKey; title: string; description: string; consequences: string }[] = [
  {
    key: 'community-jp-full-parking',
    title: 'Accept the parking ask',
    description: 'Provide structured parking matching the neighborhood expectation.',
    consequences: '+12 alder · +15 community · +$30k/u TDC',
  },
  {
    key: 'community-jp-traffic-data',
    title: 'Show traffic data, offer minimal parking',
    description: 'Smaller parking + impact study to address neighborhood concerns.',
    consequences: '+5 alder · +6 community · +$15k/u TDC',
  },
  {
    key: 'community-jp-refuse-parking',
    title: 'Refuse / minimal parking',
    description: "Make the case for transit-oriented development. Risk pushback.",
    consequences: '−5 alder · −10 community',
  },
];

const STEP_CHOICES: Record<number, { key: StepChoiceKey; title: string; description: string; consequences: string }[]> = {
  1: BASE_STEP1_CHOICES,
  2: [
    { key: 'community-none', title: 'No meeting', description: 'Skip community engagement. Faster, but the block club hears about it from rumors.', consequences: '−20 alder · −25 community' },
    { key: 'community-story', title: 'Story-led', description: 'Resident testimonials. Make it about people, not numbers.', consequences: '±0 alder · +12 community' },
    { key: 'community-coalition', title: 'Coalition-led', description: 'Clergy, CBO, advocates speak first. Show breadth of support.', consequences: '+4 alder · +10 community' },
  ],
  3: [
    { key: 'zoning-hold', title: 'Hold the line', description: 'Keep current size. Make the case at Committee.', consequences: '−14 alder · −4 community · vote risk' },
    { key: 'zoning-shrink', title: 'Shrink the project (−12 units)', description: 'Concede unit count. Defuse NIMBY testimony.', consequences: '−6 alder · +15 community · TDC ↓ · impact ↓' },
    { key: 'zoning-accept', title: 'Accept conditions', description: "Take Committee's height cap & unit-mix conditions.", consequences: '−8 alder · ±0 community · TDC +$1.4M' },
  ],
  4: [
    { key: 'finance-reframe', title: 'Reframe the cost', description: 'Make the per-unit-of-impact case. Make Cunningham own his comparison.', consequences: '−2 alder · ±0 community' },
    { key: 'finance-concede', title: 'Concede TIF/HED reduction', description: 'Reduce ask to defuse Reyes. Reopens gap.', consequences: '+5 alder · gap reopens' },
    { key: 'finance-stakeholders', title: 'Bring stakeholders', description: 'Coalition testimony. Powerful but spends community support.', consequences: '±0 alder · −15 community' },
  ],
};

export function Entitlement() {
  const project = useGameStore((s) => s.project);
  const stack = useGameStore((s) => s.stack);
  const entitlement = useGameStore((s) => s.entitlement);
  const proForma = useGameStore((s) => s.proForma);
  const takeStep = useGameStore((s) => s.takeEntitlementStep);
  const tickMonths = useGameStore((s) => s.tickMonths);
  const addCostEscalation = useGameStore((s) => s.addCostEscalation);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const retreatPhase = useGameStore((s) => s.retreatPhase);
  const setOutcome = useGameStore((s) => s.setOutcome);
  const fullState = useGameStore((s) => s);

  if (!project.neighborhood) return null;
  const n = getNeighborhood(project.neighborhood);
  const path = resolveEntitlementPath({
    buildingType: project.buildingType,
    units: project.units,
    neighborhood: project.neighborhood!,  // null-checked earlier in render
  });

  const stepsForPath = stepsByPath[path];
  const stepsCompleted = entitlement.pastChoices.length;
  const allStepsComplete = stepsCompleted >= stepsForPath.length;
  const currentStep = stepsForPath[stepsCompleted] ?? null;

  const cofGapOpen =
    currentStep === 4 && computeEffectiveGap(fullState).gap > GAP_ADVANCE_THRESHOLD;

  function onChoose(choice: StepChoiceKey) {
    const months = currentStep != null ? durationFor(currentStep, choice) : 0;
    takeStep(choice, currentStep ?? 1);

    // Larger building: auto-apply density variance condition at zoning step
    if (currentStep === 3 && project.buildingType === 'larger') {
      const conditionCost = DENSITY_VARIANCE_TDC_PER_UNIT * project.units;
      addCostEscalation(conditionCost);
      tickMonths(DENSITY_VARIANCE_MONTHS);
    }

    // Multilingual outreach adds 3 months of extra community engagement time
    const extraMonths = choice === 'preapp-multilingual' ? 3 : 0;
    if (extraMonths > 0) tickMonths(extraMonths);

    tickMonths(months);
  }

  function onComplete() {
    const affordableUnits =
      proForma.amiBreakdown[30] + proForma.amiBreakdown[60] + proForma.amiBreakdown[80];
    const totalUnits = affordableUnits + (proForma.marketUnits ?? 0);
    const affordableShare = totalUnits > 0 ? affordableUnits / totalUnits : 1;

    if (affordableShare < ARO_FLOOR_AFFORDABLE_SHARE) {
      setOutcome('shelved-aro');
      advancePhase();
      return;
    }

    if (entitlement.alderGoodwill < 20) {
      setOutcome('shelved-finance');
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
    <JargonScreenScope>
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={retreatPhase}
        className="text-muted text-sm mb-4 hover:text-ink inline-block"
      >
        ← Back
      </button>
      <Header />
      <h2 className="text-2xl mt-6 mb-4">Entitlement</h2>

      {/* Path */}
      <div className="bg-panel border border-line rounded-lg p-3 mb-3 text-xs">
        <b>Path:</b>{' '}
        <TooltipTerm term={path === 'by-right' ? 'By-right' : path === 'zma' ? 'ZMA' : 'PD'}>
          {path === 'by-right' ? 'By-right' : path.toUpperCase()}
        </TooltipTerm>{' '}·{' '}
        {path === 'by-right'
          ? 'Pre-app → Community → Committee on Finance → Council (narrative)'
          : 'Pre-app → Community → Committee on Zoning → Committee on Finance → Council (narrative)'}
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

      {/* CoF gap-gate */}
      {cofGapOpen && (
        <div className="bg-bg border-2 border-gap rounded-lg p-4 mb-3">
          <div className="text-xs uppercase tracking-wider text-gap font-bold">
            ▶ Gap reopened — close before the vote
          </div>
          <div className="mt-3">
            <GapCloseModal context="cof" onClose={() => {}} />
          </div>
        </div>
      )}

      {/* Active step */}
      {!cofGapOpen && !allStepsComplete && currentStep != null && (
        <div className="bg-bg border-2 border-caution rounded-lg p-4 mb-3">
          <div className="text-xs uppercase tracking-wider text-caution font-bold">
            ▶ Step {currentStep} — {STEP_NAMES[currentStep]}
          </div>

          {/* Ghost row: by-right skips Committee on Zoning */}
          {path === 'by-right' && currentStep === 4 && (
            <div className="text-xs text-muted italic mb-3 bg-panel/40 rounded p-2">
              Committee on Zoning skipped — by-right at this density, no zoning case required.
            </div>
          )}

          {/* Finance committee — show attacks */}
          {currentStep === 4 && (
            <div className="grid grid-cols-3 gap-2 my-3">
              <div className="bg-panel border-l-2 border-gap p-2 text-xs">
                <b>Ald. Cunningham:</b> "{financeAttackLines.tooExpensive(800_000)}"
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

          {/* Density variance condition banner for larger buildings at zoning step */}
          {currentStep === 3 && project.buildingType === 'larger' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg p-3 mb-3 text-sm">
              <strong><TooltipTerm term="Density variance">Density variance</TooltipTerm> condition.</strong> Committee will impose a height-modulation
              condition: +${((DENSITY_VARIANCE_TDC_PER_UNIT * project.units) / 1_000_000).toFixed(2)}M TDC,
              +{DENSITY_VARIANCE_MONTHS} mo review.
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-3">
            {(() => {
              const baseChoices =
                currentStep === 2 && n.hooks.jeffersonParkParkingChoice
                  ? JP_STEP2_CHOICES
                  : STEP_CHOICES[currentStep] ?? [];
              const choices =
                currentStep === 1 && n.hooks.albanyParkMultilingualChoice
                  ? [...baseChoices, MULTILINGUAL_CHOICE]
                  : baseChoices;
              return choices.map((c) => {
                const baseDurationMonths = CHOICE_DURATION_OVERRIDES[c.key] ?? (STEP_DURATIONS[currentStep] ?? 0);
                const extraMonths = c.key === 'preapp-multilingual' ? 3 : 0;
                const months = baseDurationMonths + extraMonths;
                const hardPerU = HARD_COST_PER_UNIT[project.buildingType] * FINISH_MULTIPLIER[proForma.finishLevel];
                const hard = hardPerU * project.units;
                const escThisStep = hard * (COST_ESCALATION_PER_YEAR / 12) * months * (1 + SOFT_COST_RATIO + CONTINGENCY_RATIO);
                const timeLabel = `+${months} mo · +$${(escThisStep / 1_000_000).toFixed(1)}M cost escalation`;
                const cardTitle: React.ReactNode =
                  c.key === 'preapp-formal-cbo'
                    ? <>Formal w/ <TooltipTerm term="CBO">CBO</TooltipTerm> partner</>
                    : c.title;
                return (
                  <ChoiceCard
                    key={c.key}
                    title={cardTitle}
                    description={c.description}
                    consequences={c.consequences}
                    timeLabel={timeLabel}
                    onClick={() => onChoose(c.key)}
                  />
                );
              });
            })()}
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
    </JargonScreenScope>
  );
}
