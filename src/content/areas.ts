// src/content/areas.ts
// 工区定义：4 个区域，每个区域有不同亮度下的描述

export type LightLevel = 'dark' | 'dim' | 'adequate' | 'bright';

export interface Area {
  id: string;
  name: string;
  description: string;
  baseRisk: number;       // 基础事故风险 (0-100)
  workerCapacity: number; // 可容纳工人数
  lightDescriptions: Record<LightLevel, string>;
}

export const AREAS: Area[] = [
  {
    id: 'tunnel',
    name: '坑道',
    description: '深而窄的地下通道，两侧是粗糙的岩壁。',
    baseRisk: 40,
    workerCapacity: 3,
    lightDescriptions: {
      dark: '坑道完全沉入黑暗，只能听到水滴声和远处不明的响动。',
      dim: '微弱的光勉强照亮脚下的路面，两壁的阴影仍然深重。',
      adequate: '灯光明亮稳定，坑道的每个角落都被照到，工人可以安全行走。',
      bright: '坑道被照得通亮，光芒从入口向外溢出，远处也能看见。',
    },
  },
  {
    id: 'yard',
    name: '加工场',
    description: '开阔的半露天场地，堆满了需要处理的材料。',
    baseRisk: 25,
    workerCapacity: 4,
    lightDescriptions: {
      dark: '加工场漆黑一片，材料和工具混在暗处，分不清哪是哪。',
      dim: '昏暗的灯光下，只能看到最近几件材料的轮廓。',
      adequate: '光线足够辨认材料和处理工具，工人可以正常作业。',
      bright: '整个加工场灯火通明，连远处的围栏都被照亮了。',
    },
  },
  {
    id: 'storage',
    name: '堆料区',
    description: '堆放着原材料和成品的区域，通道狭窄。',
    baseRisk: 30,
    workerCapacity: 2,
    lightDescriptions: {
      dark: '堆料区完全没入黑暗，堆积物之间形成看不见的缝隙和死角。',
      dim: '勉强能看到主要通道，但堆积物背后仍有大片阴影。',
      adequate: '灯光覆盖了主要通道和堆放区，工人可以辨认路径。',
      bright: '堆料区被全面照亮，连最深处的角落也没有阴影。',
    },
  },
  {
    id: 'entrance',
    name: '出入口',
    description: '工区与外界的连接点，巡查最容易注意到的位置。',
    baseRisk: 15,
    workerCapacity: 2,
    lightDescriptions: {
      dark: '出入口一片漆黑，几乎找不到方向。好处是巡查也看不到这里。',
      dim: '微光勾勒出出入口的轮廓，刚好够辨认方向。',
      adequate: '出入口被清晰地照亮，进出的工人不必摸索。',
      bright: '明亮的灯光从出入口向外扩散，远处一眼就能看到这片光亮。',
    },
  },
];

// --- Helpers ---

function brightnessToLevel(brightness: number): LightLevel {
  if (brightness < 15) return 'dark';
  if (brightness < 40) return 'dim';
  if (brightness < 75) return 'adequate';
  return 'bright';
}

/** 获取指定区域在给定亮度下的描述文本 */
export function getAreaLightDescription(areaId: string, brightness: number): string {
  const area = AREAS.find(a => a.id === areaId);
  if (!area) return '';
  return area.lightDescriptions[brightnessToLevel(brightness)];
}

/** 统计各亮度级别的区域数量 */
export function countAreaStates(areaBrightness: Record<string, number>): {
  darkAreas: number;
  brightAreas: number;
  adequateAreas: number;
  dimAreas: number;
} {
  let dark = 0, bright = 0, adequate = 0, dim = 0;
  for (const b of Object.values(areaBrightness)) {
    const level = brightnessToLevel(b);
    if (level === 'dark') dark++;
    else if (level === 'dim') dim++;
    else if (level === 'bright') bright++;
    else adequate++;
  }
  return { darkAreas: dark, brightAreas: bright, adequateAreas: adequate, dimAreas: dim };
}
