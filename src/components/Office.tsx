"use client";

import { useEffect, useRef, useState } from "react";
import { PERSONAS } from "@/lib/personas";
import type { PersonaId } from "@/lib/types";
import { VW, VH, SLOTS, drawScene, hitTest, type NpcSlot } from "./office-draw";

const slots: NpcSlot[] = SLOTS.map((s) => {
  const p = PERSONAS[s.id];
  return { ...s, name: p.title, title: p.title, emoji: p.emoji, color: p.color };
});

export default function Office({ onSelect }: { onSelect: (id: PersonaId) => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef<PersonaId | null>(null);
  const scaleRef = useRef(2);
  const [cursorPointer, setCursorPointer] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const avail = wrap.clientWidth;
      const scale = Math.max(1, Math.min(5, Math.floor(avail / VW)));
      scaleRef.current = scale;
      canvas.width = VW * scale * dpr;
      canvas.height = VH * scale * dpr;
      canvas.style.width = `${VW * scale}px`;
      canvas.style.height = `${VH * scale}px`;
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };

    const loop = (t: number) => {
      drawScene(ctx, { slots, hoveredId: hoverRef.current, timeMs: t });
      raf = requestAnimationFrame(loop);
    };

    resize();
    raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const toVirtual = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const s = scaleRef.current;
    return { vx: (clientX - rect.left) / s, vy: (clientY - rect.top) / s };
  };

  const onMove = (e: React.PointerEvent) => {
    const { vx, vy } = toVirtual(e.clientX, e.clientY);
    const hit = hitTest(slots, vx, vy);
    hoverRef.current = hit;
    setCursorPointer(Boolean(hit));
  };

  const onClick = (e: React.PointerEvent) => {
    const { vx, vy } = toVirtual(e.clientX, e.clientY);
    const hit = hitTest(slots, vx, vy);
    if (hit) onSelect(hit);
  };

  return (
    <div ref={wrapRef} className="office-wrap">
      <canvas
        ref={canvasRef}
        className="office-canvas"
        style={{ cursor: cursorPointer ? "pointer" : "default" }}
        onPointerMove={onMove}
        onPointerDown={onClick}
        onPointerLeave={() => {
          hoverRef.current = null;
          setCursorPointer(false);
        }}
      />
      <p className="office-hint">点工位上的同事，跟他聊 · 摸清这家货代到底卡在哪</p>
    </div>
  );
}
