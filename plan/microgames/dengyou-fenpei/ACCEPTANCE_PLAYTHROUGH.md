# ACCEPTANCE_PLAYTHROUGH: 灯油分配

## 最小可试玩脚本

以下脚本必须从 `src/ui/index.html` 在浏览器中完整执行，或从 `src/main.ts` 通过函数调用逐步复现。

### Path 1: Balanced Survival (目标结局: survived)

```
Round 1:
  1. 开局显示: resource=80, pressure=10, risk=10, relation=50, round=1
  2. [view] 看到轮次过渡文本 "夜色降临..."
  3. [place] 在 tunnel 放灯 (brightness 50, cost 15)
     → 确认: resource 降至 65, areaBrightness.tunnel = 50
  4. [place] 在 yard 放灯 (brightness 50, cost 15)
     → 确认: resource 降至 50, areaBrightness.yard = 50
  5. [place] 在 storage 放灯 (brightness 40, cost 12)
     → 确认: resource 降至 38, areaBrightness.storage = 40
  6. [adjust] 调 tunnel 灯亮度 50→60 (cost +3)
     → 确认: resource 降至 35
  7. [confirm] → work phase 自动运行
     → 确认: oil 消耗 (3 盏灯 × 2 = 6), risk 变化, pressure 变化
  8. [settle] → 事件触发, night scaling, pressure decay
  9. [下一夜] → round 2, lamps 清空

Round 2:
  10. [place] 在 tunnel 放灯 (brightness 50)
  11. [place] 在 yard 放灯 (brightness 50)
  12. [place] 在 entrance 放灯 (brightness 30)
  13. [adjust] 调整任意一盏灯
  14. [confirm] → work + settle
  15. [下一夜] → round 3

Round 3:
  16. [place] 在 tunnel 放灯 (brightness 40)
  17. [place] 在 yard 放灯 (brightness 40)
  18. [confirm] → work + settle
  19. [下一夜] → round 4

Round 4:
  20. [place] 在 tunnel 放灯 (brightness 30)
  21. [place] 在 yard 放灯 (brightness 30)
  22. [confirm] → work + settle
  23. [下一夜] → round 5 → 检查结局

结局: survived (round > maxRounds=4)
```

### Path 2: All-Dark Failure (目标结局: accident_catastrophe)

```
Round 1:
  1. [view] 看到初始状态
  2. [place] 不放灯 (或放一盏 brightness 10)
  3. [confirm] → work: darkAreas=3-4, risk += 30-40
  4. [settle] → 事件: worker_fall/material_damage
  5. [下一夜] → round 2

Round 2:
  6. 继续不放灯 (或极低亮度)
  7. [confirm] → risk 继续累积
  8. [settle] → risk 接近 100

Round 3 或之前:
  9. risk ≥ 100 → 结局: accident_catastrophe
```

### Path 3: All-Bright Failure (目标结局: patrol_busted)

```
Round 1:
  1. [place] 在 tunnel 放灯 (brightness 80)
  2. [place] 在 yard 放灯 (brightness 80)
  3. [place] 在 entrance 放灯 (brightness 80)
  4. [place] 在 storage 放灯 (brightness 80)
  5. [confirm] → work: brightAreas=4, pressure += 32 + entrance bonus
  6. [settle] → 事件: patrol_passby/patrol_warning

Round 2-3:
  7. 重复全亮策略
  8. pressure 累积至 ≥ 100 → 结局: patrol_busted
```

### Path 4: Oil Depletion (目标结局: oil_run_out)

```
Round 1:
  1. [place] 在 4 个区域各放高亮度灯 (brightness 80-90)
  2. [confirm] → 高消耗 (4 × 80 × 0.3 = 96, 加上 work phase 消耗)
  3. resource 可能直接降至 0 → 结局: oil_run_out
  或需 Round 2 才耗尽
```

## Direction Gate

- integration worker 必须让 Path 1 的流程可试玩 ✓ (已完成)
- qa worker 必须用测试或手工记录验证此流程 ✓ (已完成, 45 tests)
- 如试玩要求需要偏离 Direction Lock，停止并回交 manager

## Verification Checklist

执行 worker 验收时必须逐项确认:

- [ ] 开局显示全部 5 个 Required State (oil, light_coverage, accident_risk, patrol_attention, night)
- [ ] 玩家可以在至少 2 个区域放置灯
- [ ] 放置灯产生即时 oil 消耗反馈
- [ ] 调亮度产生即时 oil 消耗/退还反馈
- [ ] work phase 结算后 risk/pressure/relation 有变化
- [ ] settle phase 触发至少 1 个事件
- [ ] 4 种结局均可通过明确策略触发
- [ ] 操作反馈可追溯到 Required State (log 条目关联 state key)
- [ ] 不是 choice-only: 操作绑定在场景对象上，不是纯文字按钮列表
