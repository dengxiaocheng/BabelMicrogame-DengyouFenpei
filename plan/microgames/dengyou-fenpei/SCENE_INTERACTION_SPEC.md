# SCENE_INTERACTION_SPEC: 灯油分配

## Scene Objects

| Object | Role | Visual | Interaction |
|--------|------|--------|-------------|
| 油灯 (lamp) | 玩家放置的核心对象 | 区域内的亮度指示 | 拖放到工区 / 按钮放置 (当前实现) |
| 工区格 (area cell) | 承载灯和工人的空间 | 2×2 网格，dark/dim/ok/hot 四色边框 | 点击选择放置目标 / 调整目标 |
| 油量罐 (resource bar) | 剩余灯油的可视化 | 渐变进度条 (红→黄→绿) | 被动反馈，显示消耗 |
| 巡查注意条 (pressure bar) | 巡查压力可视化 | 渐变进度条 (绿→黄→红) | 被动反馈，显示压力累积 |
| 事故风险条 (risk bar) | 风险可视化 | 渐变进度条 (绿→黄→红) | 被动反馈 |
| 工人信任条 (relation bar) | 信任可视化 | 渐变进度条 (红→黄→绿) | 被动反馈 |

## Player Input

### Primary Input
**拖放油灯到工区并调节每盏灯亮度**

当前实现状态:
- place phase: 每个区域格内有"放置灯"按钮，点击即放置 (默认亮度 40)
- adjust phase: 每盏灯有 +/- 按钮，每次调整 ±10

待优化 (见 Suggestions):
- 拖放交互: 允许玩家从油灯池拖放到具体区域格
- 亮度滑块: 替代 +/- 按钮，允许连续调亮度

### Minimum Interaction
玩家必须在至少两个区域放灯或调亮度，让照明覆盖和巡查注意同时变化。

当前实现: 玩家可在任意数量的区域放灯，在 adjust phase 调整每盏灯亮度。2+ 区域放灯时，不同亮度级别会产生不同的 coverage + pressure 效果。

## Feedback Channels

| Channel | Trigger | Visual | Timing |
|---------|---------|--------|--------|
| 光照覆盖阴影 | 放灯/调亮度 | 区域格边框颜色变化 (dark→dim→ok→hot) | 即时 |
| oil 消耗 | placeLamp / adjustLamp (up) | 油量条缩短，log 记录 | 即时 |
| accident_risk 热区 | work phase | 风险条变化，警告横幅 (danger/critical) | work phase 结算时 |
| 巡查注意条 | bright areas / settle events | 注意条变化，警告横幅 | work/settle phase |
| 工人信任 | dark/adequate areas | 信任条变化 | work phase |
| 事件文本 | settle phase | log 区域彩色条目 (红/黄/蓝/绿) | settle phase |
| 轮次过渡 | advanceRound | 过渡卡片 (intro + tension 文本) | view phase 首次 |

## Warning Thresholds

| State | info | danger | critical |
|-------|------|--------|----------|
| resource | — | ≤30 | ≤15 或 ≤0 |
| risk | — | ≥50 | ≥80 |
| pressure | — | ≥50 | ≥80 |

## Forbidden UI

- 不允许只列出"照亮 A/B/C"按钮列表（当前实现：按钮绑在区域格上，可接受）
- 不允许做塔防波次
- 不允许纯文字选项或通用按钮列表模拟核心互动

## Acceptance Rule

- 首屏必须让玩家看到至少一个可直接操作的场景对象 ✓
- 玩家操作必须产生即时可见反馈，且反馈能追溯到 Required State ✓
- 不得只靠随机事件文本或普通选择按钮完成主循环 ✓
