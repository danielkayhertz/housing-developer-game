import { useGameStore } from '../game/state';
import { neighborhoods, getNeighborhood } from '../data/neighborhoods';
import { computeTdc } from '../game/proForma';
import { resolveEntitlementPath } from '../game/entitlement';
import { Header } from '../components/Header';
import { CharacterBubble } from '../components/CharacterBubble';
import { NeighborhoodId, BuildingType, Intent } from '../game/types';

export function SiteAndConcept() {
  const project = useGameStore((s) => s.project);
  const finishLevel = useGameStore((s) => s.proForma.finishLevel);
  const selectNeighborhood = useGameStore((s) => s.selectNeighborhood);
  const setUnits = useGameStore((s) => s.setUnits);
  const setBuildingType = useGameStore((s) => s.setBuildingType);
  const setIntent = useGameStore((s) => s.setIntent);
  const setCboPartner = useGameStore((s) => s.setCboPartner);
  const advancePhase = useGameStore((s) => s.advancePhase);

  const n = project.neighborhood ? getNeighborhood(project.neighborhood) : null;
  const tdcEstimate = project.neighborhood
    ? computeTdc({
        neighborhood: project.neighborhood,
        units: project.units,
        buildingType: project.buildingType,
        finishLevel,
      }).total
    : 0;
  const entitlementPath = resolveEntitlementPath({
    buildingType: project.buildingType,
    units: project.units,
  });

  const canAdvance = project.neighborhood && getNeighborhood(project.neighborhood).status === 'mvp';

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Header />
      <h2 className="text-2xl mt-6 mb-4">Site &amp; Concept</h2>
      <div className="grid grid-cols-[1.2fr_1fr] gap-4">
        <div>
          {/* Neighborhood picker */}
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">1. Neighborhood</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {neighborhoods.map((nb) => (
              <button
                key={nb.id}
                onClick={() => selectNeighborhood(nb.id as NeighborhoodId)}
                className={`text-left p-3 rounded-lg border-2 transition ${
                  project.neighborhood === nb.id ? 'bg-bg border-accent' : 'bg-panel border-line hover:border-accent'
                } ${nb.status === 'stub' ? 'opacity-60' : ''}`}
              >
                <div className="font-bold text-sm">{nb.emoji} {nb.name} {nb.status === 'stub' && <span className="text-xs text-caution">(v2)</span>}</div>
                <div className="text-xs text-muted mt-1">{nb.description}</div>
                <div className="text-xs text-muted mt-1 tabular">
                  Land ~${(nb.landCostPerUnit / 1000).toFixed(0)}k/u · Mkt ${nb.marketRentPerUnit.toLocaleString()}
                </div>
              </button>
            ))}
          </div>

          {/* Unit count */}
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">2. Unit count</div>
          <div className="mb-4">
            <input
              type="range"
              min={40}
              max={100}
              step={1}
              value={project.units}
              onChange={(e) => setUnits(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted tabular">
              <span>40</span><span className="font-bold text-ink">{project.units} units</span><span>100</span>
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
          <div className="grid grid-cols-2 gap-2 mb-6">
            {(['all-affordable', 'mixed-income'] as Intent[]).map((i) => (
              <button
                key={i}
                onClick={() => setIntent(i)}
                className={`p-2 text-xs rounded border-2 transition ${
                  project.intent === i ? 'bg-bg border-accent' : 'bg-panel border-line hover:border-accent'
                } ${i === 'mixed-income' ? 'opacity-60' : ''}`}
              >
                {i === 'all-affordable' ? 'All-affordable (LIHTC) · MVP' : 'Mixed-income (v2)'}
              </button>
            ))}
          </div>

          {/* CBO partner */}
          <div className="text-xs uppercase tracking-wider text-accent font-bold mb-2">5. CBO partner</div>
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => setCboPartner(true)}
              className={`p-2 text-xs rounded border-2 transition text-left ${
                project.hasCboPartner ? 'bg-bg border-accent' : 'bg-panel border-line hover:border-accent'
              }`}
            >
              <b>🤝 Partner with a CBO</b>
              <div className="text-muted mt-1">+18 QAP · +6 community at entitlement start · +6 mo pre-app time</div>
            </button>
            <button
              onClick={() => setCboPartner(false)}
              className={`p-2 text-xs rounded border-2 transition text-left ${
                !project.hasCboPartner ? 'bg-bg border-accent' : 'bg-panel border-line hover:border-accent'
              }`}
            >
              <b>Go solo</b>
              <div className="text-muted mt-1">Faster start, but you'll need to earn community support cold.</div>
            </button>
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
                <CharacterBubble characterId="asha" line={n.alderGreeting} />
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
  );
}
