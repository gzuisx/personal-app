-- Etapa 6 (fase 2): correções, decisões e visual alvo. Só adiciona; nada é apagado.

-- C5: fase do tornozelo guardada no banco (só muda por proposta aceita).
alter table public.profiles add column if not exists fase_tornozelo smallint not null default 1
  check (fase_tornozelo between 1 and 4);
alter table public.profiles add column if not exists fase_inicio date not null default '2026-10-13';

-- C6: restrições na tabela própria (a coluna profiles.dados continua guardada).
alter table public.restrictions add column if not exists chave text;
alter table public.restrictions add column if not exists lado text;
alter table public.restrictions add column if not exists tipo text;
alter table public.restrictions add column if not exists nivel_dor smallint not null default 0;
alter table public.restrictions add column if not exists status text;
create unique index if not exists restrictions_user_chave_key on public.restrictions (user_id, chave);

-- migra o JSON antigo (profiles.dados -> restricoes) sem duplicar
insert into public.restrictions (user_id, chave, regiao, lado, tipo, nivel_dor, status, ativa)
select p.user_id,
       r ->> 'id',
       r ->> 'regiao',
       r ->> 'lado',
       r ->> 'tipo',
       coalesce((r ->> 'nivelDor')::smallint, 0),
       r ->> 'status',
       true
from public.profiles p
cross join lateral jsonb_array_elements(coalesce(p.dados -> 'restricoes', '[]'::jsonb)) r
where r ->> 'id' is not null
  and not exists (
    select 1 from public.restrictions x where x.user_id = p.user_id and x.chave = r ->> 'id'
  );

-- quem não tem nenhuma restrição ganha o tornozelo direito
insert into public.restrictions (user_id, chave, regiao, lado, tipo, nivel_dor, status, ativa)
select p.user_id, 'tornozelo-direito', 'Tornozelo direito', 'direito', 'lesão', 0,
       'Em recuperação (torção há cerca de 3 anos)', true
from public.profiles p
where not exists (select 1 from public.restrictions x where x.user_id = p.user_id);

-- C6: marcos da jornada com título e critério no banco
create table if not exists public.milestone_defs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chave text not null,
  titulo text not null,
  criterio text not null default '',
  auto text,
  ordem smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, chave)
);

alter table public.milestone_defs enable row level security;
drop policy if exists "dono acessa milestone_defs" on public.milestone_defs;
create policy "dono acessa milestone_defs" on public.milestone_defs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.seed_marcos_padrao(uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.milestone_defs (user_id, chave, titulo, criterio, auto, ordem) values
    (uid, '30-dias-sem-dor', '30 dias sem dor acima de 3', '30 dias seguidos com check-in e dor até 3, sem inchaço nem falha.', 'dias_30', 1),
    (uid, 'jogo-completo-sem-dor', 'Primeiro jogo completo sem dor', 'Jogo de 70 min ou mais com dor depois de até 1.', 'jogo_completo', 2),
    (uid, 'jogo-sem-dor-chute', 'Primeiro jogo sem dor depois do chute', 'Jogo em que você chutou e a dor depois ficou em 1 ou menos. Confirme você mesmo.', null, 3),
    (uid, 'rotina-10-dias', '10 dias seguidos de rotina de tornozelo', 'Rotina de tornozelo registrada como feita em 10 dias seguidos.', 'rotina_10', 4),
    (uid, 'equilibrio-sem-falha', 'Teste de equilíbrio sem falha', 'Teste T3 com 0 falhas nos dois pés, olhos fechados.', 'teste_equilibrio', 5),
    (uid, 'simetria-90', 'Simetria de 90% ou mais no salto unipodal', 'Teste T5: o pé mais fraco chega a 90% ou mais do mais forte.', 'simetria_salto', 6),
    (uid, 'corrida-lancada', 'Primeira corrida lançada sem queixa', 'Corrida em velocidade máxima sem dor no tornozelo nem no posterior. Confirme você mesmo.', null, 7),
    (uid, 'sprint-100', 'Sprint a 100% sem dor', 'Arrancadas a 100% sem dor no tornozelo. Confirme você mesmo.', null, 8)
  on conflict (user_id, chave) do nothing;
end;
$$;

revoke all on function public.seed_marcos_padrao(uuid) from public, anon, authenticated;

select public.seed_marcos_padrao(id) from auth.users;

-- novos usuários também ganham plano base e marcos
create or replace function public.criar_profile_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  perform public.seed_plano_padrao(new.id);
  perform public.seed_marcos_padrao(new.id);
  insert into public.restrictions (user_id, chave, regiao, lado, tipo, nivel_dor, status, ativa)
  values (new.id, 'tornozelo-direito', 'Tornozelo direito', 'direito', 'lesão', 0,
          'Em recuperação (torção há cerca de 3 anos)', true)
  on conflict (user_id, chave) do nothing;
  return new;
end;
$$;

-- C8: registro do aquecimento pré-jogo (um por data de jogo)
create table if not exists public.pre_game_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id uuid references public.games (id) on delete set null,
  jogo_data date not null,
  aquecimento_concluido boolean not null default false,
  fases_concluidas smallint not null default 0,
  duracao_s integer not null default 0,
  tornozeleira boolean,
  created_at timestamptz not null default now(),
  unique (user_id, jogo_data)
);

create index if not exists pre_game_logs_user_data_idx on public.pre_game_logs (user_id, jogo_data desc);

alter table public.pre_game_logs enable row level security;
drop policy if exists "dono acessa pre_game_logs" on public.pre_game_logs;
create policy "dono acessa pre_game_logs" on public.pre_game_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- seção 9.4: onde e como a dor aparece, e "posterior apertou"
alter table public.checkins add column if not exists regioes text[] not null default '{}';
alter table public.checkins add column if not exists movimentos text[] not null default '{}';
alter table public.checkins add column if not exists duracao_dor text
  check (duracao_dor in ('menos_1min', '5_10min', 'dia_todo'));
alter table public.checkins add column if not exists posterior_apertou boolean;

-- 24.4: o check-in do dia seguinte fica vinculado ao jogo
alter table public.checkins add column if not exists jogo_id uuid references public.games (id) on delete set null;

-- jogos: esforço percebido e status
alter table public.games add column if not exists esforco_pos_jogo smallint
  check (esforco_pos_jogo between 0 and 10);
alter table public.games add column if not exists status text not null default 'jogado'
  check (status in ('agendado', 'jogado', 'cancelado'));
