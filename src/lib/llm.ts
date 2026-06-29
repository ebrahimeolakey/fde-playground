import type { ChatMessage, Persona } from "./types";
import { clueInstruction, REVIEW_SYSTEM } from "./personas";

const API_KEY = process.env.DEEPSEEK_API_KEY || "";
const BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export const llmConfigured = Boolean(API_KEY);

/** 核心：OpenAI 兼容流式。只有服务端调。 */
async function* streamCompletion(system: string, messages: ChatMessage[]): AsyncGenerator<string> {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, stream: true, temperature: 0.8, messages: [{ role: "system", content: system }, ...messages] }),
  });
  if (!res.ok || !res.body) {
    console.error("[llm] upstream", res.status, (await res.text().catch(() => "")).slice(0, 200));
    yield "（一时没回上来，稍后再试）";
    return;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const data = t.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const delta = JSON.parse(data)?.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch { /* partial chunk */ }
    }
  }
}

/** 角色对话（拼上隐藏线索标记说明）。无 key 时走 mock。 */
export async function* streamChat(persona: Persona, messages: ChatMessage[]): AsyncGenerator<string> {
  if (!API_KEY) { yield* mockStream(persona, messages); return; }
  yield* streamCompletion(persona.system + clueInstruction(persona), messages);
}

/** 诊断复盘（主管对照真答案点评）。无 key 时走 mock。 */
export async function* streamReview(messages: ChatMessage[]): AsyncGenerator<string> {
  if (!API_KEY) { yield* mockChars("（演示模式）大方向我听明白了。要真见效，先盯一线对单/做账那块，别被『全自动』带跑，也别想着重做一套 ERP。🟡 摸到一半"); return; }
  yield* streamCompletion(REVIEW_SYSTEM, messages);
}

async function* mockStream(persona: Persona, messages: ChatMessage[]): AsyncGenerator<string> {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  yield* mockChars(mockReply(persona.id, last));
}
async function* mockChars(s: string): AsyncGenerator<string> {
  for (const ch of s) { yield ch; await sleep(10); }
}

function mockReply(id: Persona["id"], userText: string): string {
  const ask = (kw: string[]) => kw.some((k) => userText.includes(k));
  const p = "（演示模式·未配 key）";
  if (id === "boss") {
    if (ask(["多少钱", "价格", "报价", "收费"])) return `${p}你先说能帮我省多少。一个跟单一年怎么也十来万，你得省下这个。[[CLUE:boss-wrongnum]]`;
    if (ask(["全自动", "保证", "自动"])) return `${p}对！我就要全自动的，你能保证吗？[[CLUE:boss-fakeneed]]`;
    return `${p}我只看结果：少赔钱、少投诉。对单做账那块老出岔子。[[CLUE:boss-realpain]]`;
  }
  if (id === "manager") {
    if (ask(["账号", "登录", "船司", "网站"])) return `${p}船司网站要用公司账号登，回头我发你。[[CLUE:mgr-access]]`;
    if (ask(["提效", "价值", "用多少", "多少时间"])) return `${p}我自己每天也就用一小时，剩下都在处理异常，你这能提多少效？[[CLUE:mgr-undervalue]]`;
    return `${p}流程就是订舱→补料→对单→截单→开船→做账→放单，细节问婷婷。[[CLUE:mgr-flow]]`;
  }
  if (id === "sales") {
    if (ask(["链接", "托书", "填单"])) return `${p}对对这个好！……不过别家平台好像早有了。[[CLUE:sales-exist]]`;
    return `${p}同一票货我们常拆 USD/RMB 两张账单的。[[CLUE:sales-dn]]`;
  }
  if (ask(["取代", "替代", "没用", "失业"])) return `${p}你这……是不是来取代我们的？[[CLUE:clerk-fear]]`;
  if (ask(["对单", "差异", "比对", "核对", "怎么干", "最烦"])) return `${p}对单全靠开两个 tab 肉眼比；预期内的差异（电放费、ICS2、报价≠签费）别全标红。[[CLUE:clerk-recon]] [[CLUE:clerk-expected]]`;
  return `${p}嗯，你说。（在忙，回得短）`;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
