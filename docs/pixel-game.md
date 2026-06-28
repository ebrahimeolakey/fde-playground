# 「摸需求」像素办公室 — Smallville 级技术方案

> FDE 货代擂台的 **Phase 1（摸需求）** 做成一个**斯坦福小镇（Generative Agents / Smallville）级精致度**的像素办公室：玩家在办公室里走动、靠近/点击 4 个 NPC 同事（老板/主管/业务员/跟单员）跟他们对话，每个 NPC 背后是 DeepSeek 人设。要的是**"看起来做了一两个月"**的质感，**不是** DOM/CSS 糊的简单效果。
> 定位：这是 spec Phase 1 的门面；**对话引擎+采集后端不变**（引擎只渲染+寻路+上报交互，对话/LLM/采集留在 React+/api/chat+Supabase）。Phase 2（搭 MVP 交 repo）不在游戏里，用 `session_id` 串。
> 本文取代早先的 react-konva/DOM-CSS 低保真版（那个做不出"绕家具平滑行走/走到桌后/相机缩放"，达不到 owner 要的精致度）。最后核对：2026-06-28。

---

## 1. 一句话方案
**以 a16z `ai-town`（PixiJS + React，MIT）的渲染层为蓝本，在我们自己的 Next.js 工程里搭，砍掉它的 Convex 多人模拟，接 DeepSeek + Supabase。** 精致感（地图/相机/平滑寻路行走/头顶气泡/分方向动画）可 ~70% 照搬 ai-town 的 React 组件；"点 NPC → DeepSeek 流式 → Supabase 落库"100% 自己写。诚实估时 **6–9 个 AI 辅助 build-day**（不是早先的 2 天）。

---

## 2. 斯坦福小镇到底怎么做的（两个项目对比）

| 维度 | Stanford `generative_agents` | a16z `ai-town`（**我们抄这个**） |
|---|---|---|
| 渲染 | Phaser 3.55.2（CDN script，无打包）`pixelArt:true` | **PixiJS 7.2.4 + @pixi/react 7.1.0**（声明式 React 组件），Vite |
| 框架 | 无前端框架 + Django 2.2 只渲模板 | **React 18.2.0**（锁 18）+ Tailwind |
| 地图 | Tiled 手绘 `the_ville` 140×100@32px，导出 JSON | 自定义数组 `data/gentle.js`（bg/objectTiles）+ 浏览器关卡编辑器 `src/editor`（`npm run le`） |
| 深度排序 | **真深度** 前景层 `setDepth(2)`，角色走到树/桌后 | **没做**（只靠 paint order）→ 办公室要我们自己补 y→zIndex |
| 角色行走 | 后端 Python A* 算 tile 路径，前端逐格插值滑动 | 服务端 A*（`convex/aiTown/movement.ts` MinHeap）+ **历史缓冲滞后回放**（1Hz 数据喂 60fps 顺滑）|
| 角色素材 | 每 NPC 一张 96×128 PNG + **共用一份 `atlas.json`**（只换 PNG） | 共享表 `32x32folk.png`，帧映射 `data/spritesheets/*.ts` |
| 后端/LLM | 离线 Python 进程 + **磁盘 JSON 文件交换**；**对话是预计算 agent-对-agent、只读**（没有点击回复！）| **Convex**（DB+模拟一体）；`convex/util/llm.ts` **已内置 OpenAI 兼容 custom provider**；对话采集已内建 `convex/messages.ts` |
| 授权 | 代码 Apache 2.0；**美术付费第三方禁再分发** | **代码 MIT**（可商用 fork）；美术是奇幻森林、本就要全换 |

**为什么不 fork 斯坦福原版**：Django+Phaser+磁盘文件交换的形态跟我们栈不搭；更致命的是它的对话**根本不是交互式**（预计算、只展示），我们要的「点 NPC 它回你」它没有。

### 「精致感/月感」来自哪几样（owner 真正要的，按贡献排序）
1. **平滑寻路行走**（最关键）：A* 绕开家具/墙 + 插值滑动。不瞬移、不抖、会绕路——这一项就把简单 demo 和"做了俩月"拉开。
2. **相机系统**：`pixi-viewport` 拖拽/滚轮缩放/惯性/边界钳制 + 出场推近。
3. **多层 tilemap + 深度排序**：角色走到桌子/绿植/隔断**后面**。
4. **头顶气泡**：💭思考/💬说话/emoji 状态，每帧跟随头顶。
5. **分方向行走动画**：3–4 帧分方向循环，只在移动时播，停下朝向最后方向。
6. **统一调色 + 像素锐利**：`SCALE_MODES.NEAREST`，一致美术包。
7. **环境氛围**：动态精灵（闪烁显示器/咖啡热气）、时钟、像素 UI 皮肤 + 位图字。

> 一句话：**月感 ≈ 平滑寻路行走 + 相机 + 深度 tilemap + 头顶气泡 + 分方向动画 + 统一像素美术。LLM 一行都不贡献"精致感"，只贡献"对话内容"。**

---

## 3. 推荐路线 + reuse/砍/换

**判断：路线 (b) —— 基于 `@pixi/react` 在我们 Next.js 工程里自建，把 ai-town 的渲染组件整段抄过来；不 git clone 它的 Convex 工程。**（路线 (a) fork ai-town 改造见 §7，因 Convex 拔牙痛 + 长期维护负担，不推荐。）

### Reuse 什么（直接抄/照搬模式，文件见 §9）
- **相机** `PixiViewport.tsx`（`.drag().pinch().wheel().decelerate().clamp()` + 出场 `animate` 推近）——几乎与 Convex 无关，整体搬。
- **地图渲染** `PixiStaticMap.tsx`（把 tileset BaseTexture 按 `tileDim` 切成 `PIXI.Texture` 再 blit）。⚠️ 它 import 了 `convex/aiTown/worldMap` 的类型，搬来要**剥成本地纯 TS 类型**。
- **角色** `Character.tsx`（`PIXI.Spritesheet` + `<AnimatedSprite>` + orientation→方向 + 头顶气泡 + 高亮）——照搬。
- **A\* 寻路** `convex/aiTown/movement.ts` + `util/minheap.ts` + `util/geometry.ts`——**移植到浏览器纯函数**（去掉 Convex IO，只留算法 + 我们的碰撞网格）。这是"绕家具"的来源。
- **对话 UI** `Messages.tsx`/`MessageInput.tsx`/`PlayerDetails.tsx`——作 React 覆盖层蓝本。
- **persona prompt** `convex/agent/conversation.ts`（identity+plan+history 拼 system）——搬进我们 Route Handler。
- **DeepSeek 接入** `convex/util/llm.ts`：**已确认内置 `custom` provider**（`LLM_API_URL`/`LLM_MODEL`/`LLM_API_KEY`，POST `${url}/v1/chat/completions`，带 SSE 流式 + stop words + 重试）——改 baseURL=`https://api.deepseek.com`、model=`deepseek-chat` 即可。
- **地图工作流** `data/convertMap.js`（Tiled→数组）+ 关卡编辑器 `src/editor`（`npm run le`）——产出我们的办公室地图。
- **NPC 定义模式** `data/characters.ts` 的 `Descriptions[]`（name/character/identity/plan）——4 个货代 persona 写这。

### 砍什么（彻底删）
- **整个 Convex**（`convex/engine/*`、`aiTown/game.ts`、`inputs` 队列、单文档 world、`runStep` 自调度、`generationNumber`、心跳/cron）。

> **什么是 Convex、为什么不用？**
> Convex 是一个 TypeScript 的「响应式后端即服务」——把*数据库 + 服务端函数 + 实时同步*打包成一个东西：你写查询函数、前端 `useQuery` 订阅，数据一变所有订阅组件自动重渲染（不用自己接 websocket/轮询）。粗略理解为「TS 版、带实时响应的 Firebase」。
> **在 ai-town 里 Convex 不只是数据库，是整个"多 agent 模拟引擎运行时"**：自主世界（agent 思考/走动/互聊）跑在 Convex 定时函数上（`runStep` 每 tick 自调度、世界状态一个大文档 + `inputs` 队列、`generationNumber` 防并发）。即它同时是游戏主循环 + DB + 多端实时同步，耦合很深。
> **我们不用，四个原因**：① 跟已锁的 Supabase 重复（再塞一个后端+数据库 = 两个真相源、两套运维）；② 它的价值是"实时/多端/响应式"，而我们是**单人**、4 个 NPC 钉在工位不自主活动——响应式实时引擎用不上，普通 请求/响应 + Supabase 写一行就够；③ 它正是我们要砍的"自主多 agent 模拟"所依赖的运行时，砍了模拟、留 Convex 就是硬扛一套随后要掏空的引擎；④ 迁移成本换不来收益，Postgres/Supabase 本就最适合存 transcript/session/dossier。**不是 Convex 不好（它对 ai-town 那种实时多 agent 沙盒很优雅），是不适配我们这个单人采集场景。** 所以我们只抄 ai-town 跟 Convex 无关的渲染层。
- **多 agent 自主模拟**：我们 NPC 是坐班的，不自己乱逛互聊。
- **memory / 向量 RAG**（`agent/memory.ts`、`embeddingsCache.ts`）——**DeepSeek 没有 embeddings 端点**，v1 拆掉；4 个 NPC 只需"自己 persona + 当前这场 transcript"。
- **Clerk 认证、Replicate 音乐/角色生成、@pixi/sound**——v1 不要。
- **平滑回放历史缓冲**（`historicalObject.ts`/`useHistoricalValue.ts`）——那是为 1Hz 服务端→60fps；我们纯客户端移动，直接 tween/插值更简单（思路可借鉴，不必照抄）。

### 换什么
- 后端：Convex → **Next.js Route Handler**（调 DeepSeek）+ **Supabase Postgres** 落库。
- 状态：响应式 `useQuery` → **客户端本地状态**（玩家位置、NPC 固定坐标）+ 对话存 Supabase。
- 美术：奇幻森林 → **办公室像素美术**（§5）。
- 移动：服务端 RTS 走位 → **纯客户端**（点击/靠近 → 浏览器内 A* + tween-to-tile）。

> 架构：`Next.js page → dynamic(ssr:false) 加载 Pixi Scene（Viewport+StaticMap+4×Character+1×Player）→ 客户端 A* 走位 → 靠近/点 NPC → emit 事件 → React 对话覆盖层 → /api/chat 流式 DeepSeek → 每轮写 Supabase SessionDossier`

---

## 4. 架构边界（命门，对 Pixi 同样适用）
**不管多精致，引擎只干三件事：渲染 + 寻路 + 上报交互事件。对话/LLM/采集永远在 React 层和后端。**
- Pixi Scene **不调 DeepSeek、不写 Supabase**；只画地图/角色、跑 A* 走位、检测"玩家靠近/点了哪个 NPC"，`emit onApproachNPC(npcId)` 给 React。
- React 覆盖层接事件 → 开对话面板 → 调 `/api/chat` Route Handler → DeepSeek 流式（照搬 `llm.ts` SSE 解析）→ token 流式渲染。**流式 append 本身即打字机，别加 typewriter 库**（跟流式打架、CJK 断字抖）。
- **每轮对话写 Supabase SessionDossier**：表 `sessions(id, session_id, npc_id, started_at)` + `messages(session_id, npc_id, role, content, ts)`（字段语义直接抄 `convex/messages.ts`）。
- 这条边界让 Pixi 成为**可替换的皮**：换引擎/换 2.5D，对话与采集零改；评分/复盘只依赖 Supabase transcript，与渲染解耦。

---

## 5. 中文像素字体（硬约束，不变）
游戏对话全中文，而 Press Start 2P/Silkscreen **没有 CJK**。**用 Fusion Pixel「缝合像素」12px 比例版（SIL OFL，商用免费，署名），`pyftsubset` 子集到常用 ~3500 字 + 拉丁 → WOFF2，`font-display:swap`。** 备选 Ark Pixel「方舟像素」。**避开 Zpix「最像素」（商用需付费授权）。**
- Fusion Pixel https://github.com/TakWolf/fusion-pixel-font ｜ Ark Pixel https://github.com/TakWolf/ark-pixel-font
- 性能坑：完整 pan-CJK WOFF2 数 MB，必子集化；LLM 自由文本无法完美预子集，罕见字回落系统字体。

---

## 6. 素材（办公室 + 4 NPC）
**两家的美术都不沿用**（斯坦福是 PixyMoon+LimeZu+pipo 付费混搭、禁再分发；ai-town 是奇幻森林、跟货代不搭）。我们做办公室，本就要换。

- **首选** **LimeZu「Modern Office / Modern Interiors」**（itch.io，约 $5–$40，含 **character generator**）——货代办公室天然选择（办公桌/电脑/文件柜/会议室/绿植/隔断）。CC-BY：商用 OK 但**必须署名 "LimeZu"、禁再分发原始素材包**——**别把原始 PNG 提交进公开 git**（放私有 assets 或 build 注入）。https://limezu.itch.io/modernoffice ｜ https://limezu.itch.io/moderninteriors
- **CC0 备选**（零授权风险、精致度略逊）：Kenney（https://kenney.nl/assets/roguelike-indoors）、OpenGameArt CC0 办公 tile。
- **4 个 NPC 出法**（照搬"共享 atlas + 每 NPC 一张 PNG"，斯坦福验证过最省事）：用 LimeZu character generator 拼 **老板=西装 / 主管=衬衫领带 / 业务员=休闲耳麦 / 跟单员=开衫眼镜**，导四向行走表，4 个共用一份帧映射只换 PNG。先用占位图跑通流程，最后替成办公室角色。
- **红线**：itch "free" ≠ CC0；**绝不用斯坦福仓库里的 PNG 或开罗 ripped 美术**。

---

## 7. 工作量估时（诚实，AI 辅助 build-day）
> 「build-day」= 一个 AI 辅助专注工作日。**早先 2 天估时是 DOM/CSS 级，严重低估**；要 Smallville 感，下限就是 ~6 天，多出的 4–7 天**几乎全在美术 + Tiled 办公室地图 + A* 平滑行走/深度排序**这三块"月感"来源——砍不掉。

### 路线 (b)：基于 @pixi/react 自建（**推荐，6–9 build-day**）
1. Next.js 工程 + 定版本（见风险 §8）+ `dynamic(ssr:false)` 挂空 Stage + viewport 相机（0.5d）
2. `PixiStaticMap` 画法 + 办公室 Tiled 地图 + LimeZu tileset 接入（**2d，最大块**）
3. `Character` 组件（四向动画+头顶气泡）+ 4 NPC 固定坐标 + 玩家走位（1.5d）
4. **A*/碰撞 + 平滑插值 + y 轴深度排序**（1.5d，**月感关键**）
5. 靠近/点 NPC → React 对话覆盖层 → `/api/chat` 流式 DeepSeek（1d）
6. Supabase `sessions`+`messages` 落每轮 + 复盘读取（1d）
7. 打磨：统一调色、像素字体、环境精灵、移动端触控、Play/Pause（0.5–1.5d）
**硬骨头**：① 办公室地图美术+碰撞标注（手工，省不了）② 平滑寻路调参手感 ③ 深度排序（ai-town 没现成，自己写 y→zIndex）。**建议预算 7 天落 v1 + 2 天打磨。**

### 路线 (a)：fork ai-town 改造（8–12 build-day，**不推荐**）
痛在把视觉组件从 Convex 类型/数据流"拔牙"（`PixiStaticMap` 已确认 import Convex 类型），拔不干净=背半个 Convex；fork 后上游更新无法 merge、长期维护重。除非要保留多人/历史回放，否则走 (b)。

---

## 8. 风险
1. **React 19 / Pixi 版本**：**ai-town 锁 `react@18.2.0` + `@pixi/react@7.1.0`，而 @pixi/react v7 不支持 React 19。** 要么这块 Pixi 子树退守 React 18，要么升 **Pixi v8 + @pixi/react v8**（API 变，抄来的组件要改）。**开工前先定版本，别抄完才发现跑不起来。**
2. **Pixi + Next.js SSR**：Pixi 碰 `window`/WebGL，**必须 `dynamic(()=>import(...),{ssr:false})`**。注意 ai-town 把 `base:'/ai-town'` 硬编码进资产 URL，抄 `PixiStaticMap` 要改成我们 public 路径。
3. **移动端**：货代用户多半手机访问；Pixi WebGL 低端机性能/发热；触控要区分"点击走位/点 NPC/拖拽相机"（ai-town 用 >10px 位移判 pan vs click）。**独立测试项。**
4. **美术授权**：LimeZu 禁再分发原始包——买正版用于产品 OK，但原始 PNG 别进公开 repo。
5. **寻路/地图是真人力**：A* 调参 + 碰撞网格标注 + 办公室地图绘制不是 AI 一把梭；深度排序 ai-town 没现成要自己写。
6. **fork 维护负担**（仅路线 a）：选 (b) 自建即规避。

---

## 9. 立即下一步（建议顺序）
1. **锁版本，跑通空场景**：新建 Next.js 工程，定 React/Pixi 版本（建议直接 **Pixi v8 + @pixi/react v8** 对齐 React 19，或明确退守 React 18 + @pixi/react v7），`dynamic(ssr:false)` 把空 `<Stage>` + `pixi-viewport` 相机跑起来 —— 先打掉风险 1、2。
2. **买美术 + 出 4 NPC**：购 LimeZu Modern Office/Interiors，character generator 出老板/主管/业务员/跟单员四向行走表 + 共享帧映射，放私有 assets，许可条款写进 NOTES。
3. **画办公室地图**：ai-town `convertMap.js` + 编辑器 `npm run le` 或 Tiled，画 4 房间办公室（bg + object 碰撞层）导出地图数据。
4. **移植"精致三件套"**：抄 `PixiStaticMap`（剥 Convex 类型）+ `PixiViewport` + `Character`；移植 `movement.ts`+`minheap`+`geometry` 的 A* 到浏览器；补 y 轴深度排序。**产出：能平滑绕家具走、走到桌后、相机能缩放的可玩办公室（无对话）。**
5. **接对话闭环**：写 `/api/chat`（照搬 `llm.ts` DeepSeek 流式 + `conversation.ts` persona 拼 prompt）+ Supabase `sessions/messages`（抄 `messages.ts` 字段）；Pixi 只 emit `onApproachNPC`。**验收：点 NPC → DeepSeek 流式回复 → 每轮落进 SessionDossier。**

---

## 附录 A：抄的时候直接打开的文件（已 clone 在 tmp）
> ai-town 在 `~/.claude/jobs/.../tmp/ai-town`，仅供参考学习；正式工程在 `~/dev/fde-playground`。
- 相机：`ai-town/src/components/PixiViewport.tsx`
- 地图渲染（剥 Convex 类型）：`ai-town/src/components/PixiStaticMap.tsx`
- 角色+动画+气泡：`ai-town/src/components/Character.tsx`、`Player.tsx`
- A* 寻路：`ai-town/convex/aiTown/movement.ts`、`convex/util/minheap.ts`、`convex/util/geometry.ts`
- DeepSeek 接入（内置 custom provider）：`ai-town/convex/util/llm.ts`
- persona prompt：`ai-town/convex/agent/conversation.ts`
- 对话采集蓝本：`ai-town/convex/messages.ts` + `src/components/Messages.tsx`/`MessageInput.tsx`/`PlayerDetails.tsx`
- NPC persona 定义处：`ai-town/data/characters.ts`
- 地图格式/转换/编辑器：`ai-town/data/gentle.js`、`data/convertMap.js`、`src/editor/`
- 深度排序参考（Phaser `setDepth`）：`generative_agents/environment/frontend_server/templates/demo/main_script.html`

## 附录 B：链接
- a16z ai-town（MIT，抄它）https://github.com/a16z-infra/ai-town
- Stanford generative_agents（Apache，参考深度排序）https://github.com/joonspk-research/generative_agents
- PixiJS https://pixijs.com ｜ @pixi/react https://react.pixijs.io ｜ pixi-viewport https://github.com/davidfig/pixi-viewport
- LimeZu Modern Office https://limezu.itch.io/modernoffice ｜ Modern Interiors https://limezu.itch.io/moderninteriors
- Fusion Pixel https://github.com/TakWolf/fusion-pixel-font ｜ Tiled https://www.mapeditor.org ｜ Lospec 调色板 https://lospec.com/palette-list
