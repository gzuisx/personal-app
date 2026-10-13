-- Etapa 8 (fase 2): motor do coach, exceções de agenda, rotina, propostas e registro de decisões.
-- Só adiciona; nada é apagado. Todas as tabelas têm user_id e segurança por linha.

-- exceções de agenda (seção 11.1): jogo extra, jogo cancelado, viagem, feriado, funcional cancelado,
-- dia sem academia e ajustes de exercício do dia (adicionar ou trocar)
create table if not exists public.calendar_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null,
  tipo text not null check (
    tipo in (
      'jogo_extra',
      'jogo_cancelado',
      'trabalho_presencial_extra',
      'viagem',
      'feriado',
      'funcional_cancelado',
      'sem_academia',
      'exercicio_extra',
      'exercicio_trocado'
    )
  ),
  hora text,
  nota text,
  slug text,
  substitui text,
  bloco text,
  created_at timestamptz not null default now()
);

create index if not exists calendar_overrides_user_data_idx on public.calendar_overrides (user_id, data);

alter table public.calendar_overrides enable row level security;
drop policy if exists "dono acessa calendar_overrides" on public.calendar_overrides;
create policy "dono acessa calendar_overrides" on public.calendar_overrides
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- rotina do Gabriel (horários), editável no Perfil
create table if not exists public.routine (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.routine enable row level security;
drop policy if exists "dono acessa routine" on public.routine;
create policy "dono acessa routine" on public.routine
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- propostas do motor de regras (sem IA): progressão de carga, fase, descarga e plano
create table if not exists public.coach_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chave_unica text not null,
  tipo text not null check (tipo in ('progressao_carga', 'fase', 'descarga', 'plano')),
  status text not null default 'pendente' check (status in ('pendente', 'aceita', 'adiada', 'recusada', 'expirada')),
  regra text,
  titulo text not null,
  resumo text,
  criterios jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  adiada_ate date,
  criada_em timestamptz not null default now(),
  decidida_em timestamptz,
  unique (user_id, chave_unica)
);

create index if not exists coach_proposals_user_status_idx on public.coach_proposals (user_id, status);

alter table public.coach_proposals enable row level security;
drop policy if exists "dono acessa coach_proposals" on public.coach_proposals;
create policy "dono acessa coach_proposals" on public.coach_proposals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- registro de cada decisão (aceitar, adiar, recusar) para revisar depois
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  evento text not null,
  detalhes jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists audit_log_user_idx on public.audit_log (user_id, criado_em desc);

alter table public.audit_log enable row level security;
drop policy if exists "dono acessa audit_log" on public.audit_log;
create policy "dono acessa audit_log" on public.audit_log
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
