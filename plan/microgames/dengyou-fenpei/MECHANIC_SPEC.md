# MECHANIC_SPEC: 灯油分配

## Primary Mechanic

- mechanic: 区域覆盖 + 消耗时间 + 巡查注意
- primary_input: 拖放油灯到工区并调节每盏灯亮度
- minimum_interaction: 玩家必须在至少两个区域放灯或调亮度，让照明覆盖和巡查注意同时变化

## Mechanic Steps

### Step 1: 查看工区 (view phase)
- 系统展示 4 个区域的当前亮度状态 (dark/dim/adequate/bright)
- 每个区域显示对应的描述文本 (来自 areas.ts lightDescriptions)
- 显示当前 resource/pressure/risk/relation/round

### Step 2: 放置灯 (place phase)
- 玩家选择一个区域，放置一盏灯 (默认亮度 40)
- 消耗: cost = brightness × 0.3
- 约束: resource ≥ cost，否则拒绝
- 结果: lamps 数组新增 {areaId, brightness}，areaBrightness 更新
- 每区域可放多盏灯，亮度叠加 (clamp 0-100)

### Step 3: 调亮度 (adjust phase)
- 玩家调整每盏灯亮度 (每次 ±10，范围 10-90)
- 消耗: diff = newBrightness × 0.3 - oldBrightness × 0.3
- diff > 0: 需要 resource ≥ diff
- diff < 0: 退还 oil (resource 增加)

### Step 4: 工人作业 (work phase — 自动)
状态结算公式:
```
oil -= lamps.length × 2                           // 运行消耗
darkAreas ≥ 1:   risk += darkAreas × 10           // 事故
                 relation -= darkAreas × 5         // 信任
dimAreas ≥ 1:    risk += dimAreas × 4
                 relation -= dimAreas × 2
adequateAreas ≥ 1: risk -= adequateAreas × 3      // 安全
                   relation += adequateAreas × 2
brightAreas ≥ 1: pressure += brightAreas × 8       // 巡查
entrance brightness ≥ 75: pressure += 10           // 出入口额外
relation < 30:   risk += 5                          // 信任低→不仔细
```

### Step 5: 事故/巡查结算 (settle phase — 自动)
- 触发事件池 (events.ts)，每类最多 1 个
- night scaling: pressure += round × 3
- relation cross-effect: relation < 25 → pressure += 8 (通风报信)
- pressure decay: pressure -= max(5 - round, 2)

### Step 6: 下一夜 (advanceRound)
- round++
- 清空 lamps 和 areaBrightness
- 检查结局: risk ≥ 100 / pressure ≥ 100 / resource ≤ 0 / round > maxRounds

## State Coupling

每次有效操作必须同时推动两类后果：

- **生存/资源/进度压力**: resource (oil消耗), risk (事故风险), round (夜次推进)
- **关系/风险/秩序压力**: pressure (巡查注意), relation (工人信任)

关键耦合:
- dark areas → risk + relation (双降)
- bright areas → pressure (单升)
- entrance bright → pressure 额外惩罚
- low relation → risk 额外 + 通风报信→pressure
- later rounds → pressure scaling ↑, decay ↓

## Not A Choice List

- 不能只展示 2-4 个文字按钮让玩家选择
- UI worker 必须把 primary input 映射到场景对象操作
- integration worker 必须让这个操作进入状态结算，而不是只写叙事反馈

## Current Implementation Contract

引擎函数签名 (src/main.ts):
- `createInitialState(): GameState` — 初始化
- `placeLamp(state, areaId, brightness): GameState` — place phase 操作
- `adjustLamp(state, index, newBrightness): GameState` — adjust phase 操作
- `runWorkPhase(state): GameState` — work phase 自动结算
- `runSettlePhase(state): GameState` — settle phase 自动结算
- `playRound(state): GameState` — work + settle 便捷函数
- `advanceRound(state): GameState` — 下一夜
- `checkOutcome(state): string | null` — 结局检测

所有函数纯函数，返回新 GameState，不修改输入。
