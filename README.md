# 灯油分配

用有限灯油照亮工区 — 光照不足会事故，过亮会引来巡查。

## 试玩

**公开链接：** https://dengxiaocheng.github.io/BabelMicrogame-DengyouFenpei/

## 本地运行

```bash
# 直接用浏览器打开
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

## 测试

```bash
npm test
```

## 玩法

核心循环：查看工区 → 放置灯 → 调亮度 → 工人移动工作 → 事故/巡查结算 → 下一夜

- **灯油**：放置和调亮消耗灯油，耗尽则游戏结束
- **事故风险**：光照不足区域越多，风险越高，达到 100 游戏结束
- **巡查注意力**：过亮区域越多，巡查越警觉，达到 100 游戏结束
- **信任**：光照充足提升工人信任，信任低会增加额外风险
