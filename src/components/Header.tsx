import { useGameStore } from '../game/state';
import { getNeighborhood } from '../data/neighborhoods';
import { computeTdc } from '../game/proForma';
import { totalCommitted } from '../game/capitalStack';
import { TimelinePill } from './TimelinePill';
import { REVISION_SOFT_PENALTY } from '../game/types';

export function Header() {
  const phase = useGameStore((s) => s.phase);
  const project = useGameStore((s) => s.project);
  const proForma = useGameStore((s) => s.proForma);
  const stack = useGameStore((s) => s.stack);
  const monthsElapsed = useGameStore((s) => s.monthsElapsed);
  const costEscalation = useGameStore((s) => s.costEscalation);

  if (!project.neighborhood) return null;

  const n = getNeighborhood(project.neighborhood);
  const tdcParts = computeTdc({
    neighborhood: project.neighborhood,
    units: project.units,
    buildingType: project.buildingType,
    finishLevel: proForma.finishLevel,
  });
  const revisionPenalty = stack.lihtcRevisions * REVISION_SOFT_PENALTY;
  const tdcWithEscalation = tdcParts.total + costEscalation + revisionPenalty;
  const committed = totalCommitted(stack.awarded);
  const gap = Math.max(0, tdcWithEscalation - committed);

  const phaseNames = ['', 'Intro', 'Site & Concept', 'Pro Forma', 'Capital Stack', 'Gap Resolution', 'Entitlement', 'Close'];

  return (
    <div className="bg-panel border border-line rounded-lg px-3 py-2 text-sm text-muted flex flex-wrap gap-3 items-center">
      <span>
        {n.emoji} <b className="text-ink">{n.name}</b> · {project.units} units · {project.intent === 'all-affordable' ? 'all-affordable' : 'mixed-income'}
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
      </span>
    </div>
  );
}
