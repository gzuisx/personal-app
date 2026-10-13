// Gera supabase/migrations/0006_treino_guiado.sql (catálogo e plano v2) a partir do código.
// Uso: npx tsx scripts/gerar-0006-sql.ts
import { writeFileSync } from "node:fs";
import { CATALOGO } from "../src/lib/seed/catalogo";
import { diaDoPlano } from "../src/lib/seed/plano";

const q = (v: string | null | undefined) => (v == null ? "null" : `'${v.replaceAll("'", "''")}'`);
const arr = (a: string[]) => (a.length ? `array[${a.map(q).join(", ")}]::text[]` : "'{}'::text[]");

const valoresCatalogo = CATALOGO.map(
  (c) =>
    `    (uid, ${q(c.id)}, ${q(c.nome)}, ${q(c.grupo)}, ${q(c.tipo)}, ${arr(c.equipamento)}, ${c.nivel}, ${c.faseMinima}, ${q(c.impacto)}, ${arr(c.contraindicacoes)}, ${q(c.progressao)}, ${q(c.regressao)}, ${arr(c.alternativas)}, ${c.series}, ${q(c.reps)}, ${c.tempoS ?? "null"}, ${c.descansoS}, ${q(c.comoFazer.join(" "))}, ${q(c.cuidado)}, null, ${q(c.licenca)})`,
).join(",\n");

// Semana 1 do plano v2 (fase 1), segunda a domingo.
const SEMANA = [
  "2026-10-12",
  "2026-10-13",
  "2026-10-14",
  "2026-10-15",
  "2026-10-16",
  "2026-10-17",
  "2026-10-18",
];
const dias = SEMANA.map((i) => diaDoPlano(i, { fase: 1 }));

let ordem = 0;
const valoresWorkouts = dias
  .flatMap((d) =>
    d.blocos.map((b) => {
      const exercicios = b.exercicios.map((e) => ({
        slug: e.slug,
        series: e.series ?? null,
        repeticoes: e.repeticoes,
        observacao: e.observacao ?? null,
      }));
      return `    (uid, pid, ${d.diaSemana === 0 ? 7 : d.diaSemana}, ${q(b.titulo)}, ${q(b.id)}, ${q(b.periodo)}, ${b.duracaoMin}, ${arr(b.tags)}, $ex$${JSON.stringify(exercicios)}$ex$::jsonb, ${ordem++})`;
    }),
  )
  .join(",\n");

const conteudo = {
  descricao: "Plano base v2 (fase 1, semana 1): manhã dividida em blocos de tornozelo, força e mobilidade.",
  semana: dias.map((d) => ({
    dia_semana: d.diaSemana === 0 ? 7 : d.diaSemana,
    titulo: d.titulo,
    blocos: d.blocos.map((b) => b.id),
  })),
};

const sql = `-- Etapa 7 (fase 2): treino guiado, catálogo de exercícios, versões de plano e retomada.
-- Gerado por scripts/gerar-0006-sql.ts a partir de src/lib/seed/catalogo.ts e plano.ts. Não edite à mão.
-- Só adiciona: nada é apagado. O plano da migração 0002 apenas passa a "inativo" (continua guardado).

-- séries registradas no treino guiado (uma linha por série)
create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  execucao_id text not null,
  session_log_id uuid references public.session_logs (id) on delete set null,
  data date not null,
  bloco text not null,
  exercicio text not null,
  numero_serie smallint not null check (numero_serie >= 1),
  carga_kg numeric(6, 2),
  reps smallint,
  duracao_s integer,
  rir smallint check (rir between 0 and 4),
  esforco text check (esforco in ('facil', 'ok', 'duro')),
  dor_durante smallint check (dor_durante between 0 and 10),
  criado_em timestamptz not null default now(),
  unique (user_id, execucao_id, exercicio, numero_serie)
);

create index if not exists set_logs_user_exercicio_idx on public.set_logs (user_id, exercicio, data desc);
create index if not exists set_logs_user_data_idx on public.set_logs (user_id, data desc);

alter table public.set_logs enable row level security;
drop policy if exists "dono acessa set_logs" on public.set_logs;
create policy "dono acessa set_logs" on public.set_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- catálogo de exercícios
create table if not exists public.exercise_catalog (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  nome text not null,
  grupo text not null,
  tipo text not null check (tipo in ('tornozelo', 'forca', 'velocidade', 'potencia', 'mobilidade', 'core', 'bola', 'visao')),
  equipamento text[] not null default '{}',
  nivel smallint not null default 1 check (nivel between 1 and 5),
  fase_minima smallint not null default 1 check (fase_minima between 1 and 4),
  impacto text not null default 'baixo' check (impacto in ('baixo', 'medio', 'alto')),
  contraindicacoes text[] not null default '{}',
  progressao text,
  regressao text,
  alternativas text[] not null default '{}',
  series_padrao smallint not null default 3,
  reps_padrao text,
  tempo_padrao_s integer,
  descanso_s integer not null default 60,
  como_fazer text,
  cuidado text,
  media_url text,
  licenca text,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists exercise_catalog_user_idx on public.exercise_catalog (user_id);

alter table public.exercise_catalog enable row level security;
drop policy if exists "dono acessa exercise_catalog" on public.exercise_catalog;
create policy "dono acessa exercise_catalog" on public.exercise_catalog
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- modelos de plano (P1 a P7; preenchidos na etapa 8)
create table if not exists public.plan_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chave text not null,
  nome text not null,
  descricao text,
  estrutura jsonb not null default '{}'::jsonb,
  quando_recomendar text,
  quando_sair text,
  duracao_dias integer,
  created_at timestamptz not null default now(),
  unique (user_id, chave)
);

alter table public.plan_templates enable row level security;
drop policy if exists "dono acessa plan_templates" on public.plan_templates;
create policy "dono acessa plan_templates" on public.plan_templates
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- versões do plano: aceitar uma proposta cria uma nova versão; o plano base nunca é editado em silêncio
create table if not exists public.plan_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid references public.plans (id) on delete set null,
  template_id uuid references public.plan_templates (id) on delete set null,
  chave_template text,
  inicio date not null,
  fim date,
  origem text not null default 'base' check (origem in ('base', 'proposta', 'manual')),
  ativo boolean not null default true,
  conteudo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists plan_versions_user_idx on public.plan_versions (user_id, inicio desc);

alter table public.plan_versions enable row level security;
drop policy if exists "dono acessa plan_versions" on public.plan_versions;
create policy "dono acessa plan_versions" on public.plan_versions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- estado da execução (para retomar o treino ou a sequência interrompida): no máximo uma por usuário
create table if not exists public.execution_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  execucao_id text not null,
  tipo text not null default 'bloco' check (tipo in ('bloco', 'sequencia')),
  passo_atual text,
  estado jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

alter table public.execution_state enable row level security;
drop policy if exists "dono acessa execution_state" on public.execution_state;
create policy "dono acessa execution_state" on public.execution_state
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- sementes (idempotentes)
create or replace function public.seed_catalogo_padrao(uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.exercise_catalog (user_id, slug, nome, grupo, tipo, equipamento, nivel, fase_minima, impacto, contraindicacoes, progressao, regressao, alternativas, series_padrao, reps_padrao, tempo_padrao_s, descanso_s, como_fazer, cuidado, media_url, licenca) values
${valoresCatalogo}
  on conflict (user_id, slug) do nothing;
end;
$$;

revoke all on function public.seed_catalogo_padrao(uuid) from public, anon, authenticated;

create or replace function public.seed_plano_v2(uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid;
begin
  if exists (select 1 from public.plans where user_id = uid and nome = 'Plano Meu Personal v2') then
    return;
  end if;

  update public.plans set ativo = false where user_id = uid and nome = 'Plano Meu Personal';

  insert into public.plans (user_id, nome, ativo, conteudo)
  values (uid, 'Plano Meu Personal v2', true, $plano$${JSON.stringify(conteudo)}$plano$::jsonb)
  returning id into pid;

  insert into public.workouts (user_id, plan_id, dia_semana, titulo, bloco_id, periodo, duracao_min, tags, exercicios, ordem) values
${valoresWorkouts};

  insert into public.plan_versions (user_id, plan_id, chave_template, inicio, origem, ativo, conteudo)
  values (uid, pid, 'P1', date '2026-10-13', 'base', true, '{"descricao": "Plano base"}'::jsonb);
end;
$$;

revoke all on function public.seed_plano_v2(uuid) from public, anon, authenticated;

select public.seed_catalogo_padrao(id) from auth.users;
select public.seed_plano_v2(id) from auth.users;

create or replace function public.criar_profile_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  perform public.seed_plano_padrao(new.id);
  perform public.seed_plano_v2(new.id);
  perform public.seed_catalogo_padrao(new.id);
  perform public.seed_marcos_padrao(new.id);
  insert into public.restrictions (user_id, chave, regiao, lado, tipo, nivel_dor, status, ativa)
  values (new.id, 'tornozelo-direito', 'Tornozelo direito', 'direito', 'lesão', 0,
          'Em recuperação (torção há cerca de 3 anos)', true)
  on conflict (user_id, chave) do nothing;
  return new;
end;
$$;
`;

writeFileSync(new URL("../supabase/migrations/0006_treino_guiado.sql", import.meta.url), sql);
console.log("0006 gerada:", CATALOGO.length, "exercícios no catálogo,", ordem, "blocos no plano v2");
