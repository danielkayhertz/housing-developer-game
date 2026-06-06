import { useGameStore } from '../game/state';
import { computeEffectiveGap } from '../game/gapResolution';
import { gapActions, GapActionKey } from '../data/gapResolution';
import { Header } from '../components/Header';
import { CharacterBubble } from '../components/CharacterBubble';
import { JargonScreenScope } from '../components/JargonScreenScope';
import { ashaLines } from '../data/characters';
import { GAP_ADVANCE_THRESHOLD, MIN_UNITS_FLOOR, type AmiBand } from '../game/types';
import { LiveGapRow } from '../components/LiveGapRow';
import { TooltipTerm } from '../components/TooltipTerm';

export function GapResolution() {
  const state = useGameStore((s) => s);
  const applyGapAction = useGameStore((s) => s.applyGapAction);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const retreatPhase = useGameStore((s) => s.retreatPhase);
  const shelveProject = useGameStore((s) => s.shelveProject);
  const setAmiUnit = useGameStore((s) => s.setAmiUnit);
  const proForma = useGameStore((s) => s.proForma);
  const projectUnits = useGameStore((s) => s.project.units);

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
    <JargonScreenScope>
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={retreatPhase}
        className="text-muted text-sm mb-4 hover:text-ink inline-block"
      >
        ← Back
      </button>
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

      <div className="bg-panel border border-line rounded-lg p-3 mb-3">
        <div className="text-xs uppercase tracking-wider text-accent font-bold">
          Adjust <TooltipTerm term="AMI">AMI</TooltipTerm> mix
        </div>
        <div className="text-xs text-muted mt-1">
          Deeper affordability means less rent and a bigger gap, but stronger impact.
        </div>
        {[30, 60, 80].map((ami) => {
          const a = ami as AmiBand;
          return (
            <div key={ami} className="mt-2">
              <div className="flex justify-between text-xs">
                <span><b>{ami}% AMI</b></span>
                <span><b>{proForma.amiBreakdown[a]} units</b></span>
              </div>
              <input
                type="range"
                min={0}
                max={projectUnits}
                value={proForma.amiBreakdown[a]}
                onChange={(e) => setAmiUnit(a, parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          );
        })}
        <div className="mt-2">
          <LiveGapRow />
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
    </JargonScreenScope>
  );
}
