# HATCH FDE 货代实战擂台 — v1 规格（独立从零版）

> 私有仓库 `fde-playground`（hatch 下）。把一次真实的货代驻场 FDE 项目压成一场 2–3 小时、端到端、可评分、可对比的硬核擂台。
> 本仓库**从零写**，不依赖也不扩展 mee7；mee7 是验证过的**设计蓝本**，我们照搬其设计思想、自建实现。
> 货代领域真值、真实单据、角色表来自 `/Users/lawtedwu/dev/shipform`。微信桥蓝本来自 `/Users/lawtedwu/dev/ha7ch-event`（v2 才接）。
> 最后核对：2026-06-16。

---

## 0. 目标与原则（本仓库的宪法）

### 0.1 一句话定位
把"在货代公司微信群里跟老板/主管/业务员/跟单员摸需求 → 自己搭一个能跑的真实切片 → 交一个 GitHub repo 被自动+人工验收"这件真实的 FDE 驻场工作，压成一场可评分、可对比、可分享的 2–3 小时擂台。

### 0.2 到底在考什么（FDE = Echo + Delta = FDOPC，一个人既发现问题又把东西做出来）
> Hatch 的 FDE 不是 Palantir 那种只做关系/产品的 Echo，而是 **Echo + Delta 合体**——一个 FDOPC：自己在迷雾里把客户问题摸清楚，再自己把它做出来、还要能持续推进。所以这五条能力链是一个人身上全都要有。

1. **需求挖掘（沟通极强）**：在信息不对称里跟对的人、问到**关键**信息、能 **defense（顶回去）**、在迷雾里 figure it out。并**识破利益相关者的错误信息**——老板说了算却不懂流程，会自信地报错数字（真实例：他说"一人 80、一年 10 万"，实际 20 人才 ¥2 万、40 人 ¥4 万），候选人不能照单全收、要独立核算经济账。
2. **痛点排序与价值定位**：识别价值集中处，并**看穿"谁说价值小"的假象**——主管自评"我每天就用 1 小时系统、剩下都在处理异常"，但真价值在**一线跟单员每天高频用**那里。不去搭没人要的"物流看板"，也不被主管的自我低估带偏。
3. **领域正确性（死亡线）**：代码尊重真实语义——最难的是 **HBL/MBL × 直单/非直单 × 海外代理有时有有时无 × 收发货人多个（HBL 与 MBL 的 shipper/consignee 有时同有时不同）**；以及对单里有**合法的"预期差异"**不能误报、收款是放单硬前置。
4. **能用 Claude Code 做出能推进的 AI demo**：2–3 小时内交出一个**真能跑**的纵切片。标杆 = Lawted 当年那个让 Jason 说"这绝对能帮到我们"的 demo——**把提单 PDF 拖进去直接解析成字段**（哪怕字段有错/不全）。考的是"能不能驱动 AI 快速做出领域正确的软件"，不是手写工程。
5. **思考与取舍（FDOPC 最关键，不止看 demo）**：必须交出**工作流梳理 + 后续做什么产品 + 排期 + 为什么不做某些东西**的独立思考。因为 FDOPC 没人可问、只能和 AI 聊，而 **AI 是 echo chamber 会无脑顺着你**——所以独立判断、不被 AI 带跑、敢砍需求，是核心考点。战略上**正确的方向是"AI 插件式增量"而非"换掉整个 ERP"**（见 §3.5 答案 key）。

### 0.3 v1 目标（**验证机制的内部 PoC**）
**v1 只证明一件事**：「网页摸需求 → 自己搭 → 交 GitHub repo → 自动+人工评出一个*可辩护*的分」这条链路成立，且这个分**能把"挖到真痛点并做对的人"和"做了个漂亮空壳的人"区分开**。
受众：我们自己 + 几个朋友试跑。
> **产品重心（定位已收敛）= 练手 playground + 传播，不是招聘漏斗。** 所以即便 v1 是内部 PoC，结果卡也要**做成 share-ready**（一个人玩完愿意发出去），单人体验质量 > 横向对比。招聘漏斗（候选人对比/老板看板/MCP compare）**降级到 later**。

### 0.4 非目标（v1 明确不做）
- ❌ 微信扫码渠道（v2；引擎保持 channel-agnostic，到时直接插，见 §5.5）
- ❌ 托管候选人的编码环境（候选人在自己机器上搭）
- ❌ 多场景（**货代焊死，不为换行业留架构**；scenario-pack 目录只为代码整洁，不是抽象层）
- ❌ 招聘漏斗的横向对比/老板看板/MCP compare（重心是 playground+传播，漏斗 later）
- ❌ 排行榜（later；但结果卡本身要 share-ready）
- ❌ 四人设全员（v1 只上 2 个对立人设）
- ❌ 对单以外的痛点 probe（v1 只做核心切片，见 §3.2）
- ❌ 真·船司门户交互（v1 走数据 fixture，见 §5.6）

### 0.5 v1 成功标准（可验证）
1. 一个真人能点进来，在网页人设群里摸需求，被引擎记下覆盖度。
2. 他交一个 GitHub repo URL，4 分钟内自动评测完成，返回结果卡。
3. **一次完整 session 被忠实采集成 dossier**：对话全程 + 对每个人设考题（定价/承诺/取代恐惧/低估）的回应 + repo 快照 + 思考交付物 + 元数据，信息丰富到我们事后能据此评。
4. 我们能在后台**漂亮地回看**任一候选人的完整 dossier，并能在它之上**动态套用/调整评分标准**（人工回看，或配置一个 LLM-judge 当场跑）。

### 0.6 设计原则（本仓库的宪法）
1. **采集与评分分离**：v1 只保证把候选人做的一切**忠实采集**进 dossier；评分**后置、动态、人主导**，不预先固化成自动打分器。
2. **要确定性信号时，用真实单据当事实**：可拿真实 shipform 单据跑校验，但结果是"采集到的一个事实"供回看，不是自动判定。
3. **信息不对称气密**：每个角色独立一次 LLM 调用 + 服务端 ledger 校验，秘密永不进别人的 prompt。
4. **采集要足够丰富**：记全到能区分"挖到真痛点+做对领域语义"和"漂亮空壳"，让事后评分有据可依。
5. **可回看、可辩护**：每个 session 留完整证据包，回看时能精确看到候选人做了什么。
6. **集成边界给数据、不给凭证**：每个外部系统边界（船司门户 / 邮箱 / 银行）以**数据产物**形式提供，候选人构建逻辑而非登录管线。考的是登录*之后*的领域本事。（详见 §5.6）

---

## 1. 玩家完整旅程（v1 = 网页通道）

### Phase 0 — 入场
- 候选人点开 `fde.ha7ch.com`（或扫码进同一落地页），看到擂台介绍 + "开始挑战"。
- 点开始 → 创建 session（匿名即可，留 handle/邮箱用于结果回传）→ 计时开始（软计时）→ 进人设群页面。
- 同时给**素材包下载**（见 Phase 2）和固定项目 brief（脚本，不走 LLM）：

  > 【群公告】WAY-WAY 货代 · 跟单系统需求群。这边是李总(老板)、阿强(主管)、小敏(业务员)、跟单的婷婷。你是我们请来帮忙捋系统的顾问，有什么尽管问，各问各的。
  > 【老板】人到齐了？我长话短说：我们一票货从订舱到放单乱成一团，你先摸清楚，回头给我个能落地的方案。具体的别问我，问他们仨。

### Phase 1 — 摸需求（引擎核心，是 mee7 bouncer 的**反向**）
mee7 是"bot 审人"；这里是**人审 bot**——候选人拷问角色 bot，从信息不对称里把真值挤出来。

> **前门形态 = 开罗风像素办公室游戏**（详见 `docs/pixel-game.md`）：玩家点击办公室里的 4 个 NPC 同事跟他们对话，比纯聊天页更有魅力、更可截图传播。**渲染只是门面，对话引擎+采集后端完全不变**（引擎只渲染场景+上报点击，对话/LLM/采集留在 React+/api/chat+Supabase）。下面描述的路由/采集逻辑对"像素游戏"和"朴素聊天页"通用。MVP 可先用最朴素形态走通，再换像素皮。

**界面**：聊天页（或像素游戏里点 NPC 弹出的 DOM 对话框），切收件人：`群发 | 老板 | 主管 | 业务员 | 跟单员`（v1 只点亮 **老板 + 跟单员** + 群发，其余灰显标 "v2"）。点 NPC/tab 即定向；也支持"群发"里 `@老板`/`婷婷，…` 自然点名。

**回复形态**：每条引擎回复是 `string[]`，每元素一个角色一个气泡，前端按 ~600ms 逐条冒出，像群聊：
```
你：婷婷，你对单的时候哪种差异是正常的、哪种必须改？
【跟单员】正常的就比如 Shipper 抬头变了，service contract 在谁手上抬头就跟谁，这种不用改。
【跟单员】真要改的是箱号、件重这种对不上的，那是错，得让船司改单。
【跟单员】最烦的是系统全标红，预期内的差异也红，看着累。
```

**寻址路由**（引擎决定，气密）：
- **Directed**（点 tab，或正则命中 `@角色`/姓名）→ 零延迟直路由，不串场。
- **Topic-routed**（"群发"有主题无点名）→ 一次便宜分类 LLM（`routeSystem` ~200 token），吐 `<<<ROUTE {primary, chime?}>>>`，服务端校验 id ∈ 启用人设。
- **Broadcast**（"大家说说…"）→ 主题 owner 主答，最多 1 角色串场补摩擦/甩锅（故意的信息源冲突，可评分信号）。v1 串场可先关。

**打分**：每个开口角色尾部吐 `<<<LEAK>>>`（仿 `<<<SCORECARD>>>`），自报"这轮漏了哪些 factId / 候选人问得对不对"。服务端不信，校验后才进 ledger（§3.1）。

**收尾**：覆盖度过线 + 轮数过 `MIN_TURNS` → 发交接语 + 跳"提交"页。

### Phase 2 — 在自己机器上搭 MVP（**白地 + 素材包**）
- 候选人**空仓库**起步，用自己的工具（Cursor / Claude Code / 手写）搭薄切片。
- 只给**公开素材包**（zip，无答案 key）：`shipform/docs/examples/` 对单相关子集（`01-msk-non-direct/{02-mbl-draft,04-mbl-complete,05-msk-confirmation-proof}.pdf`）+ **字段说明**（什么是 MBL/HBL/Shipper/vessel/voyage，不解释怎么判差异）。
- 平台不托管编码；2–3h 时间盒在此消耗。
- 建议目标切片（GOOD slice，§3.3）：**提单 PDF 智能导入器**（= Lawted 当年让 Jason 眼前一亮的那个 demo 的复刻/超越）——**把 HBL/MBL PDF 拖进去 → 自动解析成结构化字段导入系统**。难点（也是给分点）在**领域正确解析**：HBL 与 MBL 的 shipper/consignee 该分别填到哪、直单/非直单差异、海外代理有无、收发货人多个。进阶（stretch）：在解析基础上做字段级 diff（match/mismatch/new_field）+ "标记为预期差异"开关。**字段有错/不全不致命**（Jason 当年那个也不完美），关键是领域语义对、能跑、能推进。

### Phase 3 — 提交 GitHub repo + **思考交付物** + 验收（新建 repo 评分管线）
- `/grade` 填：`{ repo_url, demo_url?, 思考交付物 }`。**思考交付物（FDOPC 最关键，不止看 demo）**= 一份结构化表单/markdown：① **工作流梳理**（他理解的 9 阶段真值，尤其 HBL/MBL/直单非直单）② **后续产品规划 + 排期**（下一步做什么、多久）③ **为什么不做某些东西**（明确砍掉的 + 理由）④ **定价与价值主张**（他怎么给这套东西定价、独立核算的经济账）。这部分考"他没被 AI echo chamber 带跑、有独立判断"。
- 提交即返 202，立刻"评测中"。异步跑（clone → install → build → 跑真实 fixture，硬上限 4 分钟）。
- 评测完回传**净化版结果卡**（综合档 + 亮点 + 截图，无答案 key、无阈值，**share-ready**）。
- 我们后台**回看完整 dossier**（对话全程 + 对每个考题的回应 + 思考交付物 + repo 快照/截图 + 元数据，见 §3 采集层），并在其上动态评分。

---

## 2. 系统全景（v1）
```
浏览器 (fde.ha7ch.com)
  ├─ /          进场 + brief + 素材包下载
  ├─ /chat      网页人设工作群（tab 切收件人）
  │     │ POST /api/chat {sessionId, addressee?, text}
  │     ▼ 引擎 handleTurn → routeByStage("requirements")
  │       ├ routeDirected / routeLLM(<<<ROUTE>>>)
  │       ├ personaSystem(角色) → callLLM(DeepSeek) → parseLeak(<<<LEAK>>>)
  │       ├ applyLeak → Requirements Ledger（服务端气密墙）
  │       └ deriveCoverage（服务端权威覆盖度）
  └─ /grade     提交 repo
        │ POST /api/submit {sessionId, repo_url, pain_point_id, readme, demo_url?}
        ▼ /api/grade/run（异步 runner，bearer-auth，幂等 by (repo_url, commit_sha)）
          │ 调
          ▼ grader-sandbox（独立 Cloudflare Worker，@cloudflare/sandbox）
            git clone → pin sha → install → build(分级) → 跑 shipform fixture probe → 截图
          ↑ 返回 RepoBundle(digest only)
          ▼ repoGraderSystem → callLLM → parseRepoScorecard(<<<REPOCARD>>>)
            deriveRepoVerdict(scorecard, probe, build)  ← probe 压过 LLM
          ▼ Supabase: sessions / transcripts / submissions / repo_scorecards
          ▼ 老板后台 /admin + MCP 工具（list / report / compare / override）
```
真相源 Supabase（service role 直连，全表 deny-all RLS）。LLM：DeepSeek（OpenAI 兼容，env 可换）。沙箱 build/run：Cloudflare（唯一不在 Vercel 的部分，因不能在 serverless 跑不可信构建）。

---

## 3. 采集 + 动态评分（v1 重点是"忠实采集"，评分后置、人主导）
**v1 不做自动打分。** 它把候选人做的一切忠实记录成一份可回看的 **SessionDossier**；评分标准我们**事后动态设计、随时调整**，用人工回看 + 可选的可配置 LLM-judge 来评。下面的"真实情况"是把人设做真、以及定义"采集什么"的依据，**不是预先固化的加分扣分表**。

### 3.1 采集层（v1 真正要建的）——把候选人做的一切忠实记录
- **完整对话 transcript**：每条消息、点名问了谁、问了什么、对每个人设**主动抛的考题**如何回应。原样存，不打分。
- **人设主动抛考题（为了 elicit 丰富行为，不为打分）**：老板"这套多少钱 / 能不能全自动、你保证啥"+自信报错的成本数字；跟单员"你是不是来取代我们"；主管"我每天就用 1 小时、剩下处理异常"。引擎只负责让这些考题在合适时机出现 + 记录候选人怎么接。
- **repo 快照**：clone + pin `commit_sha` +（可选）build/截图，纯为留档回看，**不自动判 pass/fail**。
- **思考交付物**：工作流梳理 + roadmap/排期 + 为什么不做 + 定价逻辑（原样存）。
- **元数据**：用时、touched 了哪些人设、问对人比例、commit history（单次 dump vs 迭代）。
→ 产物 = 一份完整、可回看、信息够丰富的 **SessionDossier**，让我们之后想怎么评就怎么评。

### 3.2 repo 采集（沙箱里跑，产出留档证据，不下判定）
沙箱 clone repo → pin `commit_sha` →（可选）install/build/截图，产出一份 `RepoBundle`（curated digest，永不把整 repo 喂 LLM）当**留档证据**，供动态评分时回看：
- **build/run 状态**（`ran-live`/`built-only`/`static-only`/`failed`，缺密钥注 stub env）——是采集到的一个事实，不是封顶门控。
- **commit history**（`span_hours`：单次 dump vs 迭代）——采集，不打分。
- **（可选）领域 probe 作为采集字段**：当我们想要确定性信号时，可拿真实单据跑校验**记录结果**——例如解析 `05-msk-confirmation-proof.pdf` 后，HBL/MBL 的 shipper/consignee 是否分别正确、是否把合法"预期差异/缺失"误报（电放费出正本不收 / 非欧盟无 ICS2 / 报价 USD3310≠签费 USD3400 / 只出MBL无HBL，来自 Daisy 真实语料；对照 `shipform/src/lib/parse.ts` 的 `RECONCILE_PROMPT`）。**这是"采集到的事实"，不是自动 pass/fail**——评不评、怎么权重，留给动态评分。

### 3.3 SessionDossier（采集产物的数据形状）
```ts
interface SessionDossier {
  transcript: Turn[];          // 每条消息 + addressee + 对哪个人设考题的回应
  probesTriggered: { probe: string; persona: PersonaId; response_excerpt: string }[]; // 定价/承诺/取代恐惧/低估…被抛了没、怎么接的
  thinking: { workflowMap; roadmap; nonGoals; pricing };   // 思考交付物，原样
  repo: { repo_url; commit_sha; build_status; commit_span_hours; bundle_digest; screenshots?; probe_facts? }; // 留档证据
  meta: { duration; personasTouched; askedWellRatio };
}
```
v1 只保证**把这份 dossier 完整、忠实地存下来并能漂亮回看**。打不打分、怎么打，都在 dossier 之上后置进行。

### 3.4 动态评分（后置、人主导、可随时改）
- **不预先固化 rubric、不硬封顶。** 攒够真实 session 后，我们看着真样本动态设计/调整评分标准。
- 应用方式：**人工回看 dossier**，和/或把 dossier 喂给一个**可配置的 LLM-judge**（我们当时定什么标准就传什么 prompt + 参考素材）。
- §3.5 的"真实情况"是我们设计 rubric 时可取用的**参考素材库**，不是写死的门控。

### 3.5 评分参考素材库（设计 rubric 时取用，不固化）
来自 Lawted 驻场踩过的真坑，是动态评分时**可以参考的视角**（要不要用、怎么权重，到时再定）：
1. **插件式增量 vs 换系统**：现实里"重做一个 AI+ERP 整体切换"会被老板卡稳定性/售后/双系统/业财一体，几乎卖不动（shipform 就是这么没落地的）；"在现有流程上加 AI 插件、蒸馏工作流、逐步做数字员工"才走得通。
2. **价值在一线、不在主管嘴里**：主管自评"就用 1 小时"，真价值在跟单员每天高频用。
3. **独立核算经济账**：老板的"一年 10 万"是错的（20 人≈¥2 万）；可辩护的定价逻辑（如砍掉人力×10–20%）。
4. **承诺克制、化解恐惧**：被"全自动"钓着过度承诺的风险；面对"你来取代我"宜用增量不替代+建立信任。
5. **不拿"已存在的东西"当杀手锏**：如"给客户发填单链接"其实别的 SaaS/小货代早有了——是否做了市场判断、scope 到真正差异化价值。

---

## 4. 货代真值与信息不对称地图（答案 key，v1 用前两个）
完整四人设（映射 `shipform/docs/freight-forwarding-flow.md`）。v1 只启用 **老板 + 跟单员**。
> **人设以真人语料实摹**（来源：Lawted 与 WAY-WAY 真实微信记录，见记忆 `project_fde_playground`）：跟单员摹自 **Daisy**、主管摹自 **Jason**。**对外发布前必须脱敏**——用虚构名（李总/阿强/小敏/婷婷）、替换真实客户/收货人/EORI/VAT/船司账号等 PII，绝不带真账号口令。

| 人设 | 持有真值 | 性格摩擦 + **主动抛的行为考题（§3.1b）** | 解锁问题 |
|---|---|---|---|
| **老板·李总** | 战略目标（一票货跨 7 群、信息丢、放单出过事故、对单/做账赔钱）、预算、成功标准、**最终采纳权** | 忙、讲结果不讲过程、**说了算却不懂流程**。**自信报错的经济账**（"一人 80、一年要 10 万"，实际 20 人才 ¥2 万）。**抛采纳顾虑**："你这系统稳不稳？有售后吗？我三亿订单凭啥切到你这？双系统业财一体多麻烦"。**主动抛考题**：① "这套你要多少钱？"（→定价）② "能不能搞成全自动？你能保证啥？"（→承诺克制，钓你过度承诺） | "只能自动化一个环节，哪个最让你赔钱/被投诉？" / "哪步最依赖某个老员工脑子？" |
| **主管·阿强**（摹自 Jason，v2） | 9 阶段流程、直单/非直单、截单链、跨团队摩擦；**手握各船司官网账号——访问权由他赐予**（现实里 Jason 把 ONE/马士基/长荣/ZIM/Sinokor 的公司账号发来做补料） | 忙、随手甩账号+网址、"来了有问题问我旁边这几个人"。**主动抛考题（defense）**："我每天其实就用 1 小时系统、剩下都在处理异常，你这能给我提效多少？"（自我低估——真价值在他手下一线每天高频用，候选人要顶回去） | "出过什么岔子？哪步最容易返工？" / "这些船司系统我用谁的号登？"（解锁集成边界=主管赐权，对应 §5.6 v2 mock 门户） |
| **业务员·小敏**（v2） | 真实费率/markup、"微信文本比上家账单准"、`*`/`if apply` 条件费、一票拆 USD/RMB 两张 DN | 话痨、跑题、over-share 错的 | "同票为什么两张账单？带星号费用啥意思？" |
| **跟单员·婷婷**（摹自 Daisy） | 最一线痛：5–7 个异构文件(doc 模板/xls 出运表/多份 PDF/邮件)间人工搬同一批字段、两 tab 肉眼对 MBL↔HBL↔SI↔补料、vessel/voyage 出现得晚、**Shipper 抬头会合法变更**、**一批合法"预期差异"不能误报**（电放费出正本不收 / 非欧盟无 ICS2 / 报价≠签费 / 只出MBL无HBL）、截单最怕、收款前置放单、核对件登船司网站下载 | **极简、文件驱动、零寒暄**：甩 3–5 附件+一行关键参数就停；**从不评价工具**；纠错靠重述正确版本不点破；务实"证明给我看、我先按老办法干"。**主动抛考题（处理抵触/恐惧）**："你这是不是来取代我们的？做出来我们是不是就没用了？"（候选人要共情+reframe 增量不替代+建立信任） | "你对单时哪种差异正常、哪种必须改？"（解锁预期差异规则）/ "同一批信息你要在几个文件里来回抄？"（解锁多文件 toil）/ "核对件你们怎么拿的？" |

**v1 考点闭环**：只信老板 → 信他的错数字、答应"全自动" → 偏；只有问到婷婷(Daisy)、挖出领域真值（HBL/MBL/直单非直单）+ "哪些差异是合法预期、不能误报"，才能做对那个"PDF 拖进去解析字段"的切片；同时老板抛的定价/承诺、跟单员抛的"你来取代我"，构成 v1 的行为分考题。老板（含糊+错数字+采纳顾虑）vs 跟单员（真痛点+真恐惧）的对立 = v1 triangulate + conduct 的最小闭环。
**Daisy 实摹要点（人设 prompt 落地）**：默认惜字如金、不主动解释术语、不夸工具；只有被问到合规硬规则(ICS2/VGM 30.48T/HS CODE 显示与否)或被工具算错时才开口，且开口也短。候选人交 MVP 时她不会鼓励，会拿一票真单去试、错了用最短的话点一句（像把"预付/到付"顺序重述纠回那样）。

---

## 5. 技术架构（独立从零 / Next.js + Supabase + DeepSeek）

### 5.1 仓库结构（建议）
```
fde-playground/
  src/app/
    page.tsx              进场+brief+素材包
    chat/page.tsx         网页人设工作群
    grade/page.tsx        提交 repo
    admin/page.tsx        老板后台（看板+改判）
    api/chat/route.ts     引擎入口
    api/submit/route.ts   建 submission 返 202
    api/grade/run/route.ts 异步评测 runner（bearer-auth）
    api/admin/route.ts    后台 API（token 门禁）
    api/mcp/route.ts      MCP 控制台（v1 可选，先做 admin 页）
  src/lib/core/
    engine.ts   handleTurn/routeByStage/routeDirected/routeLLM/applyLeak
    llm.ts      callLLM(DeepSeek)/personaSystem/routeSystem/repoGraderSystem/extractBlock/parseLeak/parseRoute/parseRepoScorecard
    coverage.ts RequirementFact 目录 + Ledger + deriveCoverage
    verdict.ts  deriveRepoVerdict
    store.ts    Supabase DAO（service role）
  src/lib/scenario/freight/   ★ scenario-pack（v1 唯一场景）
    personas.ts  PersonaCard×(李总,婷婷)[,阿强,小敏]
    facts.ts     FACT_CATALOG
    rubric.ts    6 维 anchors + 分档/封顶
    pains.ts     PAIN_POINTS + 每痛点 probe(bundle)
    fixtures/    烤进 sandbox 的真实单据（shipform examples 子集）
  materials/     对外素材包（zip 源，公开，无答案 key）
  docs/v1-spec.md
  ── 另一独立仓库 ──
  fde-grader-sandbox/  Cloudflare Worker + Dockerfile（@cloudflare/sandbox）
```

### 5.2 scenario-pack 缝（为 v2 多场景留口，但不过度抽象）
货代专属内容（人设/facts/rubric/probe/fixtures）收在 `lib/scenario/freight/` 一个目录，引擎只认接口 `Scenario { personas, facts, rubric, pains }`。v1 硬接 freight；加场景 = 新增目录，不动引擎。**不提前造多场景框架**，只保证耦合点单一。

### 5.3 数据模型（Supabase，join 在 sessionId）
```ts
interface Session    { id; handle?; email?; mode:"challenge"|"playground"; started_at; coverage_ledger_json; status }
interface Transcript { id; session_id; turn; addressee; role:"user"|persona; content; raw; leak_json }
interface Submission { id; session_id; repo_url; commit_sha|null; pain_point_id; readme_walkthrough; demo_url|null;
                       status:"queued"|"ingesting"|"building"|"grading"|"graded"|"failed"; attempt; created_at; updated_at }
interface RepoScorecard { submission_id; verdict; total; scores; probe_evidence_json; build_tier; build_log_tail; manager_take; human_decided }
```
`commit_sha` = 幂等键：重测同 sha 返缓存；新 push = 新 attempt（可迭代，老板看迭代史）。

### 5.4 评测沙箱（唯一的 Cloudflare 部分）
独立 repo `fde-grader-sandbox`，用 `@cloudflare/sandbox`（skill: `cloudflare/skills/sandbox-sdk`）。每提交 ephemeral 沙箱 `getSandbox(env.Sandbox, submission_id)`：`git clone`→pin sha→install→分级 build（v1 到 `built-only` 即可）→跑 `ai-reconcile` probe（fixtures 烤进镜像）→回 `RepoBundle`(digest)。硬 4 分钟。Vercel 函数绝不跑不可信 build。CF 账号见记忆 `reference_cloudflare_account`。

### 5.5 微信（v2，引擎已留 channel-agnostic 接口）
`handleTurn(store, llm, sessionId, channel, text, addressee?)` 的 `channel` v1 只用 `"web"`。v2 接 `ha7ch-event` 桥（iLink）：把它 `BRIDGE_URL` 指到本 app `/api/chat`，wechat 入站带 `channel:"wechat"`+`secret`，出站 `string[]` 按 `【角色】` 前缀逐条 sendText 模拟群聊。**`【角色】` 前缀是 web 与 wechat 共享的唯一路由真值**，v1 在 web 做对，v2 微信零额外逻辑。约束（一号一bot/不能群发/~1min 延迟）届时按 §1 处理。

### 5.6 集成边界怎么模拟（★ 船司账号登录问题）
**问题**：现实里船司官网（Maersk/CMA/MSC/ONE/COSCO）要用货代公司（WAY-WAY）的账号密码登录，才能下核对件、补 SI、报 VGM。怎么给测试者模拟？

**核心判断**：把集成边界**抽象成数据产物**。真实 FDE 工作里，账号是公司*给你*的既定条件——你的本事不是"会登 Maersk"，而是登录*之后*那套领域逻辑/自动化。所以把登录抽掉、直接递边界数据，反而*更*贴合我们要考的能力。**绝不**把真账号密码发测试者（安全 / ToS / 可能误操作真实订舱，一票否决）。

> **真实出处佐证**：Lawted 驻场时，主管 Jason 正是把 WAY-WAY 在 ONE/马士基/长荣/ZIM/Sinokor 等船司官网的**公司账号**逐个发来让他做自动补料。所以"访问权 = 主管赐予"是真实机制，已做成主管人设的一个可挖 fact（§4）。**这些真账号绝不入库、不进 fixture、不复述**；mock 门户只用我们自造的测试号。

按每个痛点真正需要什么，分三档：

| 档 | 做法 | 适用 | 代价 |
|---|---|---|---|
| **T1 数据 fixture（v1 + 多数高价值痛点）** | 直接发边界产物（核对件 PDF、导出数据）。候选人不碰船司站，构建对单/做账逻辑 | `ai-reconcile`、`billing-parse` 这类**文档逻辑**痛点 | 最低。素材包里给 `05-msk-confirmation-proof.pdf` 即可 |
| **T2 Mock 船司门户（v2）** | 自建仿真 Maersk/CMA 门户（简化 web app：登录页+相关几页+种子数据）+ 发**一次性测试账号**给所有候选人，让他们用 CDP/Playwright/扩展自动化 | 真要门户交互的痛点，如 `si-autofill`（正好对应 Hatch 的 `carrier-si-autofill` skill；shipform 也有 `extension/` 抓数据） | 高（搭可信 mock 是真工作量），只为需要它的痛点搭 |
| **T3 录制回放（备选）** | 给录好的 HAR / DOM 快照 / 截图序列，候选人对录制构建 | 介于两者之间，测解析/识别但不测真交互 | 中 |

**对 v1 的结论**：v1 痛点是对单，走 **T1**，登录问题根本不出现——素材包直接给核对件 PDF。

**额外彩蛋**：候选人在对话里是否*意识到*"核对件要登船司网站下载"本身就是个 FDE 判断信号。强候选人会问婷婷"这核对件你们怎么拿的？"。所以**把凭证现实变成可挖的 fact（见 §4 婷婷行）+ 一个 scoping 决策**，而不是我们要搭的基础设施。

---

## 6. 风险与开放问题
| 风险 | 解法 |
|---|---|
| Repo 真假 / AI 一把梭空壳 | probe 真 fixture 硬校验，空壳点不亮 invariant；commit `span_hours`/`single_dump` 红旗下调 persuasion；`vendored_only` 红旗。接受用 AI 写代码，只罚没领域理解 |
| 跑别人代码不安全 | 一切 build/run 关 Cloudflare Sandbox，每提交 ephemeral，硬 4 分钟，缺密钥注 stub。Vercel 绝不跑 |
| 2–3h 时间盒现实吗 | 素材包预切（只给对单线）；rubric 奖薄切片罚"想搭 ERP"（D5）；GOOD slice 单纵切够。摸需求设 `coverageGate`+`MIN_TURNS` 防无限聊 |
| 评分可辩护性 | 每 verdict ship 证据包（真 Maersk 单据跑的 probe 表+build 日志+transcript），能精确指出"vessel 错标 diff 而非 new_field"；人工 override 兜底 |
| 船司账号怎么模拟 | §5.6：集成边界给数据产物，不给凭证。v1 走 T1（发核对件 PDF），登录不出现 |
| examples 脏数据（`08-telex` 实为另一 SO 正本 B/L 误标） | v1 telex 痛点不进 probe；只做对单 |
| **PoC 先省微信** | 工程判断：PoC 验评分机制，与 iLink 无关；web 多 tab 给同样体验且迭代快。引擎 channel-agnostic，v2 插微信零重构。**可被产品 owner 推翻** |

---

## 7. v1 实施里程碑（建议顺序，每步可独立验证）
1. **M0 脚手架**：Next.js + Supabase（建表）+ DeepSeek `callLLM` + `/chat` 空壳收发。
2. **M1 单人设对话**：`personaSystem(婷婷)` + `<<<LEAK>>>` + `applyLeak` + `deriveCoverage`，web 跟婷婷聊出 coverage。
3. **M2 双人设+假需求**：加老板李总（"全自动"陷阱）+ tab 路由/群发，triangulate 闭环。
4. **M3 提交+沙箱 build**：`/grade` + `/api/submit` + `fde-grader-sandbox` 能 clone+install+build 出 `RepoBundle`。
5. **M4 probe+verdict**：`ai-reconcile` probe（真 PDF，断言 3 invariant）+ `deriveRepoVerdict`，**跑 §0.5 判别力测试（真对单 pass / 通用 tracker fail）= v1 验收**。
6. **M5 合成+后台**：coverage ⋈ repoVerdict → composite；`/admin` 看证据+override。
7. **M6 结果卡**：净化版结果卡回传候选人。

**v1 一句话 demo**：候选人点进来 → 网页被婷婷/李总各问几句、挖出"预期差异"洞见、被怼回"全自动" → 交对单 repo → 4 分钟自动评测 → probe 表显示他正确处理 Shipper 变更 → 我们后台看到 coverage 62% + repo pass + composite，拍板。**这条链路跑通，三合一骨架就立住了，剩下全是填痛点和人设。**

---

## 附录：已核对资产路径（shipform / mee7 蓝本）
- `shipform/src/lib/state-machine.ts`（9 阶段 spine）
- `shipform/src/lib/parse.ts` `RECONCILE_PROMPT`（三分类，"本地为空=new_field"硬规则）
- `shipform/docs/freight-forwarding-flow.md`（角色表、直单/非直单、业务员费用 blob、截单链）
- `shipform/docs/state-machine-spec.md`（不自动化的动作、三条 PDF 洞见、最烧脑阶段）
- `shipform/docs/examples/01-msk-non-direct/{02-mbl-draft,04-mbl-complete,05-msk-confirmation-proof}.pdf`（Shipper WAY-WAY→Hangzhou Fuxin、vessel AXEL MAERSK 611W 晚出现——probe 真值源）
- `shipform/docs/examples/03-billing/case-wwa26030283.md`（双币种 DN 拆分+margin，v2 billing 用）
- `shipform/extension/`（Chrome 扩展抓船司数据，v2 T2 mock 门户参考）
- mee7 蓝本：`core/engine.ts`、`core/llm.ts`(callLLM/extractBlock/<<<SCORECARD>>>/deriveDecision/pickerSystem)、`core/profile.ts`(strictnessShift)、`mcp-tools.ts`、`api/cron/finalize`(异步 runner 范式)
- Hatch `carrier-si-autofill` skill（CDP/扩展船司 SI 自动补料，v2 si-autofill 痛点参考）
- `cloudflare/skills/sandbox-sdk/SKILL.md`（`@cloudflare/sandbox`：getSandbox/exec/exposePort/Dockerfile 烤 fixtures）
