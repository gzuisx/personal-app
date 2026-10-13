-- Etapa 9 (fase 2): testes de campo, metas e diário do centroavante.
-- Só adiciona; nada é apagado. Todas as tabelas têm user_id e segurança por linha.
-- (Tabelas de IA ficam para a migração 0009 ou posterior.)

-- testes de campo T1 a T6 (cada tentativa é uma linha)
create table if not exists public.field_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('T1', 'T2', 'T3', 'T4', 'T5', 'T6')),
  pe text check (pe in ('direito', 'esquerdo')),
  subtipo text,
  valor numeric not null,
  unidade text not null,
  tentativa integer not null default 1,
  falhas integer,
  nota text,
  data date not null,
  created_at timestamptz not null default now()
);

create index if not exists field_tests_user_data_idx on public.field_tests (user_id, data);

alter table public.field_tests enable row level security;
drop policy if exists "dono acessa field_tests" on public.field_tests;
create policy "dono acessa field_tests" on public.field_tests
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- metas (ex.: sprint de 20 m, salto vertical); o valor atual vem dos testes
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chave text not null,
  titulo text not null,
  tipo_teste text check (tipo_teste in ('T1', 'T2', 'T3', 'T4', 'T5', 'T6')),
  subtipo text,
  pe text check (pe in ('direito', 'esquerdo')),
  inicial numeric,
  alvo numeric not null,
  unidade text not null,
  menor_melhor boolean not null default false,
  prazo date,
  created_at timestamptz not null default now(),
  unique (user_id, chave)
);

alter table public.goals enable row level security;
drop policy if exists "dono acessa goals" on public.goals;
create policy "dono acessa goals" on public.goals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- diário do centroavante (um por data de jogo)
create table if not exists public.game_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  jogo_data date not null,
  finalizacoes integer,
  gols integer,
  assistencias integer,
  arrancadas integer,
  olhadas integer check (olhadas between 1 and 5),
  movimentacao integer check (movimentacao between 1 and 5),
  condicao integer check (condicao between 1 and 5),
  bom text[] not null default '{}',
  melhorar text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, jogo_data)
);

alter table public.game_stats enable row level security;
drop policy if exists "dono acessa game_stats" on public.game_stats;
create policy "dono acessa game_stats" on public.game_stats
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
