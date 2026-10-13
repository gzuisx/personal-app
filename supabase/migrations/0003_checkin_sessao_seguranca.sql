-- Etapa 3: campos do check-in e da sessão, regras de segurança e dados extras do perfil.

-- checkins: dor_tornozelo, inchaco, energia (1-5) e notas já existem na 0001.
alter table public.checkins add column if not exists falhou boolean not null default false;
alter table public.checkins add column if not exists sono_faixa text
  check (sono_faixa in ('menos_5', '5_6', '7_8', 'mais_8'));
alter table public.checkins add column if not exists gatilho text
  check (gatilho in ('chute', 'giro', 'terreno', 'nenhum', 'nao_sei'));

-- session_logs: um registro por bloco do plano em cada dia.
alter table public.session_logs add column if not exists bloco text;
alter table public.session_logs add column if not exists resultado text
  check (resultado in ('feito', 'parcial', 'nao_fiz'));
alter table public.session_logs add column if not exists esforco smallint
  check (esforco between 0 and 10);
alter table public.session_logs add column if not exists duracao_min smallint
  check (duracao_min >= 0);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'session_logs_user_data_bloco_key'
  ) then
    alter table public.session_logs
      add constraint session_logs_user_data_bloco_key unique (user_id, data, bloco);
  end if;
end $$;

-- Regras de segurança do tornozelo (limites editáveis só pelo próprio usuário, no Perfil).
create table if not exists public.safety_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  limite_bloqueio smallint not null default 6 check (limite_bloqueio between 1 and 10),
  limite_atencao smallint not null default 4 check (limite_atencao between 1 and 10),
  inchaco_bloqueia boolean not null default true,
  falhou_bloqueia boolean not null default true,
  updated_at timestamptz not null default now(),
  check (limite_atencao <= limite_bloqueio)
);

alter table public.safety_settings enable row level security;

drop policy if exists "dono acessa safety_settings" on public.safety_settings;
create policy "dono acessa safety_settings" on public.safety_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Perfil: idade, peso, altura, posição, focos e restrições ficam em um JSON.
alter table public.profiles add column if not exists dados jsonb not null default '{}'::jsonb;
