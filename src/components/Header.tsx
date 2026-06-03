import { useGameStore } from '../game/state';
import { getNeighborhood } from '../data/neighborhoods';
import { computeTdc } from '../game/proForma';
import { totalCommitted } from '../game/capitalStack';

export function Header() {
  const phase = useGameStore((s) => s.phase);
  const project = useGameStore((s) => s.project);
  const proForma = useGameStore((s) => s.proForma);
  const stack = useGameStore((s) => s.stack);
  const yearsElapsed = useGameStore((s) => s.yearsElapsed);
  const costEscalation = useGameStore((s) => s.costEscalation);

  if (!project.neighborhood) return null;

  const n = getNeighborhood(project.neighborhood);
  const tdcParts = computeTdc({
    neighborhood: project.neighborhood,
    units: project.units,
    buildingType: project.buildingType,
    finishLevel: proForma.finishLevel,
  });
  const tdcWithEscalation = tdcParts.total + costEscalation;
  const committed = totalCommitted(stack.awarded);
  const gap = Math.max(0, tdcWithEscalation - committed);

  const phaseNames = ['', 'Intro', 'Site & Concept', 'Pro Forma', 'Capital Stack', 'Entitlement', 'Close'];

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
      <span className="ml-auto">
        Year <b className="text-ink tabular">{(yearsElapsed + phase * 0.2).toFixed(1)}</b> · Phase <b className="text-ink">{phase} / 6 — {phaseNames[phase]}</b>
      </span>
    </div>
  );
}
