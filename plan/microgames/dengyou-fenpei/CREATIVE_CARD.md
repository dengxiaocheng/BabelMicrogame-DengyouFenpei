# CREATIVE_CARD: 灯油分配

- slug: `dengyou-fenpei`
- creative_line: 灯油分配
- target_runtime: web
- target_minutes: 20
- core_emotion: 区域覆盖 + 消耗时间 + 巡查注意
- core_loop: 查看工区 -> 放置灯 -> 调亮度 -> 工人移动工作 -> 事故/巡查结算 -> 下一夜
- failure_condition: 关键状态崩溃，或在本轮主循环中被系统淘汰
- success_condition: 在限定时长内完成主循环，并稳定进入至少一个可结算结局

## Intent

- 做一个 Babel 相关的单创意线微游戏
- 只保留一个主循环，不扩成大项目
- 让 Claude worker 能按固定 packet 稳定并行
