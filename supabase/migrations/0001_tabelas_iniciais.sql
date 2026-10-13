-- Tabelas iniciais do app de treino.
-- Toda tabela tem user_id e segurança por linha (RLS): cada usuário só vê e altera as próprias linhas.

-- profiles ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  nome text,
  created_at timestamptz not null default now()
);

-- restrictions: limitações físicas (ex.: tornozelo direito) -------------
create table public.restrictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  regiao text not null,
  descricao text,
  fase smallint not null default 1,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- plans: plano de treino -------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  conteudo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- workouts: treinos do plano (um por dia da semana) ----------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 1 and 7), -- 1 = segunda ... 7 = domingo
  titulo text not null,
  exercicios jsonb not null default '[]'::jsonb,
  ordem smallint not null default 0,
  created_at timestamptz not null default now()
);

-- session_logs: registro de cada treino feito ----------------------------
create table public.session_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id uuid references public.workouts (id) on delete set null,
  data date not null default current_date,
  concluido boolean not null default false,
  falhou boolean not null default false,
  dor_tornozelo smallint check (dor_tornozelo between 0 and 10),
  inchaco boolean not null default false,
  detalhes jsonb not null default '{}'::jsonb,
  notas text,
  created_at timestamptz not null default now()
);

-- games: jogos ------------------------------------------------------------
create table public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data_hora timestamptz not null,
  adversario text,
  local text,
  minutos_jogados smallint check (minutos_jogados between 0 and 200),
  dor_tornozelo smallint check (dor_tornozelo between 0 and 10),
  notas text,
  created_at timestamptz not null default now()
);

-- checkins: como o corpo está no dia -------------------------------------
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null default current_date,
  dor_tornozelo smallint check (dor_tornozelo between 0 and 10),
  inchaco boolean not null default false,
  energia smallint check (energia between 1 and 5),
  sono smallint check (sono between 1 and 5),
  notas text,
  created_at timestamptz not null default now(),
  unique (user_id, data)
);

-- índices ------------------------------------------------------------------
create index restrictions_user_id_idx on public.restrictions (user_id);
create index plans_user_id_idx on public.plans (user_id);
create index workouts_user_id_idx on public.workouts (user_id);
create index workouts_plan_id_idx on public.workouts (plan_id);
create index session_logs_user_data_idx on public.session_logs (user_id, data desc);
create index games_user_data_idx on public.games (user_id, data_hora desc);

-- segurança por linha ------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.restrictions enable row level security;
alter table public.plans enable row level security;
alter table public.workouts enable row level security;
alter table public.session_logs enable row level security;
alter table public.games enable row level security;
alter table public.checkins enable row level security;

create policy "dono acessa profiles" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dono acessa restrictions" on public.restrictions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dono acessa plans" on public.plans
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dono acessa workouts" on public.workouts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dono acessa session_logs" on public.session_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dono acessa games" on public.games
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dono acessa checkins" on public.checkins
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- cria o profile sozinho quando um usuário entra pela primeira vez ---------
create or replace function public.criar_profile_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_profile_novo_usuario();
