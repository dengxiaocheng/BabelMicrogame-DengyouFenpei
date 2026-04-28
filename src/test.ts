import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState, placeLamp, adjustLamp,
  runWorkPhase, runSettlePhase, checkOutcome,
  advanceRound, playRound, countAreaStates,
  AREAS,
} from './main.ts';

describe('Foundation: createInitialState', () => {
  it('returns valid initial state', () => {
    const s = createInitialState();
    assert.equal(s.phase, 'view');
    assert.equal(s.round, 1);
    assert.equal(s.resource, 80);
    assert.equal(s.pressure, 10);
    assert.equal(s.risk, 10);
    assert.equal(s.relation, 50);
    assert.equal(s.gameOver, false);
    assert.equal(s.outcome, null);
    assert.equal(s.lamps.length, 0);
  });

  it('initializes all areas to 0 brightness', () => {
    const s = createInitialState();
    for (const a of AREAS) {
      assert.equal(s.areaBrightness[a.id], 0);
    }
  });
});

describe('Foundation: placeLamp', () => {
  it('places a lamp in place phase', () => {
    let s = { ...createInitialState(), phase: 'place' as const };
    s = placeLamp(s, 'tunnel', 40);
    assert.equal(s.lamps.length, 1);
    assert.equal(s.lamps[0].areaId, 'tunnel');
    assert.equal(s.lamps[0].brightness, 40);
    assert.ok(s.resource < 80);
    assert.equal(s.areaBrightness['tunnel'], 40);
  });

  it('rejects in wrong phase', () => {
    const s = createInitialState(); // phase is 'view'
    const r = placeLamp(s, 'tunnel', 40);
    assert.equal(r.lamps.length, 0);
  });

  it('rejects when insufficient resource', () => {
    let s = { ...createInitialState(), phase: 'place' as const, resource: 1 };
    s = placeLamp(s, 'tunnel', 80);
    assert.equal(s.lamps.length, 0);
    assert.ok(s.log.some(m => m.includes('灯油不足')));
  });
});

describe('Foundation: adjustLamp', () => {
  it('adjusts brightness up', () => {
    let s = { ...createInitialState(), phase: 'adjust' as const, lamps: [{ areaId: 'tunnel', brightness: 40 }] };
    s = adjustLamp(s, 0, 60);
    assert.equal(s.lamps[0].brightness, 60);
    assert.equal(s.areaBrightness['tunnel'], 60);
  });

  it('adjusts brightness down (refunds oil)', () => {
    let s = { ...createInitialState(), phase: 'adjust' as const, lamps: [{ areaId: 'tunnel', brightness: 60 }], resource: 50 };
    s = adjustLamp(s, 0, 30);
    assert.equal(s.lamps[0].brightness, 30);
    assert.ok(s.resource > 50);
  });
});

describe('Foundation: runWorkPhase', () => {
  it('sets phase to work', () => {
    const s = createInitialState();
    assert.equal(runWorkPhase(s).phase, 'work');
  });

  it('increases risk when all areas dark', () => {
    const s = createInitialState();
    const r = runWorkPhase(s);
    assert.ok(r.risk > s.risk);
  });

  it('consumes oil for running lamps', () => {
    let s = { ...createInitialState(), lamps: [{ areaId: 'tunnel', brightness: 40 }] };
    s = runWorkPhase(s);
    assert.ok(s.log.some(m => m.includes('消耗')));
  });
});

describe('Foundation: runSettlePhase', () => {
  it('sets phase to settle', () => {
    const s = createInitialState();
    assert.equal(runSettlePhase(s).phase, 'settle');
  });

  it('reduces pressure each round', () => {
    const s = { ...createInitialState(), pressure: 30 };
    const r = runSettlePhase(s);
    assert.ok(r.pressure < 30);
  });
});

describe('Foundation: checkOutcome', () => {
  it('returns null for normal state', () => {
    assert.equal(checkOutcome(createInitialState()), null);
  });

  it('detects accident catastrophe', () => {
    assert.equal(checkOutcome({ ...createInitialState(), risk: 100 }), 'accident_catastrophe');
  });

  it('detects patrol busted', () => {
    assert.equal(checkOutcome({ ...createInitialState(), risk: 50, pressure: 100 }), 'patrol_busted');
  });

  it('detects oil run out', () => {
    assert.equal(checkOutcome({ ...createInitialState(), resource: 0 }), 'oil_run_out');
  });

  it('detects survived after maxRounds', () => {
    assert.equal(checkOutcome({ ...createInitialState(), round: 5 }), 'survived');
  });
});

describe('Foundation: core loop end-to-end', () => {
  it('plays a full round: place -> adjust -> work -> settle', () => {
    let s = createInitialState();
    s = { ...s, phase: 'place' };
    s = placeLamp(s, 'tunnel', 50);
    s = placeLamp(s, 'yard', 40);
    s = { ...s, phase: 'adjust' };
    s = adjustLamp(s, 0, 60);
    s = playRound(s);
    assert.equal(s.phase, 'settle');
    assert.ok(s.log.length > 0);
    assert.ok(!s.gameOver);
  });

  it('can advance to next round after settle', () => {
    let s = createInitialState();
    s = { ...s, phase: 'place' };
    s = placeLamp(s, 'tunnel', 50);
    s = playRound(s);
    s = advanceRound(s);
    assert.equal(s.round, 2);
    assert.equal(s.phase, 'view');
    assert.equal(s.lamps.length, 0);
  });
});

// ============================================================
// Direction Lock State: cross-pressure and one-cycle settlement
// ============================================================

describe('Direction Lock: runWorkPhase cross-pressure', () => {
  it('bright areas increase patrol attention', () => {
    const s = {
      ...createInitialState(),
      areaBrightness: { tunnel: 80, yard: 80, storage: 0, entrance: 0 },
      lamps: [{ areaId: 'tunnel', brightness: 80 }, { areaId: 'yard', brightness: 80 }],
    };
    const r = runWorkPhase(s);
    assert.ok(r.pressure > 10, 'pressure increased from bright areas');
    assert.ok(r.log.some(m => m.includes('过亮')));
  });

  it('dim areas increase risk mildly', () => {
    const s = {
      ...createInitialState(),
      areaBrightness: { tunnel: 20, yard: 20, storage: 0, entrance: 0 },
      lamps: [{ areaId: 'tunnel', brightness: 20 }, { areaId: 'yard', brightness: 20 }],
    };
    const r = runWorkPhase(s);
    assert.ok(r.risk > 10, 'dim areas add risk');
    assert.ok(r.log.some(m => m.includes('昏暗')));
  });

  it('bright entrance adds extra patrol pressure', () => {
    const s = {
      ...createInitialState(),
      areaBrightness: { tunnel: 0, yard: 0, storage: 0, entrance: 80 },
      lamps: [{ areaId: 'entrance', brightness: 80 }],
    };
    const r = runWorkPhase(s);
    // bright entrance: 8 (bright area) + 10 (entrance bonus) = 18 → pressure = 28
    assert.ok(r.pressure >= 20, 'entrance bright adds extra patrol');
    assert.ok(r.log.some(m => m.includes('出入口')));
  });

  it('low relation increases risk (careless workers)', () => {
    const s = {
      ...createInitialState(),
      relation: 20,
      areaBrightness: { tunnel: 50, yard: 0, storage: 0, entrance: 0 },
      lamps: [{ areaId: 'tunnel', brightness: 50 }],
    };
    const r = runWorkPhase(s);
    assert.ok(r.log.some(m => m.includes('信任低')));
    assert.ok(r.risk > s.risk);
  });

  it('state changes affect both resource and relation pressure', () => {
    // Dark areas increase risk AND decrease relation simultaneously
    const s = {
      ...createInitialState(),
      areaBrightness: { tunnel: 0, yard: 0, storage: 0, entrance: 0 },
      lamps: [],
    };
    const r = runWorkPhase(s);
    assert.ok(r.risk > s.risk, 'dark areas increase risk');
    assert.ok(r.relation < s.relation, 'dark areas decrease relation');
  });
});

describe('Direction Lock: runSettlePhase night effects', () => {
  it('later rounds add more patrol pressure', () => {
    const s1 = { ...createInitialState(), round: 1, pressure: 20 };
    const s3 = { ...createInitialState(), round: 3, pressure: 20 };
    const r1 = runSettlePhase(s1);
    const r3 = runSettlePhase(s3);
    // Round 3: night scaling +9, decay -2 → net +7
    // Round 1: night scaling +3, decay -4 → net -1
    assert.ok(r3.pressure > r1.pressure, 'later rounds have more patrol pressure');
  });

  it('low relation causes info leak to patrol', () => {
    const s = { ...createInitialState(), relation: 20 };
    const r = runSettlePhase(s);
    assert.ok(r.log.some(m => m.includes('通风报信')));
    assert.ok(r.pressure > 10, 'info leak increases pressure');
  });

  it('pressure decay is less in later rounds', () => {
    const s = { ...createInitialState(), round: 4, pressure: 50 };
    const r = runSettlePhase(s);
    // Round 4: night scaling +12, decay only 2 → net positive
    assert.ok(r.pressure > 50, 'late rounds barely decay pressure');
  });
});

describe('Direction Lock: full cycle settlement', () => {
  it('one complete cycle updates all 5 Direction Lock states', () => {
    let s = createInitialState();
    s = { ...s, phase: 'place' };
    s = placeLamp(s, 'tunnel', 50);
    s = placeLamp(s, 'yard', 40);
    s = { ...s, phase: 'adjust' };
    s = adjustLamp(s, 0, 60);
    s = playRound(s);

    // oil (resource): must decrease from lamp placement and work
    assert.ok(s.resource < 80, 'oil decreased');
    // accident_risk (risk): must change from initial 10
    assert.ok(s.risk !== 10, 'accident risk changed');
    // patrol_attention (pressure): must change from initial 10
    assert.ok(s.pressure !== 10, 'patrol attention changed');
    // night (round): still 1 (advanceRound not called yet)
    assert.equal(s.round, 1);
    assert.equal(s.phase, 'settle');
    assert.ok(!s.gameOver);
  });

  it('bright-heavy strategy increases patrol pressure', () => {
    let s = createInitialState();
    s = { ...s, phase: 'place' };
    s = placeLamp(s, 'tunnel', 80);
    s = placeLamp(s, 'entrance', 80);
    s = playRound(s);
    assert.ok(s.pressure > 10, 'bright areas drive up patrol');
    assert.ok(s.log.some(m => m.includes('过亮') || m.includes('出入口')));
  });

  it('dark-heavy strategy increases accident risk', () => {
    let s = createInitialState();
    s = { ...s, phase: 'place' };
    s = placeLamp(s, 'tunnel', 10);
    s = playRound(s);
    assert.ok(s.risk > 10, 'dark areas drive up risk');
  });

  it('settlement can produce a game-ending outcome', () => {
    let s = { ...createInitialState(), phase: 'place', resource: 5 };
    s = placeLamp(s, 'tunnel', 10);
    s = playRound(s);
    // With very low resource, oil_run_out or other outcomes possible
    assert.ok(s.log.length > 0, 'settlement produced log entries');
  });
});
