import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Entitlement } from '../../src/screens/Entitlement';
import { useGameStore } from '../../src/game/state';

function setupAtCoZ() {
  const s = useGameStore.getState();
  s.reset();
  s.selectNeighborhood('englewood');
  s.setUnits(50);
  s.setBuildingType('midrise');
  // Walk through phases to entitlement
  for (let i = 0; i < 5; i++) s.advancePhase();
  // Take pre-app + community to put us at step 3 (CoZ) for midrise (ZMA path)
  s.takeEntitlementStep('preapp-quiet', 1);
  s.takeEntitlementStep('community-story', 2);
}

function setupAtEntitlement(opts: { buildingType?: 'walkup' | 'midrise' | 'larger'; units?: number; neighborhood?: 'englewood' | 'pilsen' | 'jefferson-park' | 'albany-park' } = {}) {
  const s = useGameStore.getState();
  s.reset();
  s.selectNeighborhood(opts.neighborhood ?? 'englewood');
  s.setUnits(opts.units ?? 50);
  s.setBuildingType(opts.buildingType ?? 'midrise');
  for (let i = 0; i < 5; i++) s.advancePhase();
}

describe('Entitlement alder intro framing (v5 item 8)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('ZMA path shows the zoning sentence', () => {
    setupAtEntitlement({ buildingType: 'midrise' });  // midrise = ZMA
    render(<Entitlement />);
    expect(screen.getByText(/current zoning doesn't allow a building this big/)).toBeInTheDocument();
  });

  it('by-right path omits the zoning sentence', () => {
    setupAtEntitlement({ buildingType: 'walkup', units: 24, neighborhood: 'englewood' });
    render(<Entitlement />);
    expect(screen.queryByText(/current zoning doesn't allow/)).toBeNull();
    expect(screen.getByText(/You'll need Council to approve your financing/)).toBeInTheDocument();
  });
});

describe('Entitlement committee failure gates (v5 item 14)', () => {
  beforeEach(() => useGameStore.getState().reset());

  it('CoZ choice with alder=45 sets outcome shelved-finance', () => {
    setupAtCoZ();
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, alderGoodwill: 45, communitySupport: 60 },
    }));
    render(<Entitlement />);
    // Take any CoZ choice — use zoning-hold to avoid side effects
    fireEvent.click(screen.getByText(/Hold the line/));
    expect(useGameStore.getState().outcome).toBe('shelved-finance');
  });

  it('CoZ choice with post-step alder>=50 but community<30 sets outcome shelved-community', () => {
    setupAtCoZ();
    // zoning-hold applies -14 alder / -4 community; set pre-step values so
    // post-step alder=50 (passes) and post-step community=29 (fails).
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, alderGoodwill: 64, communitySupport: 33 },
    }));
    render(<Entitlement />);
    fireEvent.click(screen.getByText(/Hold the line/));
    expect(useGameStore.getState().outcome).toBe('shelved-community');
  });

  it('CoZ choice with post-step alder>=50 community>=30 leaves outcome in-progress', () => {
    setupAtCoZ();
    // zoning-hold applies -14 alder / -4 community; set pre-step values so
    // post-step alder=50 (passes) and post-step community=60 (passes).
    useGameStore.setState((s) => ({
      entitlement: { ...s.entitlement, alderGoodwill: 64, communitySupport: 64 },
    }));
    render(<Entitlement />);
    fireEvent.click(screen.getByText(/Hold the line/));
    expect(useGameStore.getState().outcome).toBe('in-progress');
  });
});
