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
