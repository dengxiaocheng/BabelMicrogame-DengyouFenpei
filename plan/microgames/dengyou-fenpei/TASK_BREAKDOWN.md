# TASK_BREAKDOWN: 灯油分配

## Completed Workers

| # | Worker ID | Lane | Status | Deliverable |
|---|-----------|------|--------|-------------|
| 1 | `dengyou-fenpei-foundation` | foundation | DONE | src/main.ts 核心引擎骨架 |
| 2 | `dengyou-fenpei-state` | logic | DONE | Direction Lock 状态耦合 (合入 main.ts) |
| 3 | `dengyou-fenpei-content` | content | DONE | src/content/ (areas.ts, events.ts, text.ts) |
| 4 | `dengyou-fenpei-ui` | ui | DONE | src/ui/index.html 可玩界面 |
| 5 | `dengyou-fenpei-integration` | integration | DONE | content 接入引擎，UI 逻辑同步 |
| 6 | `dengyou-fenpei-qa` | qa | DONE | 45 tests passing，4 结局验证 |

## Remaining Work

The game core loop is fully implemented and playable. The following packages address remaining gaps between the current button-based interaction and the Direction Lock's "拖放油灯" primary input spec.

---

### Package A: `dengyou-fenpei-drag-interaction`

- **lane**: ui-polish
- **level**: S
- **goal**: 将 place/adjust phase 的按钮交互升级为拖放 + 滑块交互，落实 primary input "拖放油灯到工区并调节每盏灯亮度"
- **服务 primary input**: 直接实现 Direction Lock 定义的拖放操作
- **服务核心循环**: 强化 place 和 adjust phase 的场景对象操作感

**具体目标**:
1. place phase: 添加拖放交互 — 玩家从灯池拖一盏灯到区域格上
2. adjust phase: 为每盏灯添加亮度滑块 (range input)，替代 +/- 按钮
3. 拖放和滑块必须仍然调用 doPlace/doAdj 函数，保持状态结算不变
4. 保留按钮作为 fallback (touchscreen 兼容)

**验收标准**:
- 玩家可以通过拖放将灯放到至少 2 个不同区域
- 玩家可以通过滑块调整每盏灯亮度
- 拖放/滑块操作产生的状态变化与按钮操作完全一致
- 在 src/test.ts 中无需新增测试 (纯 UI 交互层)
- 45 existing tests 仍然全部通过

**禁止跑偏**:
- 不修改 src/main.ts 引擎逻辑
- 不修改 src/content/ 内容数据
- 不添加新游戏机制
- 不做拖放动画特效（保持最小实现）

**文件范围**: src/ui/index.html (主要), 最多 1 个新文件 (如需独立 drag logic)

---

### Package B: `dengyou-fenpei-visual-feedback`

- **lane**: ui-polish
- **level**: S
- **goal**: 强化区域格的光照视觉反馈，让 coverage 和 patrol_attention 变化更直观
- **服务 primary input**: 让每次拖放/调亮度的即时反馈更清晰
- **服务核心循环**: 强化 view → place → adjust 的信息获取

**具体目标**:
1. 区域格添加光照范围可视化 (CSS radial-gradient 或 SVG 光圈)
2. 过亮区域添加巡查视线指示 (闪烁边框或巡查路线箭头)
3. place phase 显示预计消耗和状态预览
4. 确认所有反馈可追溯到 Required State

**验收标准**:
- 每次放灯/调亮度后，区域格有即时视觉变化
- 过亮区域有明显的巡查警示标记
- 油量条/风险条/巡查条变化有动画过渡
- 无新增游戏逻辑

**禁止跑偏**:
- 不修改引擎逻辑
- 不添加动画系统或粒子效果
- 不引入外部 CSS 框架

**文件范围**: src/ui/index.html (仅 CSS + 渲染逻辑)

---

### Package C: `dengyou-fenpei-tuning`

- **lane**: balance
- **level**: S
- **goal**: 调节数值参数，确保 balanced strategy 可以稳定到达 survived 结局
- **服务 primary input**: 让 primary input 的操作有意义的选择空间
- **服务核心循环**: 确保 4 夜节奏感 (两区照明→移动工人→灯油不足→巡查高压)

**具体目标**:
1. 验证当前参数下，balanced lighting (3 areas × 50 brightness) 是否能在 4 轮后存活
2. 如不能，调整: 初始 resource、消耗系数、pressure scaling、risk 系数等
3. 确保 4 种结局都能通过明确策略触发:
   - all-dark → accident_catastrophe
   - all-bright → patrol_busted
   - careless spending → oil_run_out
   - balanced → survived
4. 更新 src/test.ts 中受影响的测试期望值

**验收标准**:
- balanced 策略 (3 areas × 50) 在 10 次 playRound 中 ≥ 7 次到达 survived
- all-dark 策略在 ≤ 3 轮内触发 accident_catastrophe
- all-bright 策略在 ≤ 3 轮内触发 patrol_busted
- 所有 45+ tests 通过

**禁止跑偏**:
- 不改变核心循环结构
- 不添加新状态或新结局
- 不改变事件触发机制
- 只调节数值参数

**文件范围**: src/main.ts (数值参数), src/content/events.ts (事件 delta), src/test.ts (期望值)

---

## Execution Order

A 和 B 互相独立，可并行。C 依赖 A/B 完成后的实际 UI 验证，建议最后执行。

```
A: drag-interaction ──┐
                      ├── C: tuning
B: visual-feedback ───┘
```

## Worker 读取指引

每个执行 worker 必须:
1. 先读 DIRECTION_LOCK.md 了解方向约束
2. 再读本文件找到自己的 Package
3. 读 MECHANIC_SPEC.md 了解状态耦合公式
4. 读 SCENE_INTERACTION_SPEC.md 了解交互要求
5. 读 src/main.ts 和 src/ui/index.html 了解当前实现
6. **不得**依赖任何 worker report 或聊天上下文
