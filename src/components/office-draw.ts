import type { PersonaId } from "@/lib/types";

// 纯函数：在 canvas 上画一个斜 3/4 top-down 的像素办公室。
// 自绘（无外部素材，零授权风险）。像素锐利靠 imageSmoothingEnabled=false + 整数虚拟分辨率。
// 这是"哑渲染层"：只画 + 提供命中盒；不碰对话/LLM/采集。

export const VW = 320; // 虚拟分辨率宽
export const VH = 200; // 虚拟分辨率高

export interface NpcSlot {
  id: PersonaId;
  name: string;
  title: string;
  emoji: string;
  color: string;
  x: number; // 工位中心（虚拟坐标）
  y: number;
}

// 4 个工位的固定布局（2×2）
export const SLOTS: Omit<NpcSlot, "name" | "title" | "emoji" | "color">[] = [
  { id: "boss", x: 70, y: 58 },
  { id: "manager", x: 250, y: 58 },
  { id: "sales", x: 70, y: 140 },
  { id: "clerk", x: 250, y: 140 },
];

const PAL = {
  floor1: "#d9c7a3",
  floor2: "#cfba93",
  wall: "#7d6b8a",
  wallDark: "#5f5170",
  desk: "#9b6b43",
  deskTop: "#b9824f",
  screen: "#2b3a55",
  screenOn: "#5fb0d6",
  skin: "#f1c9a5",
  hair: "#3a2c25",
  shadow: "rgba(0,0,0,0.18)",
  plant: "#3f8f5a",
  pot: "#a45a3b",
  nameBg: "rgba(28,22,34,0.82)",
  nameFg: "#f4ecdf",
};

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function drawFloor(ctx: CanvasRenderingContext2D) {
  // 棋盘地板
  const t = 16;
  for (let y = 24; y < VH; y += t) {
    for (let x = 0; x < VW; x += t) {
      const alt = ((x / t) + (y / t)) % 2 === 0;
      px(ctx, x, y, t, t, alt ? PAL.floor1 : PAL.floor2);
    }
  }
  // 上墙
  px(ctx, 0, 0, VW, 24, PAL.wall);
  px(ctx, 0, 20, VW, 4, PAL.wallDark);
  // 墙上挂画/窗
  px(ctx, 40, 6, 28, 12, "#9fd0e8");
  px(ctx, 40, 6, 28, 12, "rgba(255,255,255,0.0)");
  ctx.strokeStyle = PAL.wallDark;
  ctx.lineWidth = 1;
  ctx.strokeRect(40.5, 6.5, 27, 11);
  px(ctx, 150, 7, 18, 10, "#caa15a");
  px(ctx, 250, 7, 22, 10, "#8fc7a0");
  // 几盆绿植点缀
  drawPlant(ctx, 12, 150);
  drawPlant(ctx, 300, 96);
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number) {
  px(ctx, x, y + 10, 10, 6, PAL.pot);
  px(ctx, x + 1, y, 8, 11, PAL.plant);
  px(ctx, x + 3, y - 3, 4, 5, PAL.plant);
}

function drawDesk(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const w = 44;
  const h = 18;
  const x = cx - w / 2;
  const y = cy + 6;
  px(ctx, x, y + h - 4, w, 4, PAL.desk); // 桌腿/底
  px(ctx, x, y, w, h - 2, PAL.deskTop); // 桌面
  px(ctx, x, y, w, 2, "#caa074"); // 高光
  // 显示器
  px(ctx, cx - 9, y - 10, 18, 12, PAL.screen);
  px(ctx, cx - 7, y - 8, 14, 8, PAL.screenOn);
  px(ctx, cx - 2, y + 2, 4, 3, "#222"); // 底座
  // 一摞纸
  px(ctx, x + 3, y + 2, 8, 6, "#efe7d2");
  px(ctx, x + 3, y + 2, 8, 1, "#cfc4a8");
}

// 2 头身 chibi 小人。bob = idle 上下偏移。
function drawChibi(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, bob: number) {
  const y = cy + Math.round(bob);
  // 影子
  ctx.fillStyle = PAL.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 18, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // 身体（衣服）
  px(ctx, cx - 7, y + 4, 14, 12, color);
  px(ctx, cx - 7, y + 4, 14, 2, "rgba(255,255,255,0.18)"); // 高光
  // 头
  px(ctx, cx - 7, y - 9, 14, 13, PAL.skin);
  // 头发
  px(ctx, cx - 7, y - 9, 14, 4, PAL.hair);
  px(ctx, cx - 7, y - 9, 3, 8, PAL.hair);
  px(ctx, cx + 4, y - 9, 3, 8, PAL.hair);
  // 眼睛
  px(ctx, cx - 4, y - 3, 2, 2, "#2a2a2a");
  px(ctx, cx + 2, y - 3, 2, 2, "#2a2a2a");
}

function drawBubble(ctx: CanvasRenderingContext2D, cx: number, topY: number, emoji: string, bob: number) {
  const y = topY + Math.round(bob) - 14;
  // 小气泡底
  px(ctx, cx - 8, y, 16, 12, "#fffaf0");
  px(ctx, cx - 8, y, 16, 12, "rgba(0,0,0,0)");
  ctx.strokeStyle = "rgba(40,30,50,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 7.5, y + 0.5, 15, 11);
  px(ctx, cx - 2, y + 12, 3, 3, "#fffaf0");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "9px sans-serif";
  ctx.fillText(emoji, cx, y + 6);
}

function drawNameTag(ctx: CanvasRenderingContext2D, cx: number, cy: number, name: string, highlight: boolean) {
  ctx.font = "8px 'Fusion Pixel','Zpix',monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const w = Math.max(ctx.measureText(name).width + 8, 22);
  const x = cx - w / 2;
  const y = cy + 22;
  ctx.fillStyle = highlight ? "rgba(201,93,46,0.92)" : PAL.nameBg;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), 11);
  ctx.fillStyle = PAL.nameFg;
  ctx.fillText(name, cx, y + 6);
}

export interface DrawState {
  slots: NpcSlot[];
  hoveredId: PersonaId | null;
  timeMs: number;
}

export function drawScene(ctx: CanvasRenderingContext2D, s: DrawState) {
  ctx.clearRect(0, 0, VW, VH);
  drawFloor(ctx);
  // 先画桌子（在人后面）
  for (const slot of s.slots) drawDesk(ctx, slot.x, slot.y);
  // 按 y 排序画人（y 大的后画，营造深度）
  const ordered = [...s.slots].sort((a, b) => a.y - b.y);
  for (const slot of ordered) {
    const phase = slot.x + slot.y; // 各自错相位
    const bob = Math.sin((s.timeMs / 360) + phase) * 1.4;
    drawChibi(ctx, slot.x, slot.y, slot.color, bob);
    drawBubble(ctx, slot.x, slot.y - 9, slot.emoji, bob);
    drawNameTag(ctx, slot.x, slot.y, slot.name, s.hoveredId === slot.id);
  }
}

/** 命中检测：虚拟坐标点落在哪个 NPC 的可点区域（人 + 名牌）。 */
export function hitTest(slots: NpcSlot[], vx: number, vy: number): PersonaId | null {
  for (const slot of slots) {
    if (vx >= slot.x - 14 && vx <= slot.x + 14 && vy >= slot.y - 14 && vy <= slot.y + 34) {
      return slot.id;
    }
  }
  return null;
}
