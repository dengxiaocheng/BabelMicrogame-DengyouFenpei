// src/main.ts — 灯油分配 core game engine
// Serves Direction Lock core loop:
// 查看工区 -> 放置灯 -> 调亮度 -> 工人移动工作 -> 事故/巡查结算 -> 下一夜

// --- Inline content stubs (foundation; later workers will expand into src/content/) ---

export interface Area {
  id: string;
  name: string;
  baseRisk: number;
}

export const AREAS: Area[] = [
  { id: 'tunnel',   name: '坑道',   baseRisk: 40 },
  { id: 'yard',     name: '加工场', baseRisk: 25 },
  { id: 'storage',  name: '堆料区', baseRisk: 30 },
  { id: 'entrance', name: '出入口', baseRisk: 15 },
];

export interface AreaCount {
  darkAreas: number;
  dimAreas: number;
  adequateAreas: number;
  brightAreas: number;
}

export function countAreaStates(ab: Record<string, number>): AreaCount {
  let darkAreas = 0, dimAreas = 0, adequateAreas = 0, brightAreas = 0;
  for (const a of AREAS) {
    const v = ab[a.id] || 0;
    if (v < 15) darkAreas++;
    else if (v < 40) dimAreas++;
    else if (v < 75) adequateAreas++;
    else brightAreas++;
  }
  return { darkAreas, dimAreas, adequateAreas, brightAreas };
}

export type StateKey = 'resource' | 'pressure' | 'risk' | 'relation' | 'round';

export interface StateSnapshot {
  resource: number;
  pressure: number;
  risk: number;
  relation: number;
  round: number;
  darkAreas: number;
  brightAreas: number;
}

interface GameEvent {
  text: string;
  effects: { key: StateKey; delta: number }[];
}

export function pickEventsByCategory(snap: StateSnapshot): GameEvent[] {
  const events: GameEvent[] = [];
  if (snap.darkAreas >= 1 && snap.risk >= 30) {
    events.push({ text: '黑暗角落传来闷响，有工人踩空跌落。', effects: [{ key: 'risk', delta: 15 }, { key: 'relation', delta: -10 }] });
  }
  if (snap.darkAreas >= 2) {
    events.push({ text: '光照不足，加工件在暗处被磕碰损坏。', effects: [{ key: 'risk', delta: 10 }, { key: 'resource', delta: -5 }] });
  }
  if (snap.brightAreas >= 1 && snap.pressure >= 20) {
    events.push({ text: '过亮灯光引起巡查注意。', effects: [{ key: 'pressure', delta: 10 }] });
  }
  if (snap.brightAreas >= 2 && snap.pressure >= 40) {
    events.push({ text: '"这片亮得不像话。" 巡查记下了你的工号。', effects: [{ key: 'pressure', delta: 15 }, { key: 'resource', delta: -8 }] });
  }
  if (snap.resource <= 25) {
    events.push({ text: '老陈搬开板子，下面藏着一小桶灯油。"省着用。"', effects: [{ key: 'resource', delta: 20 }, { key: 'relation', delta: 5 }] });
  }
  if (snap.darkAreas === 0 && snap.relation >= 30) {
    events.push({ text: '有人低声说"灯够亮，安心"。', effects: [{ key: 'relation', delta: 10 }] });
  }
  return events;
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
  let { resource, risk, relation } = state;

  const oilUse = state.lamps.length * 2;
  resource = clamp(resource - oilUse, 0, 100);
  log.push(`工人作业。${state.lamps.length} 盏灯运行，消耗 ${oilUse} 灯油。`);

  if (c.darkAreas > 0) {
    risk = clamp(risk + c.darkAreas * 10, 0, 100);
    relation = clamp(relation - c.darkAreas * 5, 0, 100);
    log.push(`${c.darkAreas} 个区域光照不足，工人作业困难。`);
  }
  if (c.adequateAreas > 0) {
    risk = clamp(risk - c.adequateAreas * 3, 0, 100);
    relation = clamp(relation + c.adequateAreas * 2, 0, 100);
  }

  return { ...state, resource, risk, relation, log, phase: 'work' };
}

export function runSettlePhase(state: GameState): GameState {
  const snap = toSnapshot(state);
  const events = pickEventsByCategory(snap);
  const log = [...state.log];
  const vals: Record<StateKey, number> = {
    resource: state.resource, pressure: state.pressure,
    risk: state.risk, relation: state.relation, round: state.round,
  };

  for (const ev of events) {
    log.push(ev.text);
    for (const fx of ev.effects) {
      vals[fx.key] = clamp(vals[fx.key] + fx.delta, 0, 100);
    }
  }
  vals.pressure = clamp(vals.pressure - 5, 0, 100);

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
