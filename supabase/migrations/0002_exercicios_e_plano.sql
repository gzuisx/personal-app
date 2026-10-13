-- Etapa 2: catálogo de exercícios e plano base.
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
    (uid, 'eq-um-pe', 'Equilíbrio em um pé só (direito)', 'Tornozelo', 'tornozelo', 'Depois de dominar, repita de olhos fechados.'),
    (uid, 'el-fora', 'Elástico: pé para fora', 'Tornozelo', 'tornozelo', 'Lento. O movimento para fora (fibulares) é o que mais protege contra torção.'),
    (uid, 'el-dentro', 'Elástico: pé para dentro', 'Tornozelo', 'tornozelo', 'Lento e controlado.'),
    (uid, 'el-cima', 'Elástico: pé para cima', 'Tornozelo', 'tornozelo', 'Lento e controlado.'),
    (uid, 'pant-degrau', 'Panturrilha no degrau', 'Tornozelo', 'tornozelo', 'Desça em 3 segundos.'),
    (uid, 'joelho-parede', 'Joelho na parede', 'Tornozelo', 'mobilidade', 'Mobilidade do tornozelo. Mantenha o calcanhar no chão.'),
    (uid, 'pant-um-pe', 'Panturrilha em um pé só', 'Tornozelo', 'tornozelo', 'Faça com o joelho esticado e depois com o joelho dobrado.'),
    (uid, 'eq-almofada', 'Equilíbrio na almofada passando a bola', 'Tornozelo', 'tornozelo', 'Passe a bola contra a parede sem perder o equilíbrio.'),
    (uid, 'agach-uma-perna', 'Agachamento em uma perna e saltinhos no lugar', 'Tornozelo', 'tornozelo', 'Controle o joelho: não deixe cair para dentro.'),
    (uid, 'salto-aterrissagem', 'Saltos e aterrissagens em um pé só', 'Tornozelo', 'tornozelo', 'Aterrisse macio e estável.'),
    (uid, 'salto-lateral', 'Saltos laterais e mudanças de direção', 'Tornozelo', 'tornozelo', 'Comece devagar e aumente a velocidade.'),
    (uid, 'mob-quadril', 'Mobilidade de quadril (90/90)', 'Mobilidade', 'mobilidade', null),
    (uid, 'mob-posterior', 'Mobilidade dinâmica de posteriores e panturrilha', 'Mobilidade', 'mobilidade', null),
    (uid, 'stiff', 'Stiff (levantamento terra romeno)', 'Posterior de coxa', 'forca', 'Deixe 2 repetições de reserva.'),
    (uid, 'flexora', 'Flexora (elástico, slider ou nórdica assistida)', 'Posterior de coxa', 'forca', 'Deixe 2 repetições de reserva.'),
    (uid, 'bulgaro', 'Afundo búlgaro ou step-up', 'Coxa', 'forca', 'Deixe 2 repetições de reserva.'),
    (uid, 'pant-pe-sentado', 'Panturrilha em pé e sentado', 'Panturrilha', 'forca', 'Lenta.'),
    (uid, 'elev-quadril', 'Elevação de quadril', 'Glúteo e posterior', 'forca', 'Deixe 2 repetições de reserva.'),
    (uid, 'supino', 'Supino ou flexão', 'Peito', 'forca', 'Deixe 2 repetições de reserva.'),
    (uid, 'remada', 'Remada', 'Costas', 'forca', 'Deixe 2 repetições de reserva.'),
    (uid, 'desenvolvimento', 'Desenvolvimento', 'Ombros', 'forca', 'Deixe 2 repetições de reserva.'),
    (uid, 'prancha', 'Prancha', 'Core', 'forca', null),
    (uid, 'abdominal-rotacao', 'Abdominal com rotação', 'Core', 'forca', null),
    (uid, 'vel-aquecimento', 'Aquecimento de velocidade', 'Velocidade', 'velocidade', 'Mobilidade, corrida leve, skipping e 2 a 3 progressivas.'),
    (uid, 'vel-arrancadas', 'Arrancadas de 10 a 20 m', 'Velocidade', 'velocidade', 'Varie a saída: parado, de costas, depois de girar e depois de deslocamento lateral.'),
    (uid, 'vel-fechamento', 'Arrancadas com finalização', 'Velocidade', 'velocidade', 'Em condição de jogo.')
  on conflict (user_id, slug) do nothing;

  insert into public.plans (user_id, nome, ativo, conteudo)
  values (uid, 'Plano Meu Personal', true, $plano${"descricao":"Plano base (fase 1, semana 1). O app calcula a fase e a semana pela data.","semana":[{"dia_semana":1,"titulo":"Segunda: superiores e funcional","blocos":["seg-manha","seg-noite"]},{"dia_semana":2,"titulo":"Terça: mobilidade e jogo","blocos":["ter-manha","ter-jogo"]},{"dia_semana":3,"titulo":"Quarta: pernas e funcional leve","blocos":["qua-manha","qua-noite"]},{"dia_semana":4,"titulo":"Quinta: velocidade e arranque","blocos":["qui-manha","qui-noite"]},{"dia_semana":5,"titulo":"Sexta: mobilidade e recuperação ativa","blocos":["sex-manha","sex-noite"]},{"dia_semana":6,"titulo":"Sábado: ativação e jogo","blocos":["sab-ativacao","sab-jogo"]},{"dia_semana":7,"titulo":"Domingo: folga total","blocos":["dom-folga"]}]}$plano$::jsonb)
  returning id into pid;

  insert into public.workouts (user_id, plan_id, dia_semana, titulo, bloco_id, periodo, duracao_min, tags, exercicios, ordem) values
    (uid, pid, 1, 'Tornozelo + superiores e core', 'seg-manha', 'manha', 50, array['Tornozelo', 'Força']::text[], $ex$[{"slug":"eq-um-pe","series":"3","repeticoes":"30 s","observacao":null},{"slug":"el-fora","series":"3","repeticoes":"15","observacao":null},{"slug":"el-dentro","series":"3","repeticoes":"15","observacao":null},{"slug":"el-cima","series":"3","repeticoes":"15","observacao":null},{"slug":"pant-degrau","series":"3","repeticoes":"12","observacao":null},{"slug":"joelho-parede","series":"2","repeticoes":"10","observacao":null},{"slug":"supino","series":"3","repeticoes":"8 a 10","observacao":null},{"slug":"remada","series":"3","repeticoes":"8 a 10","observacao":null},{"slug":"desenvolvimento","series":"3","repeticoes":"8 a 10","observacao":null},{"slug":"prancha","series":"3","repeticoes":"30 a 45 s","observacao":null},{"slug":"abdominal-rotacao","series":"3","repeticoes":"12","observacao":null}]$ex$::jsonb, 0),
    (uid, pid, 1, 'Funcional leve a moderado, com bola', 'seg-noite', 'noite', 60, array['Funcional']::text[], $ex$[]$ex$::jsonb, 1),
    (uid, pid, 2, 'Tornozelo + mobilidade', 'ter-manha', 'manha', 20, array['Tornozelo', 'Mobilidade']::text[], $ex$[{"slug":"eq-um-pe","series":"3","repeticoes":"30 s","observacao":null},{"slug":"el-fora","series":"3","repeticoes":"15","observacao":null},{"slug":"el-dentro","series":"3","repeticoes":"15","observacao":null},{"slug":"el-cima","series":"3","repeticoes":"15","observacao":null},{"slug":"pant-degrau","series":"3","repeticoes":"12","observacao":null},{"slug":"joelho-parede","series":"2","repeticoes":"10","observacao":null},{"slug":"mob-quadril","series":"2","repeticoes":"10","observacao":null},{"slug":"mob-posterior","series":"2","repeticoes":"10","observacao":null}]$ex$::jsonb, 2),
    (uid, pid, 2, 'Jogo', 'ter-jogo', 'jogo', 80, array['Jogo']::text[], $ex$[]$ex$::jsonb, 3),
    (uid, pid, 3, 'Tornozelo + força de pernas', 'qua-manha', 'manha', 55, array['Tornozelo', 'Força']::text[], $ex$[{"slug":"eq-um-pe","series":"3","repeticoes":"30 s","observacao":null},{"slug":"el-fora","series":"3","repeticoes":"15","observacao":null},{"slug":"el-dentro","series":"3","repeticoes":"15","observacao":null},{"slug":"el-cima","series":"3","repeticoes":"15","observacao":null},{"slug":"pant-degrau","series":"3","repeticoes":"12","observacao":null},{"slug":"joelho-parede","series":"2","repeticoes":"10","observacao":null},{"slug":"stiff","series":"3","repeticoes":"8","observacao":null},{"slug":"flexora","series":"2","repeticoes":"6 a 8","observacao":"Semanas 1 e 2: apenas 2 séries."},{"slug":"bulgaro","series":"3","repeticoes":"8 por perna","observacao":null},{"slug":"pant-pe-sentado","series":"3","repeticoes":"12 a 15","observacao":null},{"slug":"elev-quadril","series":"3","repeticoes":"8 a 10","observacao":null}]$ex$::jsonb, 4),
    (uid, pid, 3, 'Funcional leve, com bola', 'qua-noite', 'noite', 60, array['Funcional']::text[], $ex$[]$ex$::jsonb, 5),
    (uid, pid, 4, 'Tornozelo antes do trabalho', 'qui-manha', 'manha', 15, array['Tornozelo']::text[], $ex$[{"slug":"eq-um-pe","series":"3","repeticoes":"30 s","observacao":null},{"slug":"el-fora","series":"3","repeticoes":"15","observacao":null},{"slug":"el-dentro","series":"3","repeticoes":"15","observacao":null},{"slug":"el-cima","series":"3","repeticoes":"15","observacao":null},{"slug":"pant-degrau","series":"3","repeticoes":"12","observacao":null},{"slug":"joelho-parede","series":"2","repeticoes":"10","observacao":null}]$ex$::jsonb, 6),
    (uid, pid, 4, 'Velocidade e arranque', 'qui-noite', 'noite', 35, array['Velocidade']::text[], $ex$[{"slug":"vel-aquecimento","series":null,"repeticoes":"15 min","observacao":null},{"slug":"vel-arrancadas","series":null,"repeticoes":"6 a 8 arrancadas","observacao":"Pausa de 1 a 2 min. Intensidade: 80 a 85% da velocidade máxima."},{"slug":"vel-fechamento","series":null,"repeticoes":"3 a 4 arrancadas seguidas de finalização","observacao":null}]$ex$::jsonb, 7),
    (uid, pid, 5, 'Tornozelo + mobilidade', 'sex-manha', 'manha', 15, array['Tornozelo', 'Mobilidade']::text[], $ex$[{"slug":"eq-um-pe","series":"3","repeticoes":"30 s","observacao":null},{"slug":"el-fora","series":"3","repeticoes":"15","observacao":null},{"slug":"el-dentro","series":"3","repeticoes":"15","observacao":null},{"slug":"el-cima","series":"3","repeticoes":"15","observacao":null},{"slug":"pant-degrau","series":"3","repeticoes":"12","observacao":null},{"slug":"joelho-parede","series":"2","repeticoes":"10","observacao":null},{"slug":"mob-quadril","series":"2","repeticoes":"10","observacao":null},{"slug":"mob-posterior","series":"2","repeticoes":"10","observacao":null}]$ex$::jsonb, 8),
    (uid, pid, 5, 'Funcional: recuperação ativa', 'sex-noite', 'noite', 60, array['Funcional', 'Recuperação']::text[], $ex$[]$ex$::jsonb, 9),
    (uid, pid, 6, 'Ativação de tornozelo', 'sab-ativacao', 'tarde', 10, array['Tornozelo']::text[], $ex$[{"slug":"el-fora","series":"1","repeticoes":"15","observacao":null},{"slug":"el-dentro","series":"1","repeticoes":"15","observacao":null},{"slug":"el-cima","series":"1","repeticoes":"15","observacao":null},{"slug":"eq-um-pe","series":"1","repeticoes":"30 s em cada perna","observacao":null}]$ex$::jsonb, 10),
    (uid, pid, 6, 'Jogo', 'sab-jogo', 'jogo', 80, array['Jogo']::text[], $ex$[]$ex$::jsonb, 11),
    (uid, pid, 7, 'Folga total', 'dom-folga', 'dia', 0, array['Folga']::text[], $ex$[]$ex$::jsonb, 12);
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
