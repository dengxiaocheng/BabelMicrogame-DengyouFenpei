# TASK_BREAKDOWN: 灯油分配

## Standard Worker Bundle

1. `dengyou-fenpei-foundation`
   - lane: foundation
   - level: M
   - goal: 建立只服务「查看工区 -> 放置灯 -> 调亮度 -> 工人移动工作 -> 事故/巡查结算 -> 下一夜」的可运行骨架

2. `dengyou-fenpei-state`
   - lane: logic
   - level: M
   - goal: 实现 Direction Lock 状态的一次分配/操作结算

3. `dengyou-fenpei-content`
   - lane: content
   - level: M
   - goal: 用事件池强化「区域覆盖 + 消耗时间 + 巡查注意」

4. `dengyou-fenpei-ui`
   - lane: ui
   - level: M
   - goal: 让玩家看见核心压力、可选操作和后果反馈

5. `dengyou-fenpei-integration`
   - lane: integration
   - level: M
   - goal: 把已有 state/content/ui 接成单一主循环

6. `dengyou-fenpei-qa`
   - lane: qa
   - level: S
   - goal: 用测试和 scripted playthrough 确认方向没跑偏
