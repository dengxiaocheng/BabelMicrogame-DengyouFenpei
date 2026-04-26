// src/content/events.ts
// 事件池：所有事件服务于核心情绪「区域覆盖 + 消耗时间 + 巡查注意」

// --- Types ---

export type EventCategory = 'accident' | 'patrol' | 'resource' | 'relation';
export type StateKey = 'resource' | 'pressure' | 'risk' | 'relation' | 'round';

/** 当前游戏状态快照，用于判断事件触发 */
export interface StateSnapshot {
  resource: number;    // 0-100, 剩余灯油
  pressure: number;   // 0-100, 巡查注意力
  risk: number;       // 0-100, 事故风险
  relation: number;   // 0-100, 工人信任
  round: number;      // 当前夜次
  darkAreas: number;  // 光照不足的区域数
  brightAreas: number;// 过亮的区域数
}

export interface EventEffect {
  key: StateKey;
  delta: number;
}

/** 一次可触发的事件 */
export interface GameEvent {
  id: string;
  category: EventCategory;
  trigger: (state: StateSnapshot) => boolean;
  effects: EventEffect[];
  text: string;
  emotion: 'area_coverage' | 'time_consumption' | 'patrol_attention';
}

// --- Event Pool ---

export const EVENTS: GameEvent[] = [
  // ========== 事故事件：光照不足触发 ==========

  {
    id: 'worker_fall',
    category: 'accident',
    trigger: (s) => s.darkAreas >= 1 && s.risk >= 30,
    effects: [
      { key: 'risk', delta: 15 },
      { key: 'relation', delta: -10 },
    ],
    text: '黑暗的角落里传来一声闷响。有工人踩空跌落，灯油没能照到那个位置。',
    emotion: 'area_coverage',
  },
  {
    id: 'material_damage',
    category: 'accident',
    trigger: (s) => s.darkAreas >= 2,
    effects: [
      { key: 'risk', delta: 10 },
      { key: 'resource', delta: -5 },
    ],
    text: '光照不足，一批加工件在暗处被磕碰损坏。浪费的不仅是材料，还有时间。',
    emotion: 'area_coverage',
  },
  {
    id: 'tool_lost',
    category: 'accident',
    trigger: (s) => s.darkAreas >= 1 && s.resource < 40,
    effects: [
      { key: 'risk', delta: 5 },
      { key: 'relation', delta: -5 },
    ],
    text: '灯油快见底了。一个工人在昏暗中弄丢了工具，其他人停下来帮忙找。',
    emotion: 'time_consumption',
  },
  {
    id: 'worker_injured',
    category: 'accident',
    trigger: (s) => s.darkAreas >= 2 && s.risk >= 50,
    effects: [
      { key: 'risk', delta: 20 },
      { key: 'relation', delta: -15 },
      { key: 'resource', delta: -5 },
    ],
    text: '有人被倒下的支架砸伤了。如果那片区域灯再亮一点，他本可以看见。',
    emotion: 'area_coverage',
  },

  // ========== 巡查事件：过亮触发 ==========

  {
    id: 'patrol_passby',
    category: 'patrol',
    trigger: (s) => s.brightAreas >= 1 && s.pressure >= 20,
    effects: [
      { key: 'pressure', delta: 10 },
    ],
    text: '巡查的手电光扫过工区边缘。过亮的灯光引起了他们的注意。',
    emotion: 'patrol_attention',
  },
  {
    id: 'patrol_warning',
    category: 'patrol',
    trigger: (s) => s.brightAreas >= 2 && s.pressure >= 40,
    effects: [
      { key: 'pressure', delta: 15 },
      { key: 'resource', delta: -8 },
    ],
    text: '巡查走近了。"这片亮得不像话。"他们记下了你的工号，要求调低灯光。',
    emotion: 'patrol_attention',
  },
  {
    id: 'surprise_inspection',
    category: 'patrol',
    trigger: (s) => s.pressure >= 70,
    effects: [
      { key: 'pressure', delta: 20 },
      { key: 'resource', delta: -15 },
      { key: 'risk', delta: 10 },
    ],
    text: '突击检查。巡查带着表格和手电来了，一盏一盏地数你的灯。',
    emotion: 'patrol_attention',
  },
  {
    id: 'oil_confiscated',
    category: 'patrol',
    trigger: (s) => s.brightAreas >= 1 && s.pressure >= 60,
    effects: [
      { key: 'pressure', delta: 10 },
      { key: 'resource', delta: -20 },
    ],
    text: '"多余的灯油没收。"巡查拧走了你备用桶里的大半灯油。今晚要精打细算了。',
    emotion: 'time_consumption',
  },

  // ========== 资源事件：灯油状态触发 ==========

  {
    id: 'oil_leak',
    category: 'resource',
    trigger: (s) => s.resource > 20 && s.resource < 60,
    effects: [
      { key: 'resource', delta: -10 },
    ],
    text: '灯油桶底有一道裂缝。等你发现的时候，已经有不少渗进了泥土里。',
    emotion: 'time_consumption',
  },
  {
    id: 'hidden_cache',
    category: 'resource',
    trigger: (s) => s.resource <= 25,
    effects: [
      { key: 'resource', delta: 20 },
      { key: 'relation', delta: 5 },
    ],
    text: '老陈带你来到角落，搬开一块板子。下面藏着一小桶灯油。"省着用。"他说。',
    emotion: 'time_consumption',
  },
  {
    id: 'wick_burnt',
    category: 'resource',
    trigger: (s) => s.round >= 3 && s.resource < 50,
    effects: [
      { key: 'resource', delta: -8 },
      { key: 'risk', delta: 5 },
    ],
    text: '一盏灯的灯芯烧断了，火焰骤灭。换灯芯要花时间，也要花灯油。',
    emotion: 'time_consumption',
  },
  {
    id: 'borrowed_oil',
    category: 'resource',
    trigger: (s) => s.resource <= 15 && s.relation >= 40,
    effects: [
      { key: 'resource', delta: 15 },
      { key: 'relation', delta: -10 },
    ],
    text: '你向隔壁工段借了点灯油。他们给了，但脸色不好看。这笔人情不好还。',
    emotion: 'time_consumption',
  },

  // ========== 关系事件：工人信任触发 ==========

  {
    id: 'worker_thanks',
    category: 'relation',
    trigger: (s) => s.darkAreas === 0 && s.relation >= 30,
    effects: [
      { key: 'relation', delta: 10 },
    ],
    text: '工人们默默干着活，有人经过你身边时低声说了句"灯够亮，安心"。',
    emotion: 'area_coverage',
  },
  {
    id: 'worker_complaint',
    category: 'relation',
    trigger: (s) => s.darkAreas >= 1 && s.relation < 50,
    effects: [
      { key: 'relation', delta: -10 },
      { key: 'risk', delta: 5 },
    ],
    text: '"什么都看不见，怎么干活？"有工人把扳手摔在地上。不满在蔓延。',
    emotion: 'area_coverage',
  },
  {
    id: 'old_worker_advice',
    category: 'relation',
    trigger: (s) => s.relation >= 50 && s.round >= 2,
    effects: [
      { key: 'relation', delta: 5 },
      { key: 'risk', delta: -5 },
    ],
    text: '老陈看了看你的灯位，指了指坑道拐角。"那盏往左移两步，光能多照半面墙。"',
    emotion: 'area_coverage',
  },
  {
    id: 'new_worker_arrives',
    category: 'relation',
    trigger: (s) => s.round === 2 && s.relation >= 20,
    effects: [
      { key: 'relation', delta: -5 },
      { key: 'risk', delta: 5 },
    ],
    text: '一个新来的年轻人被分到你们工段。他不熟地形，需要更多光照才能安全干活。',
    emotion: 'area_coverage',
  },
];

// --- Selection Helpers ---

/** 返回所有触发条件满足的事件 */
export function getTriggeredEvents(state: StateSnapshot): GameEvent[] {
  return EVENTS.filter(e => e.trigger(state));
}

/** 每个类别最多选一个触发事件，随机选取 */
export function pickEventsByCategory(state: StateSnapshot): GameEvent[] {
  const triggered = getTriggeredEvents(state);
  const byCategory = new Map<EventCategory, GameEvent[]>();
  for (const e of triggered) {
    if (!byCategory.has(e.category)) byCategory.set(e.category, []);
    byCategory.get(e.category)!.push(e);
  }
  const result: GameEvent[] = [];
  for (const [, events] of byCategory) {
    const idx = Math.floor(Math.random() * events.length);
    result.push(events[idx]);
  }
  return result;
}
