# Progresso do app "Meu Personal"

Entradas mais recentes no topo. Fonte de verdade: `ESPECIFICACAO-APP.txt`. Plano da noite: `PLANO-NOITE.md`.

<!-- ENTRADAS -->

## 2026-10-13 12:40 - Etapa 6: correções, decisões e visual alvo (noite 2)

- Feito:
  - C2 segurança adaptativa: depois de um bloqueio, a progressão só volta com 3 dias + 2 check-ins bons em dias diferentes (ou 7 dias com o check-in mais recente bom). 4 cenários + extras testados. O texto de alerta é o da seção 19.3.
  - C3 rótulos de carga por dias corridos, tabela fixa por dia da semana e recálculo com jogo extra/cancelado.
  - C4 modo demonstração opt-in (Perfil), 30 dias fictícios, faixa "DEMONSTRAÇÃO" em todas as telas, botão para apagar. Fica em chave separada do aparelho e nunca grava no Supabase.
  - C5 fase do tornozelo no banco (`profiles.fase_tornozelo` e `fase_inicio`). O plano usa a fase guardada; ela só deve mudar por proposta aceita (etapa 8). Fases 1 a 4 e calendário de 8.3 no código.
  - C6 restrições na tabela `restrictions` (JSON antigo migrado) e marcos com título e critério na tabela `milestone_defs` (8 marcos).
  - C7/C8: cartão de jogo de 3 etapas (antes, depois, dia seguinte) na Hoje, na Semana e em `/jogo/[id]` com linha do tempo; check-in do dia seguinte vinculado ao jogo (`checkins.jogo_id`); aquecimento gravado em `pre_game_logs` (completo ou parcial, duração, tornozeleira); check-in pendente como cartão próprio ("Como está seu tornozelo?"); campo "O que foi feito" dentro do cartão do funcional.
  - C9 dica do dia com 2 linhas e "Ver mais" em folha.
  - C10 acessibilidade: axe-core (WCAG 2 AA) sem violações em 9 telas nos dois temas; fontes em rem; texto a 130% sem estourar a largura.
  - C11 qualidade: ESLint, Prettier, Playwright (13 fluxos + 23 de acessibilidade), testes do supabaseRepo com mocks (9) e GitHub Actions (`.github/workflows/ci.yml`).
  - C12 visual alvo (pasta "Ideias UI"): barra inferior com rótulo em todas as abas, cartão "Como está seu tornozelo?", botões em pílula larga com ícone e seta, controle segmentado (Feito/Parcial/Não fiz, Sim/Não) com check, escala de dor com anel ciano e check, ícone de bola próprio, estados do botão (carregando, "Em breve" com cadeado).
  - C16 anéis do plano (Treinos, Tornozelo, Check-in), com alternância Dia/Semana, "Falta: ..." e botão; cada anel abre a pendência certa; anel completo abre o resumo com Editar; domingo e modo Folga mostram "Descanso"; terça e sábado mostram o ícone do jogo e abrem o card de jogo.
  - Plano: a manhã foi dividida em blocos próprios (tornozelo, força, mobilidade), para os anéis e a Sequência do dia. Sessões antigas (ids `seg-manha` etc.) valem para os blocos novos sem apagar nada.
  - Migração 0005 aplicada no Supabase.
- Arquivos: `src/lib/safety`, `src/lib/carga`, `src/lib/jogo`, `src/lib/coach/aneis.ts`, `src/lib/hoje.ts`, `src/lib/demo.ts`, `src/lib/repo/*`, `src/components/features/{aneis-do-dia,game-card,jogo-dia-card,faixa-demo}.tsx`, `src/components/ui/{segmentado,botao-acao,icone-bola,escala-dor,bottom-nav}.tsx`, `e2e/*`, `playwright.config.ts`, `eslint.config.mjs`, `.prettierrc.json`, `.github/workflows/ci.yml`, `supabase/migrations/0005_correcoes_fase2.sql`.
- Como testar: Perfil > "Carregar dados de exemplo"; volte à Hoje e toque nos anéis; abra `/jogo/AAAA-MM-DD`; veja a Semana (cartão de jogo nos dias de jogo).
- Decisões tomadas: o modo demonstração pode ser ligado também com login (é isolado do Supabase), em vez de só em modo local; o id da rota `/jogo/[id]` é a data do jogo (AAAA-MM-DD); `ESPECIFICACAO-APP.txt` estava apagada do disco e foi restaurada do git; o arquivo `Meu_Personal_Ideias_Funcionais_Apple_Fitness.txt` não existe na pasta (usei a seção 24 da especificação); o botão "Iniciar treino" leva ao detalhe do dia até a etapa 7 criar o treino guiado.
- Pendências: o CLAUDE.md não ganhou os blocos de resumo/caveman (você respondeu que não queria); o axe não consegue medir contraste sobre degradê em todos os pontos, então vale um olhar seu no iPhone.
- Próximo passo: etapa 7 (treino guiado e registro de séries).

## FINAL DA NOITE (2026-10-13 02:45)

### O que foi concluído por etapa
- Etapa 1 (fundação visual): ok.
- Etapa 2 (plano e tela Hoje): ok.
- Etapa 3 (check-in, sessão e segurança): ok.
- Etapa 4 (jogos, pré/pós-jogo, semáforo): ok.
- Etapa 5 (evolução com gráficos): ok.
- Build e testes: `npm run build` sem erros e `npm test` com 81 testes passando (segurança, semáforo, tempo, plano, carga, derivados).

### O que não foi possível ou ficou de fora
- GitHub CLI (`gh`) não está instalada: não foi preciso, o `git push` normal funcionou (repositório `gzuisx/personal-app`).
- Não testei o login por e-mail nem a gravação no Supabase real (não tenho como receber o e-mail). Conferi que as colunas do banco batem com o código, mas o primeiro check-in de verdade é o teste final.
- Recharts não foi usado: gráficos em SVG próprio.
- Fora do escopo desta noite, como combinado: IA (API do Claude), biblioteca de exercícios com imagens, notificações push, uso offline.

### O que você precisa fazer e testar de manhã
1. Abra o app no iPhone (Safari), entre com o código do e-mail e adicione à Tela de Início. Se pedir login de novo dentro do app instalado, use o código de 6 dígitos.
2. Faça o primeiro check-in (botão "Fazer check-in" na Hoje) e confira se o semáforo e as métricas mudam.
3. Marque o treino do dia como feito, com esforço e duração, e veja o status virar "Feito".
4. No Supabase: confira **Authentication > URL Configuration** (Site URL = `https://personal-app-ezfw.vercel.app`) e, depois de entrar, desligue **Allow new users to sign up**.
5. No Perfil: preencha a altura e confira as regras de segurança (dor que bloqueia = 6, atenção = 4).
6. Teste o modo pré-jogo (aparece 4 h antes do jogo; fora desse horário, abra `/jogo/pre` direto) e o pós-jogo (`/jogo/pos`).
7. Veja as 5 abas e a Evolução depois de alguns check-ins. Troque o tema (Claro/Automático) e "Reduzir animações" no Perfil.
8. Se algo estiver feio ou errado no iPhone, anote qual tela e me diga.

### Links
- App (produção): https://personal-app-ezfw.vercel.app
- Repositório privado: https://github.com/gzuisx/personal-app

### Sugestões para as próximas etapas
- Etapa 6 (biblioteca): gravar vídeos curtos de cada exercício e preencher `media_url` (campo já existe em `exercises`); a tela já tem o espaço 16:9.
- Etapa 7 (IA): criar `ai_messages`, `ai_proposals` e `weekly_reviews`; chave do Claude só no servidor; a IA só propõe evolução (mais carga, mudar de fase) quando semáforo verde por 7 dias e `podeProgredir` verdadeiro em `lib/safety`.
- Notificações push e uso offline (service worker) numa fase seguinte.

## 2026-10-13 02:45 - Etapa 5: evolução com gráficos
- Feito: tela Evolução com faixa da semana (jogos e treinos marcados), filtro Semana/Mês, três anéis (treinos feitos x planejados, esforço médio, sono médio), gráfico de linha da dor com faixa nos dias de jogo, losangos para a dor pós-jogo e linhas dos limites, gráficos de barras de esforço e sono, área do Tornozelo (fase atual, critério para avançar com contador de dias verdes, histórico de dor pós-jogo, Jornada com marcos que você pode concluir). Estados vazios sem erro; gráficos animam ao entrar.
- Arquivos: `src/app/(app)/evolucao/page.tsx`, `src/components/features/graficos.tsx`, `supabase/migrations/0004_jogos_marcos.sql` (aplicada).
- Como testar: abra Evolução, alterne Semana/Mês e toque nos dias da faixa; conclua um marco na Jornada.
- Decisões tomadas: o gráfico mostra a dor por dia (não por semana), com a média do período na legenda; a taxa de treinos usa os blocos de treino do plano (jogo e folga não contam); marcos são concluídos à mão.
- Pendências: nenhuma.

## 2026-10-13 02:40 - Etapa 4: jogos, pré/pós-jogo e semáforo
- Feito: cartão "Próximo jogo" com contagem regressiva (terça 20h30, sábado 14h30, fuso de São Paulo); modo pré-jogo guiado (5 fases, timer em anel, pausar e pular) liberado 4 h antes; pós-jogo (minutos, dor, gatilho, notas) grava na tabela `games`; lembretes por horário (refeição, lanche, ativação, aquecimento, "coma proteína") que podem ser dispensados no dia; resumo "Semana encerrada" no domingo à noite; rótulos de carga relativos aos jogos na Semana; semáforo do tornozelo com motivo em uma frase e pulso animado.
- Arquivos: `src/lib/semaforo/*`, `src/lib/tempo/*`, `src/lib/carga/*`, `src/app/(app)/jogo/pre|pos/page.tsx`, `src/components/features/proximo-jogo-card.tsx`, `lembretes-jogo.tsx`, `semana-encerrada.tsx`.
- Como testar: na Hoje veja o cartão do jogo; use `/jogo/pre` e `/jogo/pos` direto para ver as telas fora do horário.
- Decisões tomadas: dor pós-jogo nas últimas 48 h pesa no semáforo (vermelho se for igual ou maior que o limite de bloqueio, mais restritivo que a especificação); o "check-in pendente" é o próprio cartão do semáforo com aviso depois das 6h.
- Pendências: nenhuma.

## 2026-10-13 02:35 - Etapa 3: check-in, sessão e segurança
- Feito: check-in de 30 segundos em folha deslizante (dor 0–10, inchaço, falhou, energia, sono, gatilho, nota), um por dia e editável, com animação de check; registro de sessão (feito/parcial/não fiz, esforço 0–10, duração, notas); regras de segurança em `lib/safety` (dor 6+, inchaço ou "falhou" bloqueia; 4–5 mantém; até 3 libera; dor persistente em 3 check-ins; bloqueio vale por 7 dias); banner de alerta fixo na Hoje; limites editáveis no Perfil com confirmação; Perfil completo (dados, focos, restrições, aparência, exportar JSON, sair).
- Arquivos: `src/lib/safety/*`, `src/components/features/checkin-sheet.tsx`, `sessao-sheet.tsx`, `src/app/(app)/perfil/page.tsx`, `supabase/migrations/0003_checkin_sessao_seguranca.sql` (aplicada), `src/lib/repo/*`.
- Como testar: Hoje > "Fazer check-in" com dor 7 (fica vermelho e aparece o alerta); marque o treino como feito; Perfil > Regras de segurança.
- Decisões tomadas: restrições ficam em `profiles.dados` (JSON) em vez da tabela `restrictions`, que continua sem uso; modo local começa sem dados inventados (só o perfil padrão), porque a especificação pede honestidade nas métricas.
- Pendências: nenhuma.

## 2026-10-13 02:30 - Etapa 2: plano e tela Hoje
- Feito: plano completo da semana (seção 12 da especificação) no código, com a rotina do tornozelo mudando por fase e semana (fase 1 de 13/10, fase 2 de 3/11, fase 3 de 1/12) e a flexora e a velocidade mudando por semana; tela Hoje (saudação por horário, treino do dia com blocos manhã/noite, métricas dor/sono/carga reais, dica do dia); tela Semana (7 dias, navegação entre semanas, jogos em destaque, rótulo de carga, fase do tornozelo); detalhe do dia com exercícios expansíveis e espaço 16:9 para mídia; camada de dados com `localRepo` (modo local) e `supabaseRepo`.
- Banco: migrações 0002, 0003 e 0004 aplicadas no projeto "Gym App" com `supabase db push` (a 0001 já estava no banco; registrei no histórico com `migration repair`). A 0002 criou `exercises` e deixou uma cópia base do plano em `plans`/`workouts` para você (26 exercícios, 13 blocos).
- Arquivos: `src/lib/seed/*`, `src/lib/tempo`, `src/lib/carga`, `src/lib/repo/*`, `src/components/dados-provider.tsx`, `src/app/(app)/hoje|semana/*`, `scripts/gerar-seed-sql.ts`, `supabase/migrations/0002_exercicios_e_plano.sql`.
- Como testar: a Hoje mostra o treino do dia da semana; em Semana toque num dia para ver exercícios, séries e repetições.
- Decisões tomadas: o app lê o plano do código (que acompanha a fase pela data); a cópia no banco é a base para a IA da etapa 7. Séries e repetições das fases 2 e 3 do tornozelo não estavam na especificação: usei 3 x 10 / 3 x 30 s (fase 2) e 3 x 8 (fase 3). Terça manhã = tornozelo 10 min + mobilidade 10 min (20 min).
- Pendências: nenhuma.

## 2026-10-13 02:25 - Etapa 1: fundação visual
- Feito: tema azul escuro com degradê fixo, fonte Poppins, tokens de design (CSS + TypeScript), 20 componentes reutilizáveis (cartão de vidro, botões em pílula, chips, escala de dor 0–10, barra inferior flutuante com 5 abas e círculo branco que desliza, anel de progresso, count-up, sheet, toast, skeleton, estado vazio, timer, faixa de dias, semáforo, banner, splash, logotipo original). Animações com Motion e opção "Reduzir animações" (Perfil + sistema). Tema claro e automático no Perfil. Rotas /hoje, /semana, /personal, /evolucao, /perfil e login com o visual novo. PWA: manifest "Meu Personal", ícones novos gerados do logotipo.
- Arquivos criados/alterados: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/*`, `src/components/providers.tsx`, `src/lib/design/tokens.ts`, `src/app/(app)/*`, `src/app/login/*`, `src/app/manifest.ts`, `scripts/gerar-icones.mjs`, `public/icons/*`.
- Como testar: abra o endereço no iPhone (Safari), toque nas 5 abas da barra inferior (o círculo branco desliza), vá em Perfil e troque tema/"Reduzir animações".
- Decisões tomadas: sem Recharts (gráficos serão SVG próprio, mais leve); splash aparece uma vez por sessão e pode ser pulada com `?splash=0`; botões usam animação de toque em CSS (scale 0.97) em vez de JS, para ser leve no iPhone; o desfoque (blur) é usado só na barra inferior.
- Pendências: nenhuma. Imagens de inspiração estão em `Ideias UI/` (não vão para o git).
- Próximo passo: etapa 2 (plano e tela Hoje).
