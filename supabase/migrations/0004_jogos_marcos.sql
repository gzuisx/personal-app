-- Etapas 4 e 5: jogos (gatilho e chave única por horário) e marcos da jornada do tornozelo.

-- games: data_hora, minutos_jogados, dor_tornozelo e notas já existem na 0001.
alter table public.games add column if not exists gatilho text
  check (gatilho in ('chute', 'giro', 'terreno', 'nenhum', 'nao_sei'));

create unique index if not exists games_user_data_hora_key on public.games (user_id, data_hora);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chave text not null,
  concluido_em date,
  created_at timestamptz not null default now(),
  unique (user_id, chave)
);

create index if not exists milestones_user_id_idx on public.milestones (user_id);

alter table public.milestones enable row level security;

drop policy if exists "dono acessa milestones" on public.milestones;
create policy "dono acessa milestones" on public.milestones
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
