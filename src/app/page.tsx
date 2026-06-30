import Link from "next/link";
import { PERSONA_ORDER, PERSONAS } from "@/lib/personas";

export default function Home() {
  return (
    <main className="title-screen">
      <div className="title-card panel">
        <span className="title-kicker">HATCH · FDE 实战擂台</span>
        <h1 className="title-logo">
          货代驻场
          <small>你来当那个 FDE — 摸清这家公司，搭出能跑的切片</small>
        </h1>
        <p className="title-sub">
          一家叫 WAYBOUND 的货代公司一团乱，老板请你来「捋一捋」。
          走进办公室，跟 4 个各有心思的同事打交道，从相互矛盾的信息里摸出真痛点。
        </p>

        <div className="title-cast">
          {PERSONA_ORDER.map((id) => (
            <div className="c" key={id}>
              <div className="pic" style={{ background: PERSONAS[id].color }}>
                <img src={`/assets/sprites2/char2_${id}.png`} alt={PERSONAS[id].title} />
              </div>
              <span>{PERSONAS[id].title}</span>
            </div>
          ))}
        </div>

        <div className="title-steps">
          <div className="h">🎮 怎么玩</div>
          <ol>
            <li><b>点办公室里的同事</b>聊天（老板/主管/业务员/跟单员），每人只知道自己那摊事。</li>
            <li>问对问题，关键信息会自动记进右边的<b>线索笔记本</b>（★ 是核心痛点）。</li>
            <li>线索攒够，点 <b>提交诊断</b>：写下你判断的真痛点+先做什么，<b>主管会对照真相点评打分</b>。</li>
          </ol>
        </div>

        <Link href="/play" className="btn btn-accent title-start">
          ▶ 进办公室
        </Link>
        <p className="title-foot">每个人只知道自己那摊事，没人知道全部真相 · 问对人，问对问题</p>
      </div>
    </main>
  );
}
