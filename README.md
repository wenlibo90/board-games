# 弈趣棋坊 · 多棋种在线对弈平台

一个**纯前端、零构建**的棋类与牌类对战平台：内置本地 AI 与新手教学，打开即玩，无需后端、无需联网。

- 桌面/移动端自适应，棋盘由 Canvas 绘制
- 人机对战，支持难度分档、悔棋、提示、认输
- 每个棋种内置「新手教学」互动课程
- 支持明/暗主题，并可按棋种定制页面皮肤，甚至整页自定义

## 棋种一览（14 款）

| 名称 | id | 简介 |
|---|---|---|
| 中国象棋 | `xiangqi` | 楚河汉界、九宫、飞将、蹩马腿、隔子炮 |
| 韩国象棋 | `janggi` | 隔子包炮且不能吃炮、用字象、士将斜行 |
| 日本将棋 | `shogi` | 升变、持驹打入、二步与打步诘 |
| 国际象棋 | `chess` | 王车易位、吃过路兵、兵升变、将杀判定 |
| 围棋 | `go` | 提子、打劫、禁着点、中国规则数子 |
| 国际跳棋 | `draughts` | 10x10、强制吃子、连吃、飞王 |
| 六角跳棋 | `chinesecheckers` | 六角星棋盘、连续跳跃、抢占对岸 |
| 五子棋 | `gomoku` | 连五获胜；含独立整页界面（13/15/19 路） |
| 黑白棋 | `reversi` | 夹子翻转、自动跳过、占角策略 |
| 斗兽棋 | `jungle` | 等级吃子、鼠象相克、虎狮跳河、兽穴取胜 |
| UNO | `uno` | 4 人；跳过/反转/+2/变色/+4 |
| 升级 / 拖拉机 | `shengji` | 四人两队、亮主、跟花色、分牌计分 |
| 掼蛋 | `guandan` | 双副牌、四人两队、比牌配合 |
| 斗地主 | `doudizhu` | 3 人、叫分抢地主、全套牌型 |

## 快速开始

项目为纯静态站点（原生 ES Modules），**无需安装依赖、无需构建**。用任意静态服务器托管即可：

```bash
python3 -m http.server 8000
```

然后访问 http://localhost:8000

> 根路径 `/` 即首页。也可以用其他静态服务器（nginx、`npx serve` 等）指向仓库根目录。

## 目录结构

```
.
├── index.html                # 唯一入口（首页 + 对局视图 + 教学视图）
├── assets/
│   ├── styles.css            # 基础样式与设计变量（明/暗主题）
│   ├── skins.css             # 按棋种定制皮肤的规则（html[data-game="<id>"]）
│   ├── gomoku-page.css       # 五子棋整页样式
│   └── gomoku-page.js        # 五子棋整页脚本（自带 AI/音效/礼花/结算弹窗）
└── src/
    ├── app.js                # 应用入口
    ├── core/                 # 与棋种无关的共享基础
    │   ├── stage.js          # Canvas 舞台（DPR、尺寸、指针事件归一化）
    │   ├── theme.js          # 明/暗主题
    │   ├── cards.js          # 扑克牌堆/洗牌
    │   └── cardgfx.js        # 牌面绘制与手牌布局/选择(HandUI)
    ├── platform/             # 平台外壳
    │   ├── shell.js          # 首页、路由(#/go 等)、通用对局外壳、侧栏生成
    │   ├── registry.js       # 棋种注册表
    │   └── tutorial.js       # 通用教学控制器
    └── games/                # 各棋种自包含模块
        ├── go/               # engine / ai / view / lessons / index
        ├── xiangqi/          # ...
        └── ...
```

## 架构与棋种契约

平台与棋种解耦：外壳只依赖统一契约，每个棋种是 `src/games/<id>/` 下自包含的一组文件。

**模块清单（`games/<id>/index.js` 默认导出）常用字段**

- 元信息：`id`、`name`、`nameEn`、`tagline`、`description`、`accent`、`art`（首页卡片 SVG）
- 渲染：`palettes`（`{light, dark}` 棋盘配色）、`createView(canvas, opts)`
- 对局：`createGame(config)`、`ai.move(game, difficulty)`、`ai.hint(game, color)`
- UI：`setup[]`（设置项）、`supports`（undo/hint/resign/pass/estimate）、`helpers[]`、`stats(game)`、`statusLine(game, ctx)`、`dotColor(game)`
- 教学：`lessons[]`、`tutorial.buildGame(lesson)`
- 牌类扩展：`buttons[]`、`onAction(game, key, view)`、`buttonEnabled(game, key)`
- 皮肤/整页：`skin`、`customPage`、`mountPage(container, { onExit })`

**游戏对象约定**：`turn`、`ended`、`result`、`moves[]`、`play(move) ⇢ {ok}`、`undo()`、`resign(color)`（围棋另有 `pass()`）。

**视图对象约定**：`render(game)`、`resize()`、`setPalette(p)`、`interactive`；可选 `setDecor`、`setHint`、`setOverlay`、`setViewer`（暗棋隐藏信息）、`getSelection`/`clearSelection`（牌类）。

## 如何新增一个棋种

1. 新建 `src/games/<id>/`，实现以下文件：
   - `engine.js`：规则引擎（状态、走法、胜负）
   - `ai.js`：AI（`move(game, difficulty)`）
   - `view.js`：`createView(canvas, { onMove, palette })`
   - `lessons.js`：教学课程与 `tutorial.buildGame`
   - `index.js`：模块清单（默认导出上述字段）
2. 在 `src/platform/registry.js` 中 `import` 并加入 `GAMES` 数组（决定首页顺序）。

外壳会自动提供：首页卡片、路由、对局外壳（设置/信息/操作/辅助面板）、教学标签与流程。

## 按棋种定制页面风格

- **皮肤（推荐）**：模块声明 `skin: '<id>'`；外壳在打开棋局时给 `<html>` 设置 `data-game="<id>"`；在 `assets/skins.css` 用 `html[data-game="<id>"] { ... }` 覆盖设计变量或组件样式即可整页换风格。棋盘配色在棋种的 `view.js` 的 `palettes` 中。
- **整页自定义**：模块声明 `customPage: true` 并提供 `mountPage(container, { onExit })`。外壳会隐藏通用棋盘/侧栏与顶栏页脚，改为渲染该棋种自带页面；离开时调用其 `destroy()`。示例见 `src/games/gomoku/`（支持 13/15/19 路）。

## 牌类扩展

- 牌堆与洗牌：`src/core/cards.js`
- 牌面绘制与手牌选择：`src/core/cardgfx.js`（`HandUI`）
- 自定义操作按钮：模块声明 `buttons: [{ key, label, tone? }]` 并实现 `onAction(game, key, view)`、可选 `buttonEnabled(game, key)`；按钮显示在右侧「操作」面板。

## 已知简化

为控制规模，部分牌类采用简化规则（接口/流程完整，规则子集）：

- **升级 / 拖拉机**：单副牌、单张墩、单局 80 分计分；暂不含对子/拖拉机与跨局升级
- **掼蛋**：双副牌组队比牌；暂不含「逢人配」（级牌万能）、进贡与跨局升级
- **斗地主**：叫分简化为 1/2/3 出价最高者当地主（全不叫则重发）
- **UNO**：自动宣告 UNO（无罚则），+4 简化处理

## 技术栈

- 原生 JavaScript（ES Modules）、HTML5 Canvas 2D
- 无第三方依赖、无构建步骤、无后端
- AI 为本地算法（极小极大/Alpha-Beta/启发式），离线可玩

## 部署

任何静态托管均可（GitHub Pages、Vercel、Netlify、Nginx 等）。由于无需构建，直接把仓库根目录作为站点根发布即可。

## 许可

本项目暂未声明开源许可证；如需开源，请补充 `LICENSE` 文件。
