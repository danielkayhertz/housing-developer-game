import { useState } from 'react';
import { useGameStore } from '../game/state';
import { getNeighborhood } from '../data/neighborhoods';
import { computeEffectiveGap } from '../game/gapResolution';
import { TimelinePill } from './TimelinePill';
import { GlossaryPanel } from './GlossaryPanel';

export function Header() {
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const state = useGameStore((s) => s);
  const { phase, project, monthsElapsed, costEscalation } = state;

  if (!project.neighborhood) return null;

  const n = getNeighborhood(project.neighborhood);
  const eg = computeEffectiveGap(state);
  const effectiveUnits = eg.effectiveUnits;
  const tdcWithEscalation = eg.tdcAllIn;
  const gap = eg.gap;

  const phaseNames = ['', 'Intro', 'Site & Concept', 'Pro Forma', 'Capital Stack', 'Gap Resolution', 'Entitlement', 'Close'];

  return (
    <>
    <div className="bg-panel border border-line rounded-lg px-3 py-2 text-sm text-muted flex flex-wrap gap-3 items-center">
      <span>
        {n.emoji} <b className="text-ink">{n.name}</b> · {effectiveUnits} units · {project.intent === 'all-affordable' ? 'all-affordable' : 'mixed-income'}
      </span>
      <span>·</span>
      <span>
        TDC <b className="text-ink tabular">${(tdcWithEscalation / 1_000_000).toFixed(1)}M</b>
        {costEscalation > 0 && (
          <span className="text-caution"> (+${(costEscalation / 1_000_000).toFixed(1)}M esc)</span>
        )}
      </span>
      <span>·</span>
      <span>
        Gap <b className={gap > 0 ? 'text-gap tabular' : 'text-equity tabular'}>${(gap / 1_000_000).toFixed(1)}M</b>
      </span>
      <span className="ml-auto flex items-center gap-2">
        <TimelinePill months={monthsElapsed} />
        <span>Phase <b className="text-ink">{phase} / 7 — {phaseNames[phase]}</b></span>
        <button
          onClick={() => setGlossaryOpen(true)}
          aria-label="Open glossary"
          className="w-7 h-7 rounded-full border border-line bg-panel hover:border-accent flex items-center justify-center text-xs font-bold text-muted hover:text-ink"
        >
          ?
        </button>
      </span>
    </div>
    <GlossaryPanel open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
    </>
  );
}
