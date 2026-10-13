-- Etapa 7 (fase 2): treino guiado, catálogo de exercícios, versões de plano e retomada.
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
    (uid, 'joelho-parede', 'Joelho na parede', 'Tornozelo', 'mobilidade', array['nenhum']::text[], 1, 1, 'baixo', '{}'::text[], 'alongamento-panturrilha-degrau', null, array['alongamento-panturrilha-degrau', 'circulos-tornozelo']::text[], 2, '10', null, 30, 'Pé a um palmo da parede, calcanhar no chão. Leve o joelho até tocar a parede sem erguer o calcanhar.', 'Se o calcanhar subir, afaste o pé um pouco.', null, 'conteúdo próprio'),
    (uid, 'alongamento-panturrilha-degrau', 'Alongamento de panturrilha no degrau', 'Tornozelo', 'mobilidade', array['nenhum']::text[], 1, 1, 'baixo', '{}'::text[], null, 'joelho-parede', array['joelho-parede']::text[], 2, '30 s', 30, 30, 'Ponta do pé no degrau, calcanhar para fora. Desça o calcanhar devagar, com o joelho esticado e depois dobrado.', 'Segure só até sentir esticar, sem dor.', null, 'conteúdo próprio'),
    (uid, 'circulos-tornozelo', 'Círculos de tornozelo controlados', 'Tornozelo', 'mobilidade', array['nenhum']::text[], 1, 1, 'baixo', '{}'::text[], null, 'joelho-parede', array['joelho-parede']::text[], 2, '10', null, 20, 'Sentado, pé no ar, desenhe círculos grandes com o pé. Faça 10 para cada lado, sem pressa.', 'Movimento amplo e lento; pare se doer.', null, 'conteúdo próprio'),
    (uid, 'el-fora', 'Elástico: pé para fora', 'Tornozelo', 'tornozelo', array['elastico']::text[], 1, 1, 'baixo', '{}'::text[], 'isometria-eversao-parede', null, array['isometria-eversao-parede', 'el-dentro']::text[], 3, '15', null, 45, 'Elástico preso ao lado de dentro do pé, perna esticada. Leve o pé para fora devagar e volte contando 3 s.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'el-dentro', 'Elástico: pé para dentro', 'Tornozelo', 'tornozelo', array['elastico']::text[], 1, 1, 'baixo', '{}'::text[], null, null, array['el-fora']::text[], 3, '15', null, 45, 'Elástico preso ao lado de fora do pé. Leve o pé para dentro devagar e volte contando 3 s.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'el-cima', 'Elástico: pé para cima', 'Tornozelo', 'tornozelo', array['elastico']::text[], 1, 1, 'baixo', '{}'::text[], null, null, array['el-baixo']::text[], 3, '15', null, 45, 'Elástico preso à frente do pé. Puxe a ponta do pé para cima e volte devagar.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'el-baixo', 'Elástico: ponta do pé para baixo', 'Tornozelo', 'tornozelo', array['elastico']::text[], 1, 1, 'baixo', '{}'::text[], null, null, array['el-cima']::text[], 3, '15', null, 45, 'Elástico no peito do pé, preso atrás de você. Empurre a ponta do pé para baixo e volte devagar.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'isometria-eversao-parede', 'Isometria de eversão contra a parede', 'Tornozelo', 'tornozelo', array['nenhum']::text[], 2, 1, 'baixo', '{}'::text[], null, 'el-fora', array['el-fora']::text[], 3, '20 s', 20, 30, 'Lado de fora do pé contra a parede, joelho esticado. Empurre a parede com o pé e segure sem mexer a perna.', 'Força moderada, sem dor.', null, 'conteúdo próprio'),
    (uid, 'pant-degrau', 'Panturrilha no degrau', 'Tornozelo', 'tornozelo', array['degrau']::text[], 2, 1, 'baixo', '{}'::text[], 'pant-um-pe', 'caminhada-pontas', array['caminhada-pontas']::text[], 3, '12', null, 45, 'Pontas dos pés no degrau, suba nas pontas. Desça contando 3 s até o calcanhar passar do degrau.', 'Segure em algo para se equilibrar.', null, 'conteúdo próprio'),
    (uid, 'pant-um-pe', 'Panturrilha em um pé só', 'Tornozelo', 'tornozelo', array['degrau']::text[], 3, 2, 'baixo', '{}'::text[], 'pant-um-pe-carga', 'pant-degrau', array['pant-degrau']::text[], 3, '10', null, 45, 'Em um pé no degrau, suba nas pontas com o joelho esticado. Repita com o joelho dobrado, descendo devagar.', 'Se a dor passar de 3, volte para os dois pés.', null, 'conteúdo próprio'),
    (uid, 'pant-um-pe-carga', 'Panturrilha em um pé com carga', 'Tornozelo', 'tornozelo', array['degrau', 'halter']::text[], 4, 3, 'baixo', '{}'::text[], 'pant-descida-lenta', 'pant-um-pe', array['pant-um-pe']::text[], 3, '8', null, 60, 'Em um pé, segure um halter ou mochila no lado do pé. Suba nas pontas e desça devagar.', 'Carga leve primeiro; sem dor.', null, 'conteúdo próprio'),
    (uid, 'pant-descida-lenta', 'Panturrilha com descida lenta (4 s)', 'Tornozelo', 'tornozelo', array['degrau']::text[], 4, 3, 'baixo', '{}'::text[], null, 'pant-um-pe-carga', array['pant-um-pe']::text[], 3, '8', null, 60, 'Suba com os dois pés e tire um. Desça só com o pé de teste, contando 4 s.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'caminhada-pontas', 'Caminhada nas pontas dos pés', 'Tornozelo', 'tornozelo', array['nenhum']::text[], 1, 1, 'baixo', '{}'::text[], 'pant-degrau', null, array['pant-degrau']::text[], 2, '20 passos', null, 30, 'Caminhe nas pontas dos pés, com o corpo alto. Depois repita nos calcanhares, com a ponta do pé para cima.', 'Passos curtos e controlados.', null, 'conteúdo próprio'),
    (uid, 'eq-um-pe', 'Equilíbrio em um pé só (direito)', 'Tornozelo', 'tornozelo', array['nenhum']::text[], 1, 1, 'baixo', '{}'::text[], 'eq-olhos-fechados', null, array['eq-olhos-fechados']::text[], 3, '30 s', 30, 30, 'Em pé só no pé direito, joelho levemente dobrado. Olhe para um ponto fixo e mantenha o quadril parado.', 'Fique perto de uma parede para se apoiar.', null, 'conteúdo próprio'),
    (uid, 'eq-olhos-fechados', 'Equilíbrio em um pé, olhos fechados', 'Tornozelo', 'tornozelo', array['nenhum']::text[], 3, 1, 'baixo', '{}'::text[], 'eq-almofada-simples', 'eq-um-pe', array['eq-um-pe']::text[], 3, '20 s', 20, 30, 'No pé direito, feche os olhos depois de firmar. Conte as vezes que o outro pé tocar o chão.', 'Só com uma parede por perto.', null, 'conteúdo próprio'),
    (uid, 'eq-almofada-simples', 'Equilíbrio na almofada', 'Tornozelo', 'tornozelo', array['nenhum']::text[], 3, 2, 'baixo', '{}'::text[], 'eq-almofada', 'eq-um-pe', array['eq-um-pe']::text[], 3, '30 s', 30, 30, 'Em um pé sobre uma almofada firme ou toalha dobrada. Mantenha o joelho alinhado com o pé.', 'Almofada firme e perto de apoio.', null, 'conteúdo próprio'),
    (uid, 'eq-almofada', 'Equilíbrio na almofada passando a bola', 'Tornozelo', 'tornozelo', array['nenhum']::text[], 4, 2, 'baixo', '{}'::text[], 'eq-perturbacao', 'eq-almofada-simples', array['eq-almofada-simples']::text[], 3, '30 s', 30, 30, 'Em um pé na almofada, passe a bola contra a parede. Receba e passe sem perder o equilíbrio.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'eq-perturbacao', 'Equilíbrio com perturbações leves', 'Tornozelo', 'tornozelo', array['nenhum']::text[], 5, 3, 'baixo', '{}'::text[], null, 'eq-almofada', array['eq-almofada']::text[], 3, '30 s', 30, 30, 'Em um pé, alguém passa a bola de ângulos diferentes. Controle o corpo sem apoiar o outro pé.', 'Comece com passes lentos.', null, 'conteúdo próprio'),
    (uid, 'alcance-multidirecional', 'Alcance multidirecional', 'Tornozelo', 'tornozelo', array['nenhum']::text[], 3, 2, 'baixo', '{}'::text[], null, null, array['eq-um-pe']::text[], 2, '5 por direção', null, 30, 'Em um pé, toque o chão à frente, ao lado e atrás com o outro pé. Volte ao centro entre cada toque, sem se apoiar.', 'Alcance só até onde controla.', null, 'conteúdo próprio'),
    (uid, 'saltinhos-lugar', 'Saltinhos no lugar', 'Tornozelo', 'tornozelo', array['nenhum']::text[], 3, 2, 'medio', array['dor lateral >= 4']::text[], 'salto-bipodal-aterrissagem', null, array['pant-degrau']::text[], 3, '10', null, 45, 'Saltos curtos nas pontas dos pés, sem tirar o corpo do lugar. Aterrisse macio, com joelho levemente dobrado.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'salto-bipodal-aterrissagem', 'Salto e aterrissagem controlada nos dois pés', 'Tornozelo', 'tornozelo', array['nenhum']::text[], 4, 3, 'medio', array['dor lateral >= 4']::text[], 'salto-aterrissagem', 'saltinhos-lugar', array['saltinhos-lugar']::text[], 3, '8', null, 60, 'Salte para cima e aterrisse nos dois pés, parando 2 s. Joelhos para frente, nunca para dentro.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'salto-aterrissagem', 'Saltos e aterrissagens em um pé só', 'Tornozelo', 'tornozelo', array['nenhum']::text[], 4, 3, 'alto', array['dor lateral >= 4', 'semáforo diferente de verde']::text[], 'salto-lateral', 'salto-bipodal-aterrissagem', array['salto-bipodal-aterrissagem']::text[], 3, '8', null, 60, 'Salte em um pé e aterrisse no mesmo pé, firme por 2 s. Quadril estável, joelho alinhado.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'salto-lateral', 'Saltos laterais e mudanças de direção', 'Tornozelo', 'tornozelo', array['nenhum']::text[], 5, 3, 'alto', array['dor lateral >= 4', 'semáforo diferente de verde']::text[], 'zigue-zague-lento', 'salto-aterrissagem', array['salto-aterrissagem']::text[], 3, '8', null, 60, 'Salte de lado a lado sobre uma linha, em um pé. Comece devagar e aumente a velocidade só se estiver firme.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'zigue-zague-lento', 'Zigue-zague em cones, devagar', 'Tornozelo', 'tornozelo', array['cones', 'campo']::text[], 4, 3, 'medio', array['dor lateral >= 4']::text[], 'mudanca-direcao', null, array['salto-lateral']::text[], 3, '4 voltas', null, 60, 'Contorne 5 cones, a um metro um do outro, em trote leve. Olhe à frente, não para os pés.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'mudanca-direcao', 'Mudança de direção com desaceleração', 'Tornozelo', 'tornozelo', array['cones', 'campo']::text[], 5, 3, 'alto', array['dor lateral >= 4', 'semáforo diferente de verde']::text[], 'giros-com-bola', null, array['zigue-zague-lento']::text[], 4, '1 corrida', null, 90, 'Corra 8 m, desacelere em 2 passos e troque de direção. Apoie o pé de fora com o joelho alinhado.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'giros-com-bola', 'Giros com bola', 'Bola', 'bola', array['campo', 'cones']::text[], 4, 3, 'medio', '{}'::text[], null, null, array['conducao-slalom']::text[], 4, '6 giros', null, 60, 'Receba a bola de costas para o cone e gire para os dois lados. Primeiro toque já na direção do giro.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'stiff', 'Stiff (levantamento terra romeno)', 'Posterior de coxa', 'forca', array['halter', 'barra', 'academia']::text[], 2, 1, 'baixo', '{}'::text[], 'stiff-unilateral', null, array['ponte-gluteo', 'stiff-unilateral']::text[], 3, '8', null, 90, 'Joelhos levemente dobrados, leve o quadril para trás com as costas retas. Desça até sentir esticar atrás da coxa e volte apertando o glúteo.', 'Costas neutras; pare se doer na lombar.', null, 'conteúdo próprio'),
    (uid, 'stiff-unilateral', 'Stiff em uma perna', 'Posterior de coxa', 'forca', array['halter']::text[], 3, 2, 'baixo', '{}'::text[], null, 'stiff', array['stiff']::text[], 3, '8 por perna', null, 90, 'Em uma perna, leve o tronco à frente e a outra perna para trás. Volte controlando, sem girar o quadril.', 'Comece sem peso para testar o equilíbrio.', null, 'conteúdo próprio'),
    (uid, 'ponte-gluteo', 'Ponte de glúteo', 'Posterior de coxa', 'forca', array['nenhum']::text[], 1, 1, 'baixo', '{}'::text[], 'ponte-flexao-joelho', null, array['elev-quadril']::text[], 3, '12', null, 60, 'Deitado, pés no chão, suba o quadril apertando o glúteo. Segure 1 s no alto e desça devagar.', 'Não arqueie a lombar no alto.', null, 'conteúdo próprio'),
    (uid, 'ponte-flexao-joelho', 'Ponte com flexão de joelho (toalha)', 'Posterior de coxa', 'forca', array['nenhum']::text[], 3, 1, 'baixo', '{}'::text[], 'nordica-assistida', 'ponte-gluteo', array['ponte-gluteo']::text[], 3, '8', null, 75, 'Calcanhares em uma toalha no chão, suba o quadril. Deslize os calcanhares para perto do glúteo e volte.', 'Se o posterior apertar, reduza a amplitude.', null, 'conteúdo próprio'),
    (uid, 'flexora', 'Flexora (elástico, slider ou nórdica assistida)', 'Posterior de coxa', 'forca', array['elastico', 'academia']::text[], 3, 1, 'baixo', '{}'::text[], 'nordica-excentrica', 'ponte-flexao-joelho', array['ponte-flexao-joelho', 'nordica-assistida']::text[], 3, '6 a 8', null, 90, 'Controle a descida do corpo ou da carga contando 3 s. Suba com ajuda do elástico ou das mãos, se precisar.', 'Pare se o posterior da coxa doer.', null, 'conteúdo próprio'),
    (uid, 'nordica-assistida', 'Flexora nórdica assistida (elástico)', 'Posterior de coxa', 'forca', array['elastico']::text[], 4, 2, 'baixo', '{}'::text[], 'nordica-excentrica', 'ponte-flexao-joelho', array['flexora']::text[], 3, '6', null, 90, 'Ajoelhado com os pés presos, desça o corpo devagar com ajuda do elástico. Segure no chão com as mãos e volte.', 'Desça só até onde controla.', null, 'conteúdo próprio'),
    (uid, 'nordica-excentrica', 'Flexora nórdica excêntrica completa', 'Posterior de coxa', 'forca', array['nenhum']::text[], 5, 3, 'baixo', '{}'::text[], null, 'nordica-assistida', array['nordica-assistida']::text[], 3, '5', null, 120, 'Ajoelhado com os pés presos, desça o corpo inteiro o mais devagar possível. Amorteça no chão com as mãos e volte.', 'Exercício forte: só com o posterior sem queixa.', null, 'conteúdo próprio'),
    (uid, 'isometria-posterior', 'Isometria de posterior em 30 graus', 'Posterior de coxa', 'forca', array['nenhum']::text[], 2, 1, 'baixo', '{}'::text[], null, null, array['ponte-gluteo']::text[], 3, '20 s', 20, 45, 'Calcanhar no chão, joelho levemente dobrado, empurre o calcanhar para baixo. Segure sem mexer a perna.', 'Força moderada, sem dor.', null, 'conteúdo próprio'),
    (uid, 'pant-pe-sentado', 'Panturrilha em pé e sentado', 'Panturrilha', 'forca', array['degrau', 'halter']::text[], 2, 1, 'baixo', '{}'::text[], null, null, array['pant-degrau']::text[], 3, '12 a 15', null, 60, 'Suba nas pontas dos pés, devagar, e desça contando 3 s. Faça metade em pé e metade sentado, com carga no joelho.', 'Movimento lento e completo.', null, 'conteúdo próprio'),
    (uid, 'pant-excentrica', 'Panturrilha excêntrica lenta', 'Panturrilha', 'forca', array['degrau']::text[], 3, 1, 'baixo', '{}'::text[], null, null, array['pant-pe-sentado']::text[], 3, '10', null, 60, 'Suba com os dois pés e desça com um só, em 4 s. Troque de pé a cada série.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'pogo', 'Pogo jumps (saltos curtos)', 'Panturrilha', 'potencia', array['nenhum']::text[], 4, 3, 'medio', array['dor lateral >= 4', 'semáforo diferente de verde']::text[], null, null, array['saltinhos-lugar']::text[], 3, '15', null, 60, 'Saltos rápidos e baixos, só com o movimento do tornozelo. Joelhos quase esticados, contato curto com o chão.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'agachamento-goblet', 'Agachamento goblet', 'Coxa', 'forca', array['halter']::text[], 2, 1, 'baixo', '{}'::text[], 'bulgaro', null, array['agach-isometrico-parede']::text[], 3, '10', null, 90, 'Segure o peso junto ao peito e agache com as costas retas. Joelhos na direção dos pés; suba empurrando o chão.', 'Calcanhares no chão.', null, 'conteúdo próprio'),
    (uid, 'bulgaro', 'Afundo búlgaro ou step-up', 'Coxa', 'forca', array['halter', 'degrau']::text[], 3, 1, 'baixo', '{}'::text[], null, 'step-up', array['step-up', 'agachamento-goblet']::text[], 3, '8 por perna', null, 90, 'Pé de trás apoiado atrás, desça o joelho de trás perto do chão. Suba empurrando com a perna da frente.', 'Joelho da frente alinhado com o pé.', null, 'conteúdo próprio'),
    (uid, 'step-up', 'Step-up', 'Coxa', 'forca', array['degrau', 'halter']::text[], 2, 1, 'baixo', '{}'::text[], 'bulgaro', null, array['agachamento-goblet']::text[], 3, '8 por perna', null, 75, 'Suba no degrau com uma perna e fique em pé em cima. Desça devagar com a mesma perna.', 'Degrau firme e estável.', null, 'conteúdo próprio'),
    (uid, 'agach-isometrico-parede', 'Agachamento isométrico na parede', 'Coxa', 'forca', array['nenhum']::text[], 2, 1, 'baixo', '{}'::text[], null, null, array['agachamento-goblet']::text[], 3, '30 s', 30, 60, 'Costas na parede, joelhos a 90 graus, pés à frente. Segure respirando normalmente.', 'Desça só até um ângulo confortável.', null, 'conteúdo próprio'),
    (uid, 'agach-uma-perna', 'Agachamento em uma perna e saltinhos no lugar', 'Coxa', 'forca', array['nenhum']::text[], 4, 2, 'medio', array['dor lateral >= 4']::text[], null, 'step-up', array['step-up', 'eq-um-pe']::text[], 3, '10', null, 75, 'Em um pé, agache até onde controla e suba. Depois faça saltinhos curtos no lugar, no mesmo pé.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'hip-thrust', 'Hip thrust', 'Glúteo', 'forca', array['halter', 'barra']::text[], 2, 1, 'baixo', '{}'::text[], null, null, array['ponte-gluteo']::text[], 3, '10', null, 90, 'Costas apoiadas em um banco, peso no quadril. Suba o quadril apertando o glúteo e desça devagar.', 'Queixo para o peito, sem arquear a lombar.', null, 'conteúdo próprio'),
    (uid, 'elev-quadril', 'Elevação de quadril', 'Glúteo e posterior', 'forca', array['nenhum']::text[], 2, 1, 'baixo', '{}'::text[], 'ponte-flexao-joelho', null, array['ponte-gluteo']::text[], 3, '8 a 10', null, 60, 'Deitado, suba o quadril com os pés no chão. Segure 1 s no alto e desça controlando.', 'Pare se doer na lombar.', null, 'conteúdo próprio'),
    (uid, 'abducao-elastico', 'Abdução de quadril com elástico', 'Glúteo', 'forca', array['elastico']::text[], 1, 1, 'baixo', '{}'::text[], null, null, array['clamshell']::text[], 3, '15', null, 45, 'Elástico acima dos joelhos, em pé, afaste uma perna para o lado. Volte devagar, sem inclinar o tronco.', 'Quadril parado.', null, 'conteúdo próprio'),
    (uid, 'clamshell', 'Clamshell', 'Glúteo', 'forca', array['elastico']::text[], 1, 1, 'baixo', '{}'::text[], null, null, array['abducao-elastico']::text[], 3, '15', null, 45, 'Deitado de lado, joelhos dobrados, abra o joelho de cima. Os pés ficam juntos; o quadril não gira.', 'Movimento curto e firme.', null, 'conteúdo próprio'),
    (uid, 'caminhada-lateral-elastico', 'Caminhada lateral com elástico', 'Glúteo', 'forca', array['elastico']::text[], 1, 1, 'baixo', '{}'::text[], null, null, array['abducao-elastico']::text[], 3, '12 passos', null, 45, 'Elástico acima dos joelhos, agachamento leve. Dê passos laterais mantendo o elástico esticado.', 'Joelhos alinhados com os pés.', null, 'conteúdo próprio'),
    (uid, 'prancha', 'Prancha', 'Core', 'core', array['nenhum']::text[], 2, 1, 'baixo', '{}'::text[], 'prancha-lateral', null, array['dead-bug']::text[], 3, '30 a 45 s', 30, 45, 'Antebraços e pontas dos pés no chão, corpo em linha reta. Aperte o abdômen e respire normalmente.', 'Não deixe o quadril cair.', null, 'conteúdo próprio'),
    (uid, 'prancha-lateral', 'Prancha lateral', 'Core', 'core', array['nenhum']::text[], 3, 1, 'baixo', '{}'::text[], null, 'prancha', array['prancha']::text[], 3, '20 s', 20, 45, 'De lado, apoie o antebraço e suba o quadril. Corpo em linha reta; troque de lado.', 'Ombro sobre o cotovelo.', null, 'conteúdo próprio'),
    (uid, 'dead-bug', 'Dead bug', 'Core', 'core', array['nenhum']::text[], 2, 1, 'baixo', '{}'::text[], null, null, array['prancha']::text[], 3, '8 por lado', null, 45, 'Deitado, braços para cima e joelhos a 90 graus. Estique braço e perna opostos devagar, sem arquear a lombar.', 'Lombar colada no chão.', null, 'conteúdo próprio'),
    (uid, 'pallof', 'Pallof press com elástico', 'Core', 'core', array['elastico']::text[], 3, 1, 'baixo', '{}'::text[], null, null, array['prancha']::text[], 3, '10 por lado', null, 45, 'De lado para o elástico, empurre as mãos à frente do peito. Não deixe o elástico girar o seu tronco.', 'Quadril e ombros parados.', null, 'conteúdo próprio'),
    (uid, 'abdominal-rotacao', 'Abdominal com rotação', 'Core', 'core', array['nenhum']::text[], 2, 1, 'baixo', '{}'::text[], null, null, array['dead-bug']::text[], 3, '12', null, 45, 'Deitado, suba o tronco girando um cotovelo para o joelho oposto. Alterne os lados com controle.', 'Não puxe o pescoço com as mãos.', null, 'conteúdo próprio'),
    (uid, 'supino', 'Supino ou flexão', 'Peito', 'forca', array['halter', 'barra', 'academia']::text[], 2, 1, 'baixo', '{}'::text[], null, null, array['flexao']::text[], 3, '8 a 10', null, 90, 'Empurre o peso ou o corpo a partir do peito, cotovelos a 45 graus. Desça contando 2 s e suba firme.', 'Deixe 2 repetições de reserva.', null, 'conteúdo próprio'),
    (uid, 'flexao', 'Flexão de braços', 'Peito', 'forca', array['nenhum']::text[], 2, 1, 'baixo', '{}'::text[], null, null, array['supino']::text[], 3, '8 a 10', null, 75, 'Mãos sob os ombros, corpo em linha reta. Desça o peito até perto do chão e suba.', 'Apoie os joelhos se não conseguir manter a linha.', null, 'conteúdo próprio'),
    (uid, 'remada', 'Remada', 'Costas', 'forca', array['halter', 'barra', 'academia', 'elastico']::text[], 2, 1, 'baixo', '{}'::text[], null, null, array['puxada']::text[], 3, '8 a 10', null, 90, 'Tronco inclinado, puxe o peso até a lateral do corpo. Junte as escápulas e desça devagar.', 'Costas retas; deixe 2 repetições de reserva.', null, 'conteúdo próprio'),
    (uid, 'desenvolvimento', 'Desenvolvimento', 'Ombros', 'forca', array['halter', 'barra', 'academia']::text[], 2, 1, 'baixo', '{}'::text[], null, null, array['flexao']::text[], 3, '8 a 10', null, 90, 'Empurre os pesos de cima dos ombros até esticar os braços. Desça devagar até a altura das orelhas.', 'Core firme, sem arquear a lombar.', null, 'conteúdo próprio'),
    (uid, 'puxada', 'Puxada ou barra', 'Costas', 'forca', array['academia', 'barra', 'elastico']::text[], 3, 1, 'baixo', '{}'::text[], null, null, array['remada']::text[], 3, '8', null, 90, 'Puxe a barra ou o elástico até a altura do queixo. Controle a volta, sem balançar.', 'Deixe 2 repetições de reserva.', null, 'conteúdo próprio'),
    (uid, 'vel-aquecimento', 'Aquecimento de velocidade', 'Velocidade', 'velocidade', array['nenhum']::text[], 1, 1, 'baixo', '{}'::text[], null, null, '{}'::text[], 1, '15 min', 900, 0, 'Mobilidade, corrida leve e skipping. Termine com 2 a 3 progressivas até quase a velocidade máxima.', 'Não pule o aquecimento.', null, 'conteúdo próprio'),
    (uid, 'skipping', 'Skipping técnico', 'Velocidade', 'velocidade', array['campo']::text[], 1, 1, 'medio', '{}'::text[], null, null, '{}'::text[], 3, '15 m', null, 45, 'Eleve o joelho e apoie na ponta do pé, com cadência rápida. Braços em oposição, tronco alto.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'vel-arrancadas', 'Arrancadas de 10 a 20 m', 'Velocidade', 'velocidade', array['campo']::text[], 3, 1, 'alto', array['dor lateral >= 4', 'posterior apertou', 'semáforo diferente de verde']::text[], null, null, array['aceleracao-3-pontos']::text[], 6, '10 a 20 m', null, 120, 'Varie a saída: parado, de costas, depois de girar ou de deslocamento lateral. Acelere nos primeiros passos, tronco inclinado.', 'Pare se a dor passar de 3 em 10 ou se o posterior apertar.', null, 'conteúdo próprio'),
    (uid, 'aceleracao-3-pontos', 'Aceleração em 3 pontos', 'Velocidade', 'velocidade', array['campo', 'cones']::text[], 3, 1, 'alto', '{}'::text[], null, null, array['vel-arrancadas']::text[], 4, '10 m', null, 90, 'Três cones em linha, acelere do primeiro ao último. Aumente a velocidade a cada cone.', 'Comece a 80% da velocidade.', null, 'conteúdo próprio'),
    (uid, 'vel-fechamento', 'Arrancadas com finalização', 'Velocidade', 'velocidade', array['campo']::text[], 4, 1, 'alto', array['dor lateral >= 4', 'posterior apertou']::text[], null, null, array['vel-arrancadas']::text[], 3, '1 arrancada + finalização', null, 120, 'Arrancada de 10 a 15 m seguida de finalização em condição de jogo. Chute com o tornozelo firme, sem forçar o gesto.', 'Se doer ao chutar, pare e avise no check-in.', null, 'conteúdo próprio'),
    (uid, 'salto-vertical', 'Salto vertical', 'Potência', 'potencia', array['nenhum']::text[], 4, 3, 'alto', array['semáforo diferente de verde']::text[], null, null, array['salto-bipodal-aterrissagem']::text[], 3, '5', null, 90, 'Agache rápido e salte o mais alto que puder, braços ajudando. Aterrisse macio nos dois pés.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'salto-horizontal', 'Salto horizontal', 'Potência', 'potencia', array['nenhum']::text[], 4, 3, 'alto', array['semáforo diferente de verde']::text[], null, null, array['salto-bipodal-aterrissagem']::text[], 3, '5', null, 90, 'Salte para frente o mais longe possível e firme a aterrissagem. Marque a distância e tente repetir.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'box-jump-baixo', 'Box jump baixo', 'Potência', 'potencia', array['degrau']::text[], 4, 3, 'alto', array['semáforo diferente de verde']::text[], null, null, array['salto-vertical']::text[], 3, '5', null, 90, 'Salte em uma caixa baixa (20 a 30 cm) e aterrisse em cima. Desça andando, sem saltar para baixo.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'arremesso-medicinal', 'Arremesso de bola medicinal', 'Potência', 'potencia', array['halter']::text[], 3, 1, 'baixo', '{}'::text[], null, null, array['flexao']::text[], 3, '6', null, 75, 'Arremesse a bola contra a parede com o corpo todo. Pegue de volta e repita.', 'Pés firmes no chão.', null, 'conteúdo próprio'),
    (uid, 'conducao-slalom', 'Condução em slalom', 'Bola', 'bola', array['campo', 'cones']::text[], 1, 1, 'medio', '{}'::text[], null, null, array['controle-orientado']::text[], 4, '1 volta', null, 45, 'Conduza a bola entre cones, com toques curtos dos dois pés. Cabeça erguida, olhando para frente.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'controle-orientado', 'Controle orientado', 'Bola', 'bola', array['campo']::text[], 1, 1, 'baixo', '{}'::text[], null, null, array['tabela-parede']::text[], 3, '8', null, 45, 'Receba a bola e já tire o primeiro toque para o lado livre. Olhe antes de receber.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'giro-costas', 'Giro de costas para o zagueiro', 'Bola', 'bola', array['campo']::text[], 1, 1, 'medio', '{}'::text[], null, null, array['protecao-bola']::text[], 3, '6', null, 60, 'Receba de costas, proteja com o corpo e gire para o lado livre. Primeiro toque já na direção da finalização.', 'Pare se a dor passar de 3 em 10.', null, 'conteúdo próprio'),
    (uid, 'protecao-bola', 'Proteção de bola', 'Bola', 'bola', array['campo']::text[], 1, 1, 'baixo', '{}'::text[], null, null, array['controle-orientado']::text[], 3, '30 s', 30, 45, 'Mantenha a bola protegida com o corpo contra um colega. Apoios firmes e braço de fora aberto.', 'Sem tranco forte nas primeiras semanas.', null, 'conteúdo próprio'),
    (uid, 'tabela-parede', 'Tabela na parede', 'Bola', 'bola', array['campo']::text[], 1, 1, 'baixo', '{}'::text[], null, null, array['controle-orientado']::text[], 3, '20', null, 45, 'Passe de primeira contra a parede e receba de volta. Alterne o pé de passe.', 'Aumente a força dos chutes aos poucos.', null, 'conteúdo próprio'),
    (uid, 'finalizacao-primeira', 'Finalização de primeira', 'Bola', 'bola', array['campo']::text[], 1, 2, 'medio', array['dor ao chutar']::text[], null, null, array['tabela-parede']::text[], 3, '6', null, 60, 'Bola rolando de lado: chute de primeira no gol. Depois de giro e com o pé não dominante, aos poucos.', 'Se o tornozelo doer ao chutar, pare e registre no check-in.', null, 'conteúdo próprio'),
    (uid, 'scan', 'Scan antes de receber', 'Visão de jogo', 'visao', array['campo']::text[], 1, 1, 'baixo', '{}'::text[], null, null, array['estudo-sem-bola']::text[], 3, '10 recepções', null, 30, 'Antes de cada recepção, olhe por cima dos dois ombros. Conte quantas vezes você olhou.', 'Olhar rápido e sem perder a bola.', null, 'conteúdo próprio'),
    (uid, 'estudo-sem-bola', 'Estudo de movimento sem bola', 'Visão de jogo', 'visao', array['nenhum']::text[], 1, 1, 'baixo', '{}'::text[], null, null, '{}'::text[], 1, '10 min', 600, 0, 'Assista a gols de centroavantes olhando só o movimento sem bola. Anote 2 movimentos que você pode copiar.', 'Sem celular durante o treino de campo.', null, 'conteúdo próprio'),
    (uid, 'anotacao-pos-jogo', 'Anotação pós-jogo', 'Visão de jogo', 'visao', array['nenhum']::text[], 1, 1, 'baixo', '{}'::text[], null, null, '{}'::text[], 1, '5 min', 300, 0, 'Anote 2 decisões boas e 2 que poderiam melhorar. Releia antes do próximo jogo.', 'Curto e honesto.', null, 'conteúdo próprio'),
    (uid, 'mob-quadril', 'Mobilidade de quadril (90/90)', 'Mobilidade', 'mobilidade', array['nenhum']::text[], 1, 1, 'baixo', '{}'::text[], null, null, '{}'::text[], 2, '10', null, 20, 'Sentado com as duas pernas a 90 graus, gire o quadril de um lado para o outro. Mantenha o tronco alto.', 'Movimento suave, sem dor.', null, 'conteúdo próprio'),
    (uid, 'mob-posterior', 'Mobilidade dinâmica de posteriores e panturrilha', 'Mobilidade', 'mobilidade', array['nenhum']::text[], 1, 1, 'baixo', '{}'::text[], null, null, '{}'::text[], 2, '10', null, 20, 'Leve a perna esticada à frente e toque a ponta do pé com a mão oposta. Alterne as pernas andando.', 'Só até esticar, sem dor.', null, 'conteúdo próprio')
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
  values (uid, 'Plano Meu Personal v2', true, $plano${"descricao":"Plano base v2 (fase 1, semana 1): manhã dividida em blocos de tornozelo, força e mobilidade.","semana":[{"dia_semana":1,"titulo":"Segunda: superiores e funcional","blocos":["seg-tornozelo","seg-forca","seg-noite"]},{"dia_semana":2,"titulo":"Terça: mobilidade e jogo","blocos":["ter-tornozelo","ter-mobilidade","ter-jogo"]},{"dia_semana":3,"titulo":"Quarta: pernas e funcional leve","blocos":["qua-tornozelo","qua-forca","qua-noite"]},{"dia_semana":4,"titulo":"Quinta: velocidade e arranque","blocos":["qui-tornozelo","qui-noite"]},{"dia_semana":5,"titulo":"Sexta: mobilidade e recuperação ativa","blocos":["sex-tornozelo","sex-mobilidade","sex-noite"]},{"dia_semana":6,"titulo":"Sábado: ativação e jogo","blocos":["sab-ativacao","sab-jogo"]},{"dia_semana":7,"titulo":"Domingo: descanso","blocos":["dom-folga"]}]}$plano$::jsonb)
  returning id into pid;

  insert into public.workouts (user_id, plan_id, dia_semana, titulo, bloco_id, periodo, duracao_min, tags, exercicios, ordem) values
    (uid, pid, 1, 'Rotina de tornozelo', 'seg-tornozelo', 'manha', 10, array['Tornozelo']::text[], $ex$[{"slug":"eq-um-pe","series":"3","repeticoes":"30 s","observacao":null},{"slug":"el-fora","series":"3","repeticoes":"15","observacao":null},{"slug":"el-dentro","series":"3","repeticoes":"15","observacao":null},{"slug":"el-cima","series":"3","repeticoes":"15","observacao":null},{"slug":"pant-degrau","series":"3","repeticoes":"12","observacao":null},{"slug":"joelho-parede","series":"2","repeticoes":"10","observacao":null}]$ex$::jsonb, 0),
    (uid, pid, 1, 'Superiores e core', 'seg-forca', 'manha', 40, array['Força']::text[], $ex$[{"slug":"supino","series":"3","repeticoes":"8 a 10","observacao":null},{"slug":"remada","series":"3","repeticoes":"8 a 10","observacao":null},{"slug":"desenvolvimento","series":"3","repeticoes":"8 a 10","observacao":null},{"slug":"prancha","series":"3","repeticoes":"30 a 45 s","observacao":null},{"slug":"abdominal-rotacao","series":"3","repeticoes":"12","observacao":null}]$ex$::jsonb, 1),
    (uid, pid, 1, 'Funcional leve a moderado, com bola', 'seg-noite', 'noite', 60, array['Funcional']::text[], $ex$[]$ex$::jsonb, 2),
    (uid, pid, 2, 'Rotina de tornozelo', 'ter-tornozelo', 'manha', 10, array['Tornozelo']::text[], $ex$[{"slug":"eq-um-pe","series":"3","repeticoes":"30 s","observacao":null},{"slug":"el-fora","series":"3","repeticoes":"15","observacao":null},{"slug":"el-dentro","series":"3","repeticoes":"15","observacao":null},{"slug":"el-cima","series":"3","repeticoes":"15","observacao":null},{"slug":"pant-degrau","series":"3","repeticoes":"12","observacao":null},{"slug":"joelho-parede","series":"2","repeticoes":"10","observacao":null}]$ex$::jsonb, 3),
    (uid, pid, 2, 'Mobilidade', 'ter-mobilidade', 'manha', 10, array['Mobilidade']::text[], $ex$[{"slug":"mob-quadril","series":"2","repeticoes":"10","observacao":null},{"slug":"mob-posterior","series":"2","repeticoes":"10","observacao":null}]$ex$::jsonb, 4),
    (uid, pid, 2, 'Jogo', 'ter-jogo', 'jogo', 80, array['Jogo']::text[], $ex$[]$ex$::jsonb, 5),
    (uid, pid, 3, 'Rotina de tornozelo', 'qua-tornozelo', 'manha', 10, array['Tornozelo']::text[], $ex$[{"slug":"eq-um-pe","series":"3","repeticoes":"30 s","observacao":null},{"slug":"el-fora","series":"3","repeticoes":"15","observacao":null},{"slug":"el-dentro","series":"3","repeticoes":"15","observacao":null},{"slug":"el-cima","series":"3","repeticoes":"15","observacao":null},{"slug":"pant-degrau","series":"3","repeticoes":"12","observacao":null},{"slug":"joelho-parede","series":"2","repeticoes":"10","observacao":null}]$ex$::jsonb, 6),
    (uid, pid, 3, 'Força de pernas', 'qua-forca', 'manha', 45, array['Força']::text[], $ex$[{"slug":"stiff","series":"3","repeticoes":"8","observacao":null},{"slug":"flexora","series":"2","repeticoes":"6 a 8","observacao":"Semanas 1 e 2: apenas 2 séries."},{"slug":"bulgaro","series":"3","repeticoes":"8 por perna","observacao":null},{"slug":"pant-pe-sentado","series":"3","repeticoes":"12 a 15","observacao":null},{"slug":"elev-quadril","series":"3","repeticoes":"8 a 10","observacao":null}]$ex$::jsonb, 7),
    (uid, pid, 3, 'Funcional leve, com bola', 'qua-noite', 'noite', 60, array['Funcional']::text[], $ex$[]$ex$::jsonb, 8),
    (uid, pid, 4, 'Tornozelo antes do trabalho', 'qui-tornozelo', 'manha', 15, array['Tornozelo']::text[], $ex$[{"slug":"eq-um-pe","series":"3","repeticoes":"30 s","observacao":null},{"slug":"el-fora","series":"3","repeticoes":"15","observacao":null},{"slug":"el-dentro","series":"3","repeticoes":"15","observacao":null},{"slug":"el-cima","series":"3","repeticoes":"15","observacao":null},{"slug":"pant-degrau","series":"3","repeticoes":"12","observacao":null},{"slug":"joelho-parede","series":"2","repeticoes":"10","observacao":null}]$ex$::jsonb, 9),
    (uid, pid, 4, 'Velocidade e arranque', 'qui-noite', 'noite', 35, array['Velocidade', 'Arranque']::text[], $ex$[{"slug":"vel-aquecimento","series":null,"repeticoes":"15 min","observacao":null},{"slug":"vel-arrancadas","series":null,"repeticoes":"6 a 8 arrancadas","observacao":"Pausa de 1 a 2 min. Intensidade: 80 a 85% da velocidade máxima."},{"slug":"vel-fechamento","series":null,"repeticoes":"3 a 4 arrancadas seguidas de finalização","observacao":null}]$ex$::jsonb, 10),
    (uid, pid, 5, 'Rotina de tornozelo', 'sex-tornozelo', 'manha', 10, array['Tornozelo']::text[], $ex$[{"slug":"eq-um-pe","series":"3","repeticoes":"30 s","observacao":null},{"slug":"el-fora","series":"3","repeticoes":"15","observacao":null},{"slug":"el-dentro","series":"3","repeticoes":"15","observacao":null},{"slug":"el-cima","series":"3","repeticoes":"15","observacao":null},{"slug":"pant-degrau","series":"3","repeticoes":"12","observacao":null},{"slug":"joelho-parede","series":"2","repeticoes":"10","observacao":null}]$ex$::jsonb, 11),
    (uid, pid, 5, 'Mobilidade', 'sex-mobilidade', 'manha', 5, array['Mobilidade']::text[], $ex$[{"slug":"mob-quadril","series":"2","repeticoes":"10","observacao":null},{"slug":"mob-posterior","series":"2","repeticoes":"10","observacao":null}]$ex$::jsonb, 12),
    (uid, pid, 5, 'Funcional: recuperação ativa', 'sex-noite', 'noite', 60, array['Funcional', 'Recuperação']::text[], $ex$[]$ex$::jsonb, 13),
    (uid, pid, 6, 'Ativação de tornozelo', 'sab-ativacao', 'tarde', 10, array['Tornozelo']::text[], $ex$[{"slug":"el-fora","series":"1","repeticoes":"15","observacao":null},{"slug":"el-dentro","series":"1","repeticoes":"15","observacao":null},{"slug":"el-cima","series":"1","repeticoes":"15","observacao":null},{"slug":"eq-um-pe","series":"1","repeticoes":"30 s em cada perna","observacao":null}]$ex$::jsonb, 14),
    (uid, pid, 6, 'Jogo', 'sab-jogo', 'jogo', 80, array['Jogo']::text[], $ex$[]$ex$::jsonb, 15),
    (uid, pid, 7, 'Descanso', 'dom-folga', 'dia', 0, array['Folga']::text[], $ex$[]$ex$::jsonb, 16);

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
