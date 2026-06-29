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

const NAV = [
  ["📋", "公司概况"], ["🧑‍💼", "客户管理"], ["📦", "订单管理"],
  ["🚚", "运输管理"], ["💰", "财务管理"], ["📊", "数据报表"], ["⚙️", "系统设置"],
];
const TODOS = [
  ["📨", "报价请求", "2个", "00:45"], ["📑", "订舱确认", "3个", "01:20"],
  ["🧾", "提单确认", "1个", "00:30"], ["💴", "费用审核", "2个", "01:15"],
];
const ACTIONS = [["🧑‍🤝‍🧑", "招募员工"], ["📖", "培训员工"], ["🤝", "拓展客户"], ["📣", "市场推广"], ["🏢", "升级办公室"]];
const WD = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function Play() {
  const sessionId = useMemo(newSessionId, []);
  const [active, setActive] = useState<PersonaId | null>(null);
  const [histories, setHistories] = useState<Record<string, ChatMessage[]>>({});
  const [day, setDay] = useState(0);
  const [nav, setNav] = useState(0);
  const [toast, setToast] = useState("");

  const talked = (id: PersonaId) => (histories[id] ?? []).some((m) => m.role === "user");
  const talkedCount = PERSONA_ORDER.filter(talked).length;

  const date = useMemo(() => {
    const base = new Date(2025, 4, 20);
    base.setDate(base.getDate() + day);
    return { y: base.getFullYear(), m: base.getMonth() + 1, d: base.getDate(), w: WD[base.getDay()] };
  }, [day]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1600);
  };

  return (
    <div className="dash">
      {/* 顶部资源条 */}
      <div className="topbar panel">
        <div className="brand">
          <span className="ico">✈</span>
          <span className="t"><b>FD 货代擂台</b><span>Freight Forwarder Playground</span></span>
        </div>
        <span className="datechip">{date.y}年 {date.m}月{date.d}日<br />{date.w}　14:30</span>
        <div className="resources">
          <span className="res"><span className="i">💰</span>¥1,250,000</span>
          <span className="res"><span className="i">😊</span>85</span>
          <span className="res"><span className="i">👥</span>{PERSONA_ORDER.length}/20</span>
        </div>
        <button className="btn gear" onClick={() => flash("⚙️ 设置敬请期待")}>⚙️</button>
      </div>

      {/* 主体三栏 */}
      <div className="body">
        <nav className="nav panel">
          {NAV.map(([i, label], idx) => (
            <button key={label} className={`nav-item ${idx === nav ? "active" : ""}`} onClick={() => { setNav(idx); if (idx !== 0) flash(`「${label}」敬请期待`); }}>
              <span className="i">{i}</span>{label}
            </button>
          ))}
        </nav>

        <div className="stage">
          <Office onSelect={setActive} />
        </div>

        <div className="side">
          <div className="card panel">
            <div className="card-h">📌 待办事项</div>
            <div className="card-b">
              {TODOS.map(([i, nm, ct, tm]) => (
                <div className="todo-row" key={nm}>
                  <span className="i">{i}</span>
                  <span className="nm">{nm}</span>
                  <span className="ct">{ct}</span>
                  <span className="tm">{tm}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card panel">
            <div className="card-h">📈 公司 KPIs</div>
            <div className="card-b">
              <KpiText label="月度营收" v="¥2,850,000" />
              <KpiText label="毛利润" v="¥620,000" />
              <KpiText label="利润率" v="21.8%" />
              <KpiBar label="客户满意度" pct={85} />
              <KpiBar label="准时交付率" pct={92} />
              <KpiBar label="需求摸清度" pct={(talkedCount / PERSONA_ORDER.length) * 100} note={`${talkedCount}/4`} />
            </div>
          </div>
        </div>
      </div>

      {/* 底部条 */}
      <div className="bottombar">
        <div className="notice panel">
          <div className="h">📣 公司公告</div>
          <p>[5/20] 欢迎来到 FD 货代擂台！点办公室里的同事，跟他聊。</p>
          <p>[5/20] 摸清这家公司到底卡在哪——已聊 {talkedCount}/4。</p>
        </div>
        <div className="actions panel">
          {ACTIONS.map(([i, label]) => (
            <button className="act" key={label} onClick={() => flash(`「${label}」敬请期待`)}>
              <span className="i">{i}</span>{label}
            </button>
          ))}
        </div>
        <button className="btn btn-accent nextday" onClick={() => { setDay((d) => d + 1); flash("🌅 新的一天"); }}>
          ▶ 下一天
        </button>
      </div>

      <Link href="/" style={{ position: "fixed", left: 10, bottom: 10, fontSize: 11, color: "var(--ink2)", textDecoration: "none" }}>← 退出</Link>

      {toast && <div className="toast panel">{toast}</div>}

      {active && (
        <Dialogue
          persona={PERSONAS[active]}
          sessionId={sessionId}
          seed={histories[active] ?? []}
          onPersist={(msgs) => setHistories((h) => ({ ...h, [active]: msgs }))}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}

function KpiText({ label, v }: { label: string; v: string }) {
  return (
    <div className="kpi-row">
      <div className="top"><span>{label}</span><span className="v">{v}</span></div>
    </div>
  );
}
function KpiBar({ label, pct, note }: { label: string; pct: number; note?: string }) {
  return (
    <div className="kpi-row">
      <div className="top"><span>{label}</span><span className="v">{note ?? `${Math.round(pct)}%`}</span></div>
      <div className="bar"><i style={{ width: `${Math.max(3, pct)}%` }} /></div>
    </div>
  );
}
