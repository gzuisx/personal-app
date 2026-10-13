// Gera supabase/migrations/0002_exercicios_e_plano.sql a partir de src/lib/seed/plano.ts.
// Uso: npx tsx scripts/gerar-seed-sql.ts
import { writeFileSync } from "node:fs";
import { EXERCICIOS, diaDoPlano } from "../src/lib/seed/plano";

const q = (v: string | null | undefined) => (v == null ? "null" : `'${v.replaceAll("'", "''")}'`);

// Semana 1 do plano (fase 1), segunda a domingo.
const SEMANA = [
  "2026-10-12",
  "2026-10-13",
  "2026-10-14",
  "2026-10-15",
  "2026-10-16",
  "2026-10-17",
  "2026-10-18",
];

const dias = SEMANA.map(diaDoPlano);

const exerciciosUsados = new Map<string, (typeof EXERCICIOS)[string]>();
for (const slug of Object.keys(EXERCICIOS)) exerciciosUsados.set(slug, EXERCICIOS[slug]);

const valoresExercicios = [...exerciciosUsados.values()]
  .map((e) => `    (uid, ${q(e.slug)}, ${q(e.nome)}, ${q(e.grupo)}, ${q(e.tipo)}, ${q(e.observacoes)})`)
  .join(",\n");

const conteudo = {
  descricao: "Plano base (fase 1, semana 1). O app calcula a fase e a semana pela data.",
  semana: dias.map((d) => ({
    dia_semana: d.diaSemana === 0 ? 7 : d.diaSemana,
    titulo: d.titulo,
    blocos: d.blocos.map((b) => b.id),
  })),
};

const valoresWorkouts: string[] = [];
let ordem = 0;
for (const d of dias) {
  for (const b of d.blocos) {
    const exercicios = b.exercicios.map((e) => ({
      slug: e.slug,
      series: e.series ?? null,
      repeticoes: e.repeticoes,
      observacao: e.observacao ?? null,
    }));
    const tags = `array[${b.tags.map(q).join(", ")}]::text[]`;
    valoresWorkouts.push(
      `    (uid, pid, ${d.diaSemana === 0 ? 7 : d.diaSemana}, ${q(b.titulo)}, ${q(b.id)}, ${q(b.periodo)}, ${b.duracaoMin}, ${tags}, $ex$${JSON.stringify(exercicios)}$ex$::jsonb, ${ordem++})`,
    );
  }
}

const sql = `-- Etapa 2: catálogo de exercícios e plano base.
-- Gerado por scripts/gerar-seed-sql.ts a partir de src/lib/seed/plano.ts. Não edite à mão.
-- O app lê o plano do código (que muda de fase pela data); estas tabelas guardam a cópia base
-- para a IA e para consultas futuras.

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  nome text not null,
  grupo text not null,
  tipo text not null check (tipo in ('tornozelo', 'forca', 'velocidade', 'mobilidade', 'funcional')),
  observacoes text,
  media_url text,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists exercises_user_id_idx on public.exercises (user_id);

alter table public.exercises enable row level security;

drop policy if exists "dono acessa exercises" on public.exercises;
create policy "dono acessa exercises" on public.exercises
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.workouts add column if not exists bloco_id text;
alter table public.workouts add column if not exists periodo text;
alter table public.workouts add column if not exists duracao_min smallint;
alter table public.workouts add column if not exists tags text[] not null default '{}';

-- Cria o plano base de um usuário. Idempotente: não duplica se já existir.
create or replace function public.seed_plano_padrao(uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid;
begin
  if exists (select 1 from public.plans where user_id = uid and nome = 'Plano Meu Personal') then
    return;
  end if;

  insert into public.exercises (user_id, slug, nome, grupo, tipo, observacoes) values
${valoresExercicios}
  on conflict (user_id, slug) do nothing;

  insert into public.plans (user_id, nome, ativo, conteudo)
  values (uid, 'Plano Meu Personal', true, $plano$${JSON.stringify(conteudo)}$plano$::jsonb)
  returning id into pid;

  insert into public.workouts (user_id, plan_id, dia_semana, titulo, bloco_id, periodo, duracao_min, tags, exercicios, ordem) values
${valoresWorkouts.join(",\n")};
end;
$$;

revoke all on function public.seed_plano_padrao(uuid) from public, anon, authenticated;

-- Quem já existe ganha o plano agora; quem entrar depois ganha no primeiro login.
select public.seed_plano_padrao(id) from auth.users;

create or replace function public.criar_profile_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict (user_id) do nothing;
  perform public.seed_plano_padrao(new.id);
  return new;
end;
$$;
`;

writeFileSync(new URL("../supabase/migrations/0002_exercicios_e_plano.sql", import.meta.url), sql);
console.log("0002 gerada:", valoresWorkouts.length, "blocos,", exerciciosUsados.size, "exercícios");
