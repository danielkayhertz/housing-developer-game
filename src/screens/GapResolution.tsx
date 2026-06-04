import { useGameStore } from '../game/state';
import { computeEffectiveGap } from '../game/gapResolution';
import { gapActions, GapActionKey } from '../data/gapResolution';
import { Header } from '../components/Header';
import { CharacterBubble } from '../components/CharacterBubble';
import { ashaLines } from '../data/characters';
import { GAP_ADVANCE_THRESHOLD, MIN_UNITS_FLOOR } from '../game/types';

export function GapResolution() {
  const state = useGameStore((s) => s);
  const applyGapAction = useGameStore((s) => s.applyGapAction);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const shelveProject = useGameStore((s) => s.shelveProject);

  if (!state.project.neighborhood) return null;

  const { gap, effectiveUnits, tdcAllIn, committed } = computeEffectiveGap(state);
  const canAdvance = gap <= GAP_ADVANCE_THRESHOLD;

  const subsidyDisabled = state.entitlement.alderGoodwill === 0;
  const shrinkDisabled = effectiveUnits <= MIN_UNITS_FLOOR;
  const qualityDisabled = state.gapResolution.lowerQualityUsed;
  const allExhausted = subsidyDisabled && shrinkDisabled && qualityDisabled;

  function isDisabled(key: GapActionKey): boolean {
    if (key === 'askSubsidy') return subsidyDisabled;
    if (key === 'redesignSmaller') return shrinkDisabled;
    if (key === 'lowerQuality') return qualityDisabled;
    return false;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Header />
      <h2 className="text-2xl mt-6 mb-2">Close the Gap</h2>

      <div className="mb-3">
        <CharacterBubble characterId="asha" line={ashaLines.gapResolutionIntro} />
      </div>

      <div className="bg-gap text-white rounded-lg p-4 mb-3">
        <div className="text-xs uppercase tracking-wider opacity-80">Outstanding gap</div>
        <div className="text-3xl font-bold tabular">${(gap / 1_000_000).toFixed(1)}M</div>
        <div className="text-xs opacity-80 mt-1 tabular">
          {effectiveUnits} units · TDC ${(tdcAllIn / 1_000_000).toFixed(1)}M · committed ${(committed / 1_000_000).toFixed(1)}M
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {gapActions.map((a) => {
          const disabled = isDisabled(a.key);
          const used = a.key === 'lowerQuality' && state.gapResolution.lowerQualityUsed;
          return (
            <button
              key={a.key}
              onClick={() => applyGapAction(a.key)}
              disabled={disabled}
              className={`text-left p-3 rounded-lg border-2 transition ${
                disabled
                  ? 'bg-panel border-line opacity-50 cursor-not-allowed'
                  : 'bg-panel border-line hover:border-accent'
              }`}
            >
              <div className="text-2xl">{a.emoji}</div>
              <div className="font-bold text-sm mt-1">{a.title}{used && ' ✓'}</div>
              <div className="text-caution text-xs mt-2 tabular">{a.effectLabel}</div>
              {disabled && (
                <div className="text-muted text-xs italic mt-1">{a.disabledMsg}</div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={advancePhase}
        disabled={!canAdvance}
        className="w-full bg-accent text-white py-3 rounded-lg font-bold disabled:opacity-40"
      >
        {canAdvance
          ? 'Gap closed — on to entitlement →'
          : `Close the remaining $${(gap / 1_000_000).toFixed(1)}M gap to advance`}
      </button>

      {!canAdvance && allExhausted && (
        <>
          <button
            onClick={shelveProject}
            className="w-full mt-2 bg-gap text-white py-3 rounded-lg font-bold"
          >
            Shelve the project
          </button>
          <div className="mt-2">
            <CharacterBubble characterId="asha" line={ashaLines.gapResolutionShelve} whisper />
          </div>
        </>
      )}
    </div>
  );
}
