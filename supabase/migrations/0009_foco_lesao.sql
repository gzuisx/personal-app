-- Etapa 11 (ampliada): foco de lesão. A rotina gira em torno da lesão principal do momento.
-- Só adiciona; nada é apagado. profiles.fase_tornozelo e profiles.fase_inicio continuam (leitura compatível).

create table if not exists public.injury_focus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  regiao text not null check (regiao in ('tornozelo', 'posterior_coxa', 'panturrilha')),
  lado text not null default 'direito' check (lado in ('direito', 'esquerdo')),
  inicio date not null default current_date,
  fase smallint not null default 1 check (fase between 1 and 4),
  -- quando a fase atual começou (a fase só muda por proposta aceita)
  fase_inicio date not null default current_date,
  ativo boolean not null default true,
  notas text,
  criado_em timestamptz not null default now()
);

create index if not exists injury_focus_user_idx on public.injury_focus (user_id);
-- no máximo um foco ativo por usuário
create unique index if not exists injury_focus_um_ativo_idx on public.injury_focus (user_id) where ativo;

alter table public.injury_focus enable row level security;
drop policy if exists "dono le injury_focus" on public.injury_focus;
create policy "dono le injury_focus" on public.injury_focus
  for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "dono insere injury_focus" on public.injury_focus;
create policy "dono insere injury_focus" on public.injury_focus
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "dono atualiza injury_focus" on public.injury_focus;
create policy "dono atualiza injury_focus" on public.injury_focus
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "dono apaga injury_focus" on public.injury_focus;
create policy "dono apaga injury_focus" on public.injury_focus
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- foco inicial de quem já existe: o tornozelo direito, com a fase guardada no perfil
insert into public.injury_focus (user_id, regiao, lado, inicio, fase, fase_inicio, ativo, notas)
select p.user_id, 'tornozelo', 'direito', date '2026-10-13', coalesce(p.fase_tornozelo, 1),
  coalesce(p.fase_inicio, date '2026-10-13'), true,
  'Foco inicial criado a partir do perfil (migração 0009).'
from public.profiles p
where not exists (select 1 from public.injury_focus f where f.user_id = p.user_id and f.ativo);

-- check-in: com outro foco, a dor da região do foco fica em dor_foco e o tornozelo continua em dor_tornozelo
alter table public.checkins add column if not exists dor_foco smallint check (dor_foco between 0 and 10);
alter table public.checkins add column if not exists foco_regiao text
  check (foco_regiao in ('tornozelo', 'posterior_coxa', 'panturrilha'));
