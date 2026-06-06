import { useGameStore } from '../game/state';
import { computeTdc, weightedAvgAmi } from '../game/proForma';
import { formatElapsed } from '../util/formatElapsed';
import { totalCommitted } from '../game/capitalStack';
import { computeImpactScore } from '../game/scoring';
import { getNeighborhood } from '../data/neighborhoods';
import { StackBar } from '../components/StackBar';
import { AmiBand } from '../game/types';
import { JargonScreenScope } from '../components/JargonScreenScope';
import { TooltipTerm } from '../components/TooltipTerm';
import { getReactions } from '../data/closeReactions';

export function Close() {
  const project = useGameStore((s) => s.project);
  const proForma = useGameStore((s) => s.proForma);
  const stack = useGameStore((s) => s.stack);
  const entitlement = useGameStore((s) => s.entitlement);
  const outcome = useGameStore((s) => s.outcome);
  const monthsElapsed = useGameStore((s) => s.monthsElapsed);
  const costEscalation = useGameStore((s) => s.costEscalation);
  const reset = useGameStore((s) => s.reset);

  if (!project.neighborhood) return null;
  const n = getNeighborhood(project.neighborhood);
  const closed = outcome === 'closed';
  const finalUnits = Math.max(1, project.units - entitlement.projectShrinkBy);

  const tdcParts = computeTdc({
    neighborhood: project.neighborhood,
    units: finalUnits,
    buildingType: project.buildingType,
    finishLevel: proForma.finishLevel,
  });
  const tdcTotal = tdcParts.total + costEscalation;

  const score = computeImpactScore({
    closed,
    amiBreakdown: proForma.amiBreakdown,
  });

  const failureMessage =
    outcome === 'shelved-stack' ? 'The stack never closed. Cost escalation pushed the gap past what could be filled, and the project was shelved.' :
    outcome === 'shelved-finance' ? "Committee on Finance failed. Reyes and Cunningham teamed up; Asha couldn't hold the room. The coalition broke and the project was tabled." :
    outcome === 'shelved-alder' ? 'Asha quietly told you she couldn\'t push it forward. The site was eventually sold to a market-rate developer.' :
    outcome === 'shelved-community' ? 'The community engagement collapsed at the meeting. The alder withdrew support and the project died.' :
    '';

  return (
    <JargonScreenScope>
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-panel border border-line rounded-xl p-4 mb-4 text-center">
        <div className="text-4xl">{closed ? '🎉' : '🛑'}</div>
        <h2 className="text-2xl mt-2 mb-1">{closed ? 'You closed.' : 'The project was shelved.'}</h2>
        <p className="text-muted">
          {closed
            ? `${n.name} ${project.buildingType} broke ground after ${formatElapsed(monthsElapsed)}. ${finalUnits} homes on the way.`
            : failureMessage}
        </p>
        {closed && (
          <div className="mt-3 inline-block bg-bg text-accent px-4 py-2 rounded-full font-bold">
            Impact score: <b className="text-xl tabular">{score}</b>
          </div>
        )}
      </div>

      {closed && (
        <div className="bg-panel border-2 border-accent rounded-xl p-4 mb-4">
          <div className="text-xs uppercase tracking-wider text-accent font-bold">Your project · shareable</div>
          <h3 className="text-xl mt-1">{n.emoji} The {n.name} {project.buildingType}</h3>

          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div><div className="text-xs uppercase text-muted">Units</div><div className="text-xl font-bold tabular">{finalUnits}</div></div>
            <div><div className="text-xs uppercase text-muted">Wtd avg <TooltipTerm term="AMI">AMI</TooltipTerm></div><div className="text-xl font-bold tabular">{Math.round(weightedAvgAmi(proForma.amiBreakdown))}%</div></div>
            <div><div className="text-xs uppercase text-muted">Final TDC</div><div className="text-xl font-bold tabular">${(tdcTotal / 1_000_000).toFixed(1)}M</div></div>
            <div><div className="text-xs uppercase text-muted">Per unit</div><div className="text-xl font-bold tabular">${(tdcTotal / finalUnits / 1000).toFixed(0)}k</div></div>
            <div>
              <div className="text-xs uppercase text-muted">Cost escalation</div>
              <div className="text-xl font-bold tabular text-caution">
                {costEscalation > 0 ? `+$${(costEscalation / 1_000_000).toFixed(1)}M` : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted">Units lost</div>
              <div className="text-xl font-bold tabular text-caution">
                {(() => {
                  const initial = project.initialUnits ?? finalUnits;
                  const delta = initial - finalUnits;
                  return delta > 0 ? `−${delta} vs. plan` : '—';
                })()}
              </div>
            </div>
          </div>

          <div className="text-xs uppercase tracking-wider text-accent font-bold mt-4 mb-1">Affordability</div>
          <div className="flex h-5 rounded overflow-hidden text-xs text-white font-bold">
            {([30, 60, 80] as AmiBand[]).map((ami) => {
              const count = proForma.amiBreakdown[ami];
              const pct = (count / finalUnits) * 100;
              if (pct < 0.5) return null;
              const color = ami === 30 ? 'bg-gap' : ami === 60 ? 'bg-accent' : 'bg-debt';
              return (
                <div key={ami} className={`${color} flex items-center justify-center`} style={{ flexBasis: `${pct}%` }}>
                  {pct >= 10 && `${count}@${ami}%`}
                </div>
              );
            })}
          </div>

          <div className="text-xs uppercase tracking-wider text-accent font-bold mt-4 mb-1">Capital stack</div>
          <StackBar tdc={tdcTotal} awarded={stack.awarded} bankLoan={0} />

          <div className="text-xs uppercase tracking-wider text-accent font-bold mt-4 mb-1">Journey</div>
          <ul className="list-disc pl-5 text-sm space-y-1 text-muted">
            <li>Month 1 — Site &amp; Pro Forma. {n.name} at {project.units} units, {proForma.finishLevel} finish.</li>
            <li>Month {Math.max(1, monthsElapsed - 24)} — 9% LIHTC {stack.lihtcAwarded ? 'awarded' : 'denied'}.</li>
            <li>Month {Math.max(2, monthsElapsed - 12)} — Community engagement, alder relationship, financing assembled.</li>
            <li>Month {monthsElapsed} — Closed at ${totalCommitted(stack.awarded).toLocaleString()} stack composition.</li>
          </ul>
        </div>
      )}

      <StakeholderPanel />

      <div className="grid grid-cols-2 gap-2">
        <button onClick={reset} className="bg-accent text-white py-3 rounded-lg font-bold">
          ↻ Try a different choice
        </button>
        <a
          href="https://housing.thewychefamily.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-panel border border-line py-3 rounded-lg font-bold text-center hover:border-accent"
        >
          📖 Read about Chicago housing
        </a>
      </div>
    </div>
    </JargonScreenScope>
  );
}

function StakeholderPanel() {
  const state = useGameStore((s) => s);
  const reactions = getReactions(state);
  if (reactions.length === 0) return null;

  return (
    <div className="bg-panel border border-line rounded-xl p-4 mb-4">
      <div className="text-xs uppercase tracking-wider text-accent font-bold mb-3">Reactions</div>
      <div className="space-y-2">
        {reactions.map((r, i) => {
          const lineContent =
            state.outcome === 'shelved-aro' && i === 0
              ? <>The <TooltipTerm term="ARO">ARO</TooltipTerm> requires 20% affordability anyway. We&apos;re not going to subsidize that.</>
              : r.line;
          return (
            <div key={i} className="bg-bg p-3 rounded-lg text-sm">
              <b>{r.emoji} {r.voice}</b>
              <span className="text-muted"> · {r.affiliation}</span>
              <br />
              <i className="text-muted">{lineContent}</i>
            </div>
          );
        })}
      </div>
    </div>
  );
}
