import { useGameStore } from '../game/state';
import { neighborhoods, getNeighborhood } from '../data/neighborhoods';
import { computeTdc } from '../game/proForma';
import { resolveEntitlementPath } from '../game/entitlement';
import { getNeighborhoodAlderId } from '../data/characters';
import { Header } from '../components/Header';
import { CharacterBubble } from '../components/CharacterBubble';
import { JargonScreenScope } from '../components/JargonScreenScope';
import { TooltipTerm } from '../components/TooltipTerm';
import { NeighborhoodId, BuildingType } from '../game/types';

export function SiteAndConcept() {
  const project = useGameStore((s) => s.project);
  const finishLevel = useGameStore((s) => s.proForma.finishLevel);
  const selectNeighborhood = useGameStore((s) => s.selectNeighborhood);
  const setUnits = useGameStore((s) => s.setUnits);
  const setBuildingType = useGameStore((s) => s.setBuildingType);
  const setIntent = useGameStore((s) => s.setIntent);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const retreatPhase = useGameStore((s) => s.retreatPhase);

  const n = project.neighborhood ? getNeighborhood(project.neighborhood) : null;
  const tdcEstimate = project.neighborhood
    ? computeTdc({
        neighborhood: project.neighborhood,
        units: project.units,
        buildingType: project.buildingType,
        finishLevel,
      }).total
    : 0;
  const entitlementPath = project.neighborhood
    ? resolveEntitlementPath({
        buildingType: project.buildingType,
        units: project.units,
        neighborhood: project.neighborhood,
      })
    : null;

  const canAdvance = project.neighborhood && getNeighborhood(project.neighborhood).status === 'mvp';

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
      <h2 className="text-2xl mt-6 mb-4">Site &amp; Concept</h2>
      <div className="grid grid-cols-[1.2fr_1fr] gap-4">
        <div>
          {/* Neighborhood picker */}
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">1. Neighborhood</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {neighborhoods.map((nb) => (
              <div
                key={nb.id}
                className={`p-4 border rounded-lg cursor-pointer ${
                  project.neighborhood === nb.id ? 'border-accent bg-accent/10' : 'border-line bg-panel hover:border-accent'
                }`}
                onClick={() => selectNeighborhood(nb.id as NeighborhoodId)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{nb.emoji}</span>
                  <span className="font-semibold text-sm">{nb.name}</span>
                </div>
                <div className="text-xs text-muted mb-2">{nb.description}</div>
                <div className="text-sm flex flex-col gap-0.5 tabular">
                  <div className="flex justify-between text-xs"><span>Base land</span><span>${(nb.landCostPerUnit / 1000).toFixed(0)}k/u</span></div>
                  <div className="flex justify-between text-xs"><span>Market rent</span><span>${nb.marketRentPerUnit.toLocaleString()}/mo</span></div>
                  <div className="flex justify-between text-xs"><span>TIF</span><span>{nb.tifAvailable ? 'available' : 'not available'}</span></div>
                  <div className="flex justify-between text-xs"><span>Alder</span><span>{nb.alderName}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Unit count */}
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">2. Unit count</div>
          <div className="mb-4">
            <input
              type="range"
              min={20}
              max={100}
              step={1}
              value={project.units}
              onChange={(e) => setUnits(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted tabular">
              <span>20</span><span className="font-bold text-ink">{project.units} units</span><span>100</span>
            </div>
          </div>

          {/* Building type */}
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">3. Building type</div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(['walkup', 'midrise', 'larger'] as BuildingType[]).map((t) => (
              <button
                key={t}
                onClick={() => setBuildingType(t)}
                className={`p-2 text-xs rounded border-2 transition ${
                  project.buildingType === t ? 'bg-bg border-accent' : 'bg-panel border-line hover:border-accent'
                } ${t !== 'midrise' ? 'opacity-60' : ''}`}
              >
                {t === 'walkup' && <><span>🏠 Walk-up</span><br/><small>2-3 story (v2)</small></>}
                {t === 'midrise' && <><span>🏘️ Mid-rise</span><br/><small>4-5 story · MVP</small></>}
                {t === 'larger' && <><span>🏢 Larger</span><br/><small>6-8 story (v2)</small></>}
              </button>
            ))}
          </div>

          {/* Intent */}
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">4. Intent</div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                project.intent === 'all-affordable'
                  ? 'border-accent bg-accent/10'
                  : 'border-line hover:border-accent/50'
              }`}
              onClick={() => setIntent('all-affordable')}
            >
              <div className="font-semibold mb-1">All-affordable</div>
              <div className="text-xs text-muted">100% affordable units across 30/60/80 AMI bands.</div>
            </div>
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                project.intent === 'mixed-income'
                  ? 'border-accent bg-accent/10'
                  : 'border-line hover:border-accent/50'
              }`}
              onClick={() => setIntent('mixed-income')}
            >
              <div className="font-semibold mb-1">Mixed-income</div>
              <div className="text-xs text-muted">Allocate some units at market rate; cross-subsidy from market rents.</div>
              <div className="text-xs text-muted mt-1">
                Some affordability still required under the <TooltipTerm term="ARO">ARO</TooltipTerm>.
              </div>
            </div>
          </div>

          <button
            onClick={advancePhase}
            disabled={!canAdvance}
            className="w-full bg-accent text-white py-3 rounded-lg font-bold disabled:opacity-40 hover:opacity-90"
          >
            Lock in &amp; continue →
          </button>
        </div>

        {/* Live preview */}
        <div className="bg-panel border border-line rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">Live preview</div>
          {n ? (
            <>
              <h3 className="text-lg mt-2">{n.name} · {project.units} units · {project.buildingType}</h3>
              <ul className="text-sm space-y-1 mt-3 tabular">
                <li><b>Estimated TDC:</b> ~${(tdcEstimate / 1_000_000).toFixed(1)}M</li>
                <li><b>Per unit:</b> ~${(tdcEstimate / project.units / 1000).toFixed(0)}k/u</li>
                <li><b>Entitlement path:</b> {entitlementPath === 'pd' ? 'Planned Development' : entitlementPath === 'by-right' ? 'By-right' : 'Zoning Map Amendment'}</li>
                <li><b>Connected Communities Ordinance:</b> Eligible (TOD)</li>
              </ul>
              <div className="mt-4">
                <CharacterBubble characterId={getNeighborhoodAlderId(n.id)} line={n.alderGreeting} />
              </div>
              {n.status === 'stub' && (
                <div className="mt-4 p-3 bg-bg border-l-2 border-caution rounded text-xs">
                  {n.name} is a v2 neighborhood. Pick Englewood for the full MVP experience.
                </div>
              )}
            </>
          ) : (
            <p className="text-muted text-sm">Pick a neighborhood to see the preview.</p>
          )}
        </div>
      </div>
    </div>
    </JargonScreenScope>
  );
}
