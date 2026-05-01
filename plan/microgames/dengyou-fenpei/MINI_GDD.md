# MINI GDD: 灯油分配

## Scope

- runtime: web (single HTML file, no build step)
- duration: 20min (4 rounds)
- project_line: 灯油分配
- single_core_loop: 查看工区 -> 放置灯 -> 调亮度 -> 工人移动工作 -> 事故/巡查结算 -> 下一夜

## Core Loop

Phase pipeline: `view → place → adjust → work → settle` (per round), then `advanceRound` to next night.

1. **view**: 显示工区状态，轮次过渡文本
2. **place**: 玩家在 4 个区域中选择放置灯 (消耗 oil = brightness × 0.3)
3. **adjust**: 玩家调整每盏灯亮度 (+/- 10)，亮度变化消耗或退还 oil
4. **work** (自动): 工人作业，dark/dim/adequate/bright 区域分别影响 risk/relation/pressure
5. **settle** (自动): 事件结算，night scaling，pressure decay，relation cross-effect
6. **advanceRound**: 清空灯，进入下一夜；或触发结局

## State

| State Key | Variable | Range | Initial | Meaning |
|-----------|----------|-------|---------|---------|
| oil | resource | 0-100 | 80 | 剩余灯油 |
| light_coverage | areaBrightness + lamps | 0-100 per area | all 0 | 区域亮度覆盖 |
| accident_risk | risk | 0-100 | 10 | 事故风险 |
| patrol_attention | pressure | 0-100 | 10 | 巡查注意力 |
| night | round | 1-4+ | 1 | 当前夜次 |
| (derived) | relation | 0-100 | 50 | 工人信任 |

## Areas (4 zones)

| ID | Name | baseRisk | workerCapacity | 特殊 |
|----|------|----------|----------------|------|
| tunnel | 坑道 | 40 | 3 | — |
| yard | 加工场 | 25 | 4 | — |
| storage | 堆料区 | 30 | 2 | — |
| entrance | 出入口 | 15 | 2 | bright ≥75 额外 +10 pressure |

## Outcomes (4 endings)

| ID | Condition | Title |
|----|-----------|-------|
| accident_catastrophe | risk ≥ 100 | 事故 |
| patrol_busted | pressure ≥ 100 | 被查 |
| oil_run_out | resource ≤ 0 | 灯油耗尽 |
| survived | round > maxRounds | 熬过来了 |

## UI Structure

- 单页 HTML，暗色主题
- Phase pipeline 导航条
- 警告横幅 (critical/danger/info)
- 4 格压力条 (灯油/巡查/风险/信任)
- 2×2 区域网格，每格显示亮度+描述+操作按钮
- 灯亮度调整区 (+/- 按钮)
- 主操作按钮 (next phase)
- 事件日志 (底部滚动区)

## Content

- 16 个事件，4 类 (accident/patrol/resource/relation)
- 每类最多触发 1 个，按类别随机选取
- 4 段轮次过渡文本
- 4 种结局文本

## Constraints

- 总体规模目标控制在 5000 行以内
- 单个 worker 任务必须服从 packet budget
- 如需扩线，交回 manager 重新拆
