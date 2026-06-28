import type { ChatMessage, Persona } from "./types";

const API_KEY = process.env.DEEPSEEK_API_KEY || "";
const BASE_URL = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export const llmConfigured = Boolean(API_KEY);

/**
 * 以 OpenAI 兼容协议流式调用 DeepSeek。返回一个产出文本增量的 async generator。
 * 没配 key 时回退到内置 mock（开箱即玩）。
 * 架构边界：只有服务端（/api/chat）调它；引擎/前端永不直接碰 LLM。
 */
export async function* streamChat(
  persona: Persona,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  if (!API_KEY) {
    yield* mockStream(persona, messages);
    return;
  }

  const body = {
    model: MODEL,
    stream: true,
    temperature: 0.8,
    messages: [{ role: "system", content: persona.system }, ...messages],
  };

  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    yield `（${persona.title}一时没回上来，稍后再试）`;
    console.error("[llm] upstream error", res.status, detail.slice(0, 300));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    // SSE: 以 \n\n 分隔的 data: 行
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const data = t.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const delta = json?.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // 不完整的 chunk，忽略
      }
    }
  }
}

/** 无 API key 时的兜底：基于人设 opening + 简单规则，逐字"流式"出。 */
async function* mockStream(persona: Persona, messages: ChatMessage[]): AsyncGenerator<string> {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const reply = mockReply(persona.id, last);
  for (const ch of reply) {
    yield ch;
    await sleep(12);
  }
}

function mockReply(id: Persona["id"], userText: string): string {
  const t = userText.toLowerCase();
  const ask = (kw: string[]) => kw.some((k) => userText.includes(k) || t.includes(k));
  const prefix = "（演示模式·未配 DEEPSEEK_API_KEY）";

  if (id === "boss") {
    if (ask(["多少钱", "价格", "报价", "收费"])) return `${prefix}你先说说能帮我省多少。我们一个跟单一个月怎么也得八千一万吧，一年十来万，你这系统得帮我把这个省下来。`;
    if (ask(["全自动", "保证", "自动化"])) return `${prefix}对！我就想要全自动的，你能保证吗？`;
    return `${prefix}具体的别问我，问他们仨。我只看结果：少赔钱、少投诉。`;
  }
  if (id === "manager") {
    if (ask(["账号", "登录", "船司", "网站"])) return `${prefix}船司网站要用公司账号登，回头我把账号发你。`;
    if (ask(["提效", "价值", "用多少"])) return `${prefix}说实话我自己每天也就用一个小时系统，剩下都在处理异常，你这能帮我提多少效啊？`;
    return `${prefix}流程我清楚，不过细节你直接问婷婷，她天天弄。我等下还得去接孩子。`;
  }
  if (id === "sales") {
    if (ask(["链接", "托书", "填单"])) return `${prefix}对对这个好！……不过我前阵子看别家平台好像也有这个了，有个小货代同行都在用。`;
    return `${prefix}哎我跟客户打交道最多啦～费用这块、客户老改托书这些都能问我。`;
  }
  // clerk
  if (ask(["取代", "替代", "没用", "失业"])) return `${prefix}你这……是不是来取代我们的？做出来我们是不是就没用了？`;
  if (ask(["对单", "差异", "比对", "核对"])) return `${prefix}正常的比如 Shipper 抬头变了不用改；箱号件重对不上才是错。最烦系统把预期内的差异也全标红。`;
  return `${prefix}嗯，你说。（在忙，回得短）`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
