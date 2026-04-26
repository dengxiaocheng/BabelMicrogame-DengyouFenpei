// src/content/text.ts
// UI 文本、轮次过渡、结算文案

// --- Round Transitions ---

export interface RoundTransition {
  round: number;
  intro: string;
  tension: string;
}

export const ROUND_TRANSITIONS: RoundTransition[] = [
  {
    round: 1,
    intro: '夜色降临，工区的灯光是唯一的安全线。',
    tension: '灯油充足，但经验告诉你，它消耗得比你想象的快。',
  },
  {
    round: 2,
    intro: '第二个夜晚。你开始了解这些工人的习惯。',
    tension: '灯油少了些许，巡查今晚可能会路过。',
  },
  {
    round: 3,
    intro: '第三个夜晚。你已经清楚每盏灯的位置和它的代价。',
    tension: '灯油告急。巡查的频率在增加。每一步都不能错。',
  },
  {
    round: 4,
    intro: '最后一夜。天快亮了，但这也是最难的一夜。',
    tension: '灯油所剩无几，巡查随时可能突击检查。撑过去就是胜利。',
  },
];

// --- UI Labels ---

export const UI_TEXT = {
  phase: {
    view: '查看工区',
    place: '放置灯',
    adjust: '调亮度',
    work: '工人作业',
    settle: '结算',
  },
  resources: {
    oil: '灯油',
    oilLow: '灯油告急',
    oilEmpty: '灯油耗尽',
  },
  pressure: {
    patrol: '巡查注意力',
    patrolLow: '巡查未注意',
    patrolHigh: '巡查高度警觉',
    patrolMax: '巡查即将突击',
  },
  risk: {
    accident: '事故风险',
    accidentLow: '安全',
    accidentHigh: '危险',
    accidentMax: '即将出事',
  },
  relation: {
    workerTrust: '工人信任',
    workerLow: '工人不满',
    workerHigh: '工人信赖',
  },
  actions: {
    placeLamp: '放置灯',
    adjustBrightness: '调亮度',
    moveLamp: '移动灯',
    confirmRound: '确认本夜安排',
    nextNight: '下一夜',
  },
  feedback: {
    lampPlaced: '灯已放置',
    brightnessAdjusted: '亮度已调整',
    notEnoughOil: '灯油不足',
    areaCovered: '区域已被照亮',
    areaDark: '区域光照不足',
    areaTooBright: '区域过亮，巡查可能注意到',
    workersReady: '工人准备就绪',
    workersHesitant: '工人们在犹豫，光照不够',
  },
} as const;

// --- Outcomes ---

export interface OutcomeText {
  id: string;
  condition: string;
  title: string;
  description: string;
}

export const OUTCOMES: OutcomeText[] = [
  {
    id: 'survived',
    condition: '完成所有轮次且未被淘汰',
    title: '熬过来了',
    description: '天亮了。灯油刚好用完，但每个工人都平安。你把空油桶放回角落，靠在墙上闭上了眼。',
  },
  {
    id: 'accident_catastrophe',
    condition: '事故风险达到上限',
    title: '事故',
    description: '黑暗中传来惨叫。工人被抬出去的时候，你甚至看不清他们的脸。灯油还剩小半桶，但已经没有意义了。',
  },
  {
    id: 'patrol_busted',
    condition: '巡查注意力达到上限',
    title: '被查',
    description: '巡查封了你的工区。灯被一盏盏熄灭，灯油被没收。工人们在黑暗中沉默地站着。',
  },
  {
    id: 'oil_run_out',
    condition: '灯油耗尽',
    title: '灯油耗尽',
    description: '最后一滴灯油烧干了。黑暗重新吞没了工区。你能做的都做了，接下来只能听天由命。',
  },
];

// --- Helpers ---

/** 获取指定轮次的过渡文本 */
export function getRoundTransition(round: number): RoundTransition | null {
  return ROUND_TRANSITIONS.find(r => r.round === round) ?? null;
}

/** 根据 resource 值返回灯油警告文本 */
export function getOilWarning(resource: number): string {
  if (resource <= 0) return UI_TEXT.resources.oilEmpty;
  if (resource <= 20) return UI_TEXT.resources.oilLow;
  return '';
}

/** 根据 pressure 值返回巡查警告文本 */
export function getPressureWarning(pressure: number): string {
  if (pressure >= 80) return UI_TEXT.pressure.patrolMax;
  if (pressure >= 50) return UI_TEXT.pressure.patrolHigh;
  if (pressure >= 20) return UI_TEXT.pressure.patrol;
  return UI_TEXT.pressure.patrolLow;
}
