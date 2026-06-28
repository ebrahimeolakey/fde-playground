"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, Persona } from "@/lib/types";

export default function Dialogue({
  persona,
  sessionId,
  seed,
  onPersist,
  onClose,
}: {
  persona: Persona;
  sessionId: string;
  seed: ChatMessage[];
  onPersist: (msgs: ChatMessage[]) => void;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    seed.length ? seed : [{ role: "assistant", content: persona.opening }],
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onPersist(messages);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
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
        setMessages([...outgoing, { role: "assistant", content: acc }]);
      }
      if (!acc.trim()) {
        setMessages([...outgoing, { role: "assistant", content: "（……没说话，再问一句试试）" }]);
      }
    } catch {
      setMessages([...outgoing, { role: "assistant", content: "（网络打了个嗝，再说一句试试）" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dlg-backdrop" onClick={onClose}>
      <div className="dlg-panel" onClick={(e) => e.stopPropagation()}>
        <div className="dlg-head" style={{ background: persona.color }}>
          <span className="dlg-chip">{persona.emoji}</span>
          <span className="dlg-name">{persona.name}</span>
          <button className="dlg-x" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="dlg-body" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`dlg-row ${m.role}`}>
              <div className="dlg-bubble">
                {m.content || (busy && i === messages.length - 1 ? <span className="dlg-typing">…</span> : "")}
              </div>
            </div>
          ))}
        </div>

        <div className="dlg-input">
          <input
            value={input}
            placeholder={`问问${persona.title}…`}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) send();
            }}
            disabled={busy}
          />
          <button onClick={send} disabled={busy || !input.trim()}>
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
