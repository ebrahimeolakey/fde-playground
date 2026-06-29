"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Office from "@/components/Office";
import Dialogue from "@/components/Dialogue";
import { PERSONA_ORDER, PERSONAS } from "@/lib/personas";
import type { ChatMessage, PersonaId } from "@/lib/types";

function newSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `s_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export default function Play() {
  const sessionId = useMemo(newSessionId, []);
  const [active, setActive] = useState<PersonaId | null>(null);
  const [histories, setHistories] = useState<Record<string, ChatMessage[]>>({});

  const talked = (id: PersonaId) => (histories[id] ?? []).some((m) => m.role === "user");
  const talkedCount = PERSONA_ORDER.filter(talked).length;
  const allDone = talkedCount === PERSONA_ORDER.length;

  return (
    <main className="game">
      <div className="hud panel">
        <Link href="/" className="home btn">← 退出</Link>
        <div className="hud-quest">
          <span className="txt">
            <b>任务</b> · 摸清这家货代到底卡在哪
          </span>
        </div>
        <div className="hud-prog">
          🗣 已聊 <b>{talkedCount}</b>/4
        </div>
      </div>

      <div className="viewport">
        <Office onSelect={setActive} />
      </div>

      <div className="cast-bar">
        {PERSONA_ORDER.map((id) => (
          <button
            key={id}
            className={`cast-chip ${talked(id) ? "done" : ""}`}
            onClick={() => setActive(id)}
          >
            <span className="dot" />
            <img className="av" src={`/assets/sprites2/char2_${id}.png`} alt="" />
            <span className="nm">{PERSONAS[id].title}</span>
          </button>
        ))}
      </div>

      {allDone && (
        <div className="done-banner panel">
          ✦ 四个人都聊过了。你应该能拼出这家公司<b>真正</b>卡在哪了——接下来就是搭出那个切片。
        </div>
      )}

      {active && (
        <Dialogue
          persona={PERSONAS[active]}
          sessionId={sessionId}
          seed={histories[active] ?? []}
          onPersist={(msgs) => setHistories((h) => ({ ...h, [active]: msgs }))}
          onClose={() => setActive(null)}
        />
      )}
    </main>
  );
}
