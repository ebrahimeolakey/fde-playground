export type PersonaId = "boss" | "manager" | "sales" | "clerk";

export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface Persona {
  id: PersonaId;
  /** 工位显示名（带角色） */
  name: string;
  /** 角色短标签 */
  title: string;
  /** 头顶 emoji（idle 状态气泡） */
  emoji: string;
  /** 像素小人主色（衣服） */
  color: string;
  /** 开场白（玩家首次靠近/点击时，不走 LLM） */
  opening: string;
  /** 喂给 LLM 的 system prompt（人设 + 隐藏知识 + 性格摩擦 + 主动抛的考题） */
  system: string;
}

export interface ChatRequest {
  sessionId: string;
  npcId: PersonaId;
  messages: ChatMessage[];
}
