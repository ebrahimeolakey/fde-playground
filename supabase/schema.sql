-- FDE 货代擂台 · 采集层（SessionDossier）
-- 见 docs/v1-spec.md §3：v1 只忠实采集，评分后置、动态、人主导。

create table if not exists messages (
  id           bigint generated always as identity primary key,
  session_id   text        not null,
  npc_id       text        not null,
  role         text        not null check (role in ('user', 'assistant')),
  content      text        not null,
  created_at   timestamptz not null default now()
);

create index if not exists messages_session_idx on messages (session_id, created_at);
create index if not exists messages_npc_idx on messages (session_id, npc_id);

-- service role（服务端 /api/chat 用）绕过 RLS；对其余角色 deny-all。
alter table messages enable row level security;

-- 可选：会话级元信息（计时、handle 等），v1 先不强制。
create table if not exists sessions (
  session_id   text primary key,
  handle       text,
  started_at   timestamptz not null default now(),
  meta         jsonb
);
alter table sessions enable row level security;
