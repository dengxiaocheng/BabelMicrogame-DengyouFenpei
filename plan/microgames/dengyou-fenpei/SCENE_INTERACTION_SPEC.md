# SCENE_INTERACTION_SPEC: 灯油分配

## Scene Objects

- 油灯
- 工区格
- 危险暗角
- 巡查路线
- 油量罐

## Player Input

- primary_input: 拖放油灯到工区并调节每盏灯亮度
- minimum_interaction: 玩家必须在至少两个区域放灯或调亮度，让照明覆盖和巡查注意同时变化

## Feedback Channels

- 光照覆盖阴影
- oil 消耗
- accident_risk 热区
- 巡查注意条

## Forbidden UI

- 不允许只列出“照亮 A/B/C”按钮
- 不允许做塔防波次

## Acceptance Rule

- 首屏必须让玩家看到至少一个可直接操作的场景对象
- 玩家操作必须产生即时可见反馈，且反馈能追溯到 Required State
- 不得只靠随机事件文本或普通选择按钮完成主循环
