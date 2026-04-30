# ACCEPTANCE_PLAYTHROUGH: 灯油分配

## Scripted Playthrough
1. 开局显示 oil / light_coverage / accident_risk / patrol_attention / night
2. 玩家执行一次核心操作：查看工区 -> 放置灯 -> 调亮度 -> 工人移动工作 -> 事故/巡查结算 -> 下一夜
3. 系统必须反馈一个资源或身体压力变化
4. 系统必须反馈一个关系或风险变化

## Integration Verification

### Engine ↔ Content
- `src/main.ts` imports AREAS from `src/content/areas.ts` (4 areas with light descriptions)
- `src/main.ts` imports EVENTS from `src/content/events.ts` via `pickEventsByCategory` (16 events, 4 categories)
- `src/main.ts` imports text from `src/content/text.ts` (round transitions, outcomes, UI labels)
- All content flows through the engine — no inline duplicates remain

### Engine ↔ UI
- `src/ui/index.html` workPhase() matches engine: dark/dim/adequate/bright area effects, entrance bonus
- `src/ui/index.html` settlePhase() matches engine: dynamic pressure decay `max(5-round, 2)`, night scaling, relation cross-effect
- `counts()` returns all 4 light levels (dark, dim, adequate, bright)

### Playable Flow (one full round)
1. **查看工区**: 首屏显示 4 工区格、压力条、轮次过渡文本（from text.ts）
2. **放置灯**: 点击工区格放灯（默认亮度 40），消耗灯油
3. **调亮度**: +/- 按钮调整每盏灯，实时更新工区描述（from areas.ts）
4. **工人作业**: 点击确认，系统自动结算：oil 消耗、dim/adequate/bright 效果、entrance 检查、低信任惩罚
5. **事故/巡查结算**: 事件从 events.ts 选取（每类最多 1 个），night scaling、relation leak、pressure decay
6. **下一夜**: advance round, reset lamps, show transition text

### State Coupling Verification
- Each work phase produces both: survival pressure (oil, risk) AND relation pressure (trust, patrol)
- Each settle phase produces both: resource/risk changes AND relation/patrol changes
- Events from content/ are category-balanced (accident/patrol/resource/relation)

## Direction Gate
- integration worker 必须让这个流程可试玩
- qa worker 必须用测试或手工记录验证这个流程
- 如试玩要求需要偏离 Direction Lock，停止并回交 manager
