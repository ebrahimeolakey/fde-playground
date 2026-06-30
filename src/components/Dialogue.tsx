"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, Persona } from "@/lib/types";
import FontToggle from "./FontToggle";

const CLUE_RE = /\s*\[\[CLUE:([^\]]+)\]\]/g;
const clean = (s: string) => s.replace(CLUE_RE, "");
const extractClues = (s: string) => [...s.matchAll(CLUE_RE)].map((m) => m[1].trim());

export default function Dialogue({
  persona,
  sessionId,
  seed,
  onPersist,
  onClues,
  onClose,
}: {
  persona: Persona;
  sessionId: string;
  seed: ChatMessage[];
  onPersist: (msgs: ChatMessage[]) => void;
  onClues: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    seed.length ? seed : [{ role: "assistant", content: persona.opening }],
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const portrait = `/assets/sprites2/char2_${persona.id}.png`;

  useEffect(() => {
    onPersist(messages);
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const outgoing: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...outgoing, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, npcId: persona.id, messages: outgoing }),
      });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages([...outgoing, { role: "assistant", content: clean(acc) }]);
      }
      const ids = extractClues(acc);
      if (ids.length) onClues(ids);
      if (!clean(acc).trim()) setMessages([...outgoing, { role: "assistant", content: "（……没说话，再问一句试试）" }]);
    } catch {
      setMessages([...outgoing, { role: "assistant", content: "（网络打了个嗝，再说一句试试）" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dlg-backdrop" onClick={onClose}>
      <div className="dlg-window panel" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-bar" style={{ background: persona.color }}>
          <div className="dlg-portrait"><img src={portrait} alt={persona.title} /></div>
          <div className="dlg-name"><b>{persona.name}</b><span>{persona.emoji} {persona.title} · WAYBOUND 货代</span></div>
          <FontToggle />
          <button className="dlg-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        <div className="dlg-log" ref={logRef}>
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.role === "assistant" && <img className="msg-av" src={portrait} alt="" />}
              <div className={`bubble ${busy && m.role === "assistant" && i === messages.length - 1 && !m.content ? "typing" : ""}`}>
                {m.content || (busy && i === messages.length - 1 ? "…" : "")}
              </div>
            </div>
          ))}
        </div>

        <div className="dlg-foot">
          <input
            value={input}
            placeholder={`问问${persona.title}…`}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) send(); }}
            disabled={busy}
          />
          <button className="btn btn-accent" onClick={send} disabled={busy || !input.trim()}>发送</button>
        </div>
      </div>
    </div>
  );
}
