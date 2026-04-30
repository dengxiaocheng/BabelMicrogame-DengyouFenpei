# MECHANIC_SPEC: 灯油分配

## Primary Mechanic

- mechanic: 区域覆盖 + 消耗时间 + 巡查注意
- primary_input: 拖放油灯到工区并调节每盏灯亮度
- minimum_interaction: 玩家必须在至少两个区域放灯或调亮度，让照明覆盖和巡查注意同时变化

## Mechanic Steps

1. 观察工区危险度
2. 放置或移动油灯
3. 调节亮度消耗 oil
4. 结算事故风险和 patrol_attention

## State Coupling

每次有效操作必须同时推动两类后果：

- 生存/资源/进度压力：从 Required State 中选择至少一个直接变化
- 关系/风险/秩序压力：从 Required State 中选择至少一个直接变化

## Not A Choice List

- 不能只展示 2-4 个文字按钮让玩家选择
- UI worker 必须把 primary input 映射到场景对象操作
- integration worker 必须让这个操作进入状态结算，而不是只写叙事反馈
