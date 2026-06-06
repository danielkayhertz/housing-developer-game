import { useGameStore } from '../game/state';
import { computeEffectiveGap } from '../game/gapResolution';
import { gapActions, GapActionKey } from '../data/gapResolution';
import { CharacterBubble } from './CharacterBubble';
import { TooltipTerm } from './TooltipTerm';
import { LiveGapRow } from './LiveGapRow';
import { ashaLines, davidLines } from '../data/characters';
import { GAP_ADVANCE_THRESHOLD, MIN_UNITS_FLOOR, type AmiBand } from '../game/types';

interface GapCloseModalProps {
  context: 'phase-5' | 'cof';
  onClose: () => void;
}

export function GapCloseModal({ context, onClose }: GapCloseModalProps) {
  const state = useGameStore((s) => s);
  const applyGapAction = useGameStore((s) => s.applyGapAction);
  const setAmiUnit = useGameStore((s) => s.setAmiUnit);
  const proForma = useGameStore((s) => s.proForma);
  const projectUnits = useGameStore((s) => s.project.units);

  if (!state.project.neighborhood) return null;

  const { gap, effectiveUnits, tdcAllIn, committed } = computeEffectiveGap(state);
  const canClose = gap <= GAP_ADVANCE_THRESHOLD;

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

  if (!canClose && allExhausted) {
    return (
      <div className="bg-bg border-2 border-gap rounded-lg p-4">
        <div className="text-xs uppercase tracking-wider text-gap font-bold">▶ Out of moves</div>
        <div className="mt-3">
          <CharacterBubble
            characterId="david"
            line={context === 'cof'
              ? "We're out of moves. The committee is going to vote no. Start over."
              : davidLines.gapResolutionExhausted}
          />
        </div>
        <button
          onClick={() => useGameStore.getState().reset()}
          className="w-full mt-3 bg-gap text-white py-3 rounded-lg font-bold"
        >
          Start over
        </button>
      </div>
    );
  }

  const ashaLine = context === 'cof'
    ? "The committee will want to see the gap closed before they vote. What can we do?"
    : ashaLines.gapResolutionIntro;

  return (
    <>
      <div className="mb-3">
        <CharacterBubble characterId="asha" line={ashaLine} />
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
        onClick={onClose}
        disabled={!canClose}
        className="w-full bg-accent text-white py-3 rounded-lg font-bold disabled:opacity-40"
      >
        {canClose
          ? (context === 'cof' ? 'Gap closed — committee can vote →' : 'Gap closed — on to entitlement →')
          : `Close the remaining $${(gap / 1_000_000).toFixed(1)}M gap to advance`}
      </button>
    </>
  );
}
