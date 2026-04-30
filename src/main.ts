// src/main.ts — 灯油分配 core game engine
// Serves Direction Lock core loop:
// 查看工区 -> 放置灯 -> 调亮度 -> 工人移动工作 -> 事故/巡查结算 -> 下一夜

// --- Content integration (from src/content/) ---
export { AREAS, countAreaStates, getAreaLightDescription } from './content/areas.ts';
export type { Area } from './content/areas.ts';
export { pickEventsByCategory } from './content/events.ts';
export type { GameEvent, StateSnapshot } from './content/events.ts';
export {
  ROUND_TRANSITIONS, UI_TEXT, OUTCOMES,
  getRoundTransition, getOilWarning, getPressureWarning,
} from './content/text.ts';
export type { OutcomeText, RoundTransition } from './content/text.ts';

import { AREAS, countAreaStates, getAreaLightDescription } from './content/areas.ts';
import { pickEventsByCategory } from './content/events.ts';
import type { StateSnapshot, StateKey } from './content/events.ts';
import { OUTCOMES, getRoundTransition } from './content/text.ts';

// --- Integration helpers ---

export function getAreaDescription(areaId: string, brightness: number): string {
  return getAreaLightDescription(areaId, brightness);
}

export function getOutcomeDisplay(outcome: string | null) {
  if (!outcome) return null;
  return OUTCOMES.find(o => o.id === outcome) ?? null;
}

export function getRoundIntro(round: number) {
  return getRoundTransition(round);
}

// --- Engine Types ---

export type Phase = 'view' | 'place' | 'adjust' | 'work' | 'settle';

export interface Lamp {
  areaId: string;
  brightness: number; // 0–100
}

export interface GameState {
  phase: Phase;
  resource: number;   // 0–100 剩余灯油
  pressure: number;   // 0–100 巡查注意力
  risk: number;       // 0–100 事故风险
  relation: number;   // 0–100 工人信任
  round: number;
  maxRounds: number;
  lamps: Lamp[];
  areaBrightness: Record<string, number>;
  log: string[];
  gameOver: boolean;
  outcome: string | null;
}

// --- Helpers ---

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function recalcAreaBrightness(lamps: Lamp[]): Record<string, number> {
  const b: Record<string, number> = {};
  for (const a of AREAS) b[a.id] = 0;
  for (const l of lamps) b[l.areaId] = clamp((b[l.areaId] || 0) + l.brightness, 0, 100);
  return b;
}

function toSnapshot(s: GameState): StateSnapshot {
  const c = countAreaStates(s.areaBrightness);
  return {
    resource: s.resource, pressure: s.pressure,
    risk: s.risk, relation: s.relation, round: s.round,
    darkAreas: c.darkAreas, brightAreas: c.brightAreas,
  };
}

// --- Factory ---

export function createInitialState(): GameState {
  const ab: Record<string, number> = {};
  for (const a of AREAS) ab[a.id] = 0;
  return {
    phase: 'view', resource: 80, pressure: 10,
    risk: 10, relation: 50, round: 1, maxRounds: 4,
    lamps: [], areaBrightness: ab, log: [], gameOver: false, outcome: null,
  };
}

// --- Player Actions (place / adjust phases) ---

export function placeLamp(state: GameState, areaId: string, brightness: number): GameState {
  if (state.phase !== 'place') return state;
  const cost = brightness * 0.3;
  if (state.resource < cost) {
    return { ...state, log: [...state.log, '灯油不足，无法放置！'] };
  }
  const lamps = [...state.lamps, { areaId, brightness }];
  const s: GameState = { ...state, lamps, resource: clamp(state.resource - cost, 0, 100) };
  s.areaBrightness = recalcAreaBrightness(s.lamps);
  return { ...s, log: [...s.log, `在 ${areaId} 放置灯，亮度 ${brightness}`] };
}

export function adjustLamp(state: GameState, index: number, newBrightness: number): GameState {
  if (state.phase !== 'adjust' || index < 0 || index >= state.lamps.length) return state;
  const old = state.lamps[index];
  const diff = newBrightness * 0.3 - old.brightness * 0.3;
  if (diff > 0 && state.resource < diff) {
    return { ...state, log: [...state.log, '灯油不足，无法调高！'] };
  }
  const lamps = state.lamps.map((l, i) => i === index ? { ...l, brightness: newBrightness } : l);
  const s: GameState = { ...state, lamps, resource: clamp(state.resource - diff, 0, 100) };
  s.areaBrightness = recalcAreaBrightness(s.lamps);
  return { ...s, log: [...s.log, `${old.areaId} 灯亮度 ${old.brightness} → ${newBrightness}`] };
}

// --- Automated Phases ---

export function runWorkPhase(state: GameState): GameState {
  const c = countAreaStates(state.areaBrightness);
  const log = [...state.log];
  let { resource, risk, relation, pressure } = state;

  // Oil consumption: each running lamp costs oil
  const oilUse = state.lamps.length * 2;
  resource = clamp(resource - oilUse, 0, 100);
  log.push(`工人作业。${state.lamps.length} 盏灯运行，消耗 ${oilUse} 灯油。`);

  // Dark areas → accident risk + worker trust loss (survival + relation pressure)
  if (c.darkAreas > 0) {
    risk = clamp(risk + c.darkAreas * 10, 0, 100);
    relation = clamp(relation - c.darkAreas * 5, 0, 100);
    log.push(`${c.darkAreas} 个区域光照不足，工人作业困难。`);
  }

  // Dim areas → mild risk + mild trust loss
  if (c.dimAreas > 0) {
    risk = clamp(risk + c.dimAreas * 4, 0, 100);
    relation = clamp(relation - c.dimAreas * 2, 0, 100);
    log.push(`${c.dimAreas} 个区域光线昏暗，作业效率下降。`);
  }

  // Adequate areas → risk reduction + trust gain
  if (c.adequateAreas > 0) {
    risk = clamp(risk - c.adequateAreas * 3, 0, 100);
    relation = clamp(relation + c.adequateAreas * 2, 0, 100);
  }

  // Bright areas → patrol attention (resource/risk pressure AND relation pressure)
  if (c.brightAreas > 0) {
    pressure = clamp(pressure + c.brightAreas * 8, 0, 100);
    log.push(`${c.brightAreas} 个区域过亮，巡查可能注意到。`);
  }

  // Bright entrance: specifically visible to patrols from outside
  const entranceBrightness = state.areaBrightness['entrance'] || 0;
  if (entranceBrightness >= 75) {
    pressure = clamp(pressure + 10, 0, 100);
    log.push('出入口灯光过亮，远处可见，巡查极易发现。');
  }

  // Cross-pressure: low relation → careless workers → more risk
  if (relation < 30) {
    risk = clamp(risk + 5, 0, 100);
    log.push('工人信任低，作业不够仔细，事故隐患增加。');
  }

  return { ...state, resource, risk, relation, pressure, log, phase: 'work' };
}

export function runSettlePhase(state: GameState): GameState {
  const snap = toSnapshot(state);
  const events = pickEventsByCategory(snap);
  const log = [...state.log];
  const vals: Record<StateKey, number> = {
    resource: state.resource, pressure: state.pressure,
    risk: state.risk, relation: state.relation, round: state.round,
  };

  // Apply triggered events
  for (const ev of events) {
    log.push(ev.text);
    for (const fx of ev.effects) {
      vals[fx.key] = clamp(vals[fx.key] + fx.delta, 0, 100);
    }
  }

  // Night-based pressure scaling: later nights are harder
  vals.pressure = clamp(vals.pressure + state.round * 3, 0, 100);

  // Relation-pressure cross-effect: low trust → workers leak info to patrol
  if (vals.relation < 25) {
    vals.pressure = clamp(vals.pressure + 8, 0, 100);
    log.push('有工人向巡查通风报信，巡查注意力增加。');
  }

  // Natural pressure decay (less in later rounds)
  const pressureDecay = Math.max(5 - state.round, 2);
  vals.pressure = clamp(vals.pressure - pressureDecay, 0, 100);

  return {
    ...state, phase: 'settle',
    resource: vals.resource, pressure: vals.pressure,
    risk: vals.risk, relation: vals.relation, log,
  };
}

// --- Outcome ---

export function checkOutcome(s: GameState): string | null {
  if (s.risk >= 100) return 'accident_catastrophe';
  if (s.pressure >= 100) return 'patrol_busted';
  if (s.resource <= 0) return 'oil_run_out';
  if (s.round > s.maxRounds) return 'survived';
  return null;
}

// --- Round ---

export function advanceRound(state: GameState): GameState {
  const round = state.round + 1;
  const outcome = checkOutcome({ ...state, round });
  if (outcome) return { ...state, round, gameOver: true, outcome };

  const ab: Record<string, number> = {};
  for (const a of AREAS) ab[a.id] = 0;
  return { ...state, round, phase: 'view', lamps: [], areaBrightness: ab };
}

// --- Convenience: full settle sequence (work + settle in one call) ---

export function playRound(state: GameState): GameState {
  let s = runWorkPhase(state);
  s = runSettlePhase(s);
  const outcome = checkOutcome(s);
  if (outcome) return { ...s, gameOver: true, outcome };
  return s;
}
