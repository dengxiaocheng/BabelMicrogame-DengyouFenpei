# MINI_GDD: 灯油分配

## Scope

- runtime: web
- duration: 20min
- project_line: 灯油分配
- single_core_loop: 查看工区 -> 放置灯 -> 调亮度 -> 工人移动工作 -> 事故/巡查结算 -> 下一夜

## Core Loop
1. 执行核心循环：查看工区 -> 放置灯 -> 调亮度 -> 工人移动工作 -> 事故/巡查结算 -> 下一夜
2. 按 20 分钟节奏推进：两区照明 -> 移动工人 -> 灯油不足 -> 巡查高压夜

## State

- resource
- pressure
- risk
- relation
- round

## UI

- 只保留主界面、结果反馈、结算入口
- 不加多余菜单和后台页

## Content

- 用小型事件池支撑主循环
- 一次只验证一条 Babel 创意线

## Constraints

- 总体规模目标控制在 5000 行以内
- 单个 worker 任务必须服从 packet budget
- 如需扩线，交回 manager 重新拆
