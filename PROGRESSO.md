# Progresso do app "Meu Personal"

Entradas mais recentes no topo. Fonte de verdade: `ESPECIFICACAO-APP.txt`. Plano da noite: `PLANO-NOITE.md`.

<!-- ENTRADAS -->

## FINAL DA NOITE 2 (etapas 6 a 9)

### O que foi feito, por etapa

- **Etapa 6 (correções e visual)**: segurança adaptativa (3 dias + 2 check-ins bons, ou 7 dias), rótulos de carga por dia da semana, modo demonstração isolado do banco, fase do tornozelo no banco, restrições e marcos em tabelas, cartão de jogo em 3 etapas, anéis acionáveis, visual novo (barra inferior com rótulos, botões em pílula, escala de dor, segmentado), ESLint, Prettier, Playwright, axe e CI. Migração 0005.
- **Etapa 7 (treino guiado)**: `/treino/[bloco]` com botão principal único, descanso, "Doeu", pular e trocar, retomada, Sequência do dia, catálogo de 77 exercícios, progressão sugerida. Migração 0006.
- **Etapa 8 (coach)**: 18 regras, prontidão interna, carga da semana, decisão do dia (Completo, Reduzido, Recuperação, Folga) com "Por que?" e "Ajustar treino", "Só tenho X min", propostas com validador, versões de plano e auditoria, modelos P1 a P7 (P1 a P4 e P7 funcionam), Ajustar semana, Sugestões para você, Rotina no Perfil. Migração 0007.
- **Etapa 9 (testes, metas, diário e Evolução)**: check-in com onde doeu, movimento, duração e "posterior apertou"; testes de campo T1 a T6 em `/evolucao/testes` (cronômetro, melhor de 3, simetria entre pés, gráfico, T5 só na fase 3 com semáforo verde); metas de 2027 sugeridas a partir do primeiro teste; diário do centroavante com média móvel de 5 jogos; 10 insights (I1 a I10) com mínimo de 10 registros; Evolução em 8 abas (Resumo, Calendário, Carga, Tornozelo, Força, Testes, Insights, Jogos); carga da semana tocável com "O que compôs o dia" e "Como calculamos"; calendário "Planejado x realizado"; evolução por exercício e "Comparar sessões". Migração 0008 (`field_tests`, `goals`, `game_stats`).

### O que não foi possível ou foi decisão minha

- Não implementei, por regra do prompt: IA do Claude (etapa 12), biblioteca de mídia (etapa 11), lembretes e push (etapa 10).
- Não testei com o Supabase real e login: só modo local, demonstração e o build de produção. A gravação das tabelas novas (0007 e 0008) foi aplicada no banco, mas nunca exercitada por você logado.
- O GitHub Actions (CI) não foi conferido: a CLI `gh` não está instalada.
- P5 (foco posterior) e P6 (arranque e potência) estão só descritos; não alteram o dia ainda.
- "Comparar períodos" e "comparar dois dias" (18.4 e 24.5) ficaram de fora.
- `getDiaResumo` é usado no Calendário e na Carga; Hoje e Semana usam a mesma base (`diaPlanejado`), mas não chamam a função diretamente.
- Sem check-in de hoje, a pontuação é só estimativa: o treino e o cartão seguem a segurança e o cartão "Decisão do dia" só aparece depois do check-in.
- A escolha de "Ajustar treino" fica no aparelho (localStorage), não no banco.
- Os testes de campo e o diário de exemplo só existem no modo demonstração.
- O `CLAUDE.md` continua sem os blocos de resumo (você recusou antes).

### Para testar no iPhone de manhã (nesta ordem)

1. Abra o app instalado (ou o link da Vercel), entre com seu e-mail e confira que a Hoje carrega sem faixa de demonstração.
2. Faça o check-in com dor 3: confira "Onde doeu", "Movimento que doeu", "Quanto tempo durou" e "Posterior apertou?". Salve.
3. Na Hoje, veja o cartão "Decisão do dia": o modo, a frase, "Por que?" (regra, dados e o que mudaria, sem porcentagem) e "Ajustar treino".
4. Toque em "Ajustar treino" > "20 min" e inicie o treino: ele deve mostrar "Só 20 min" e registrar como parcial.
5. Faça um treino guiado inteiro (tornozelo): botão principal, descanso, "Doeu" com 4 e com 7, feche o app no meio e volte para ver "Continuar treino".
6. Semana > "Ajustar semana": marque "Funcional cancelado" num dia e veja o dia mudar; remova depois.
7. Semana > "Sugestões para você": toque em "Adicionar" e veja o exercício no dia.
8. Perfil > Rotina: mude um horário, salve, recarregue.
9. Evolução > Testes > "Fazer ou ver os testes": faça o T1 com o cronômetro (ou digitando), salve e veja o último resultado e a meta sugerida.
10. Evolução > Calendário: toque numa data passada e numa futura. Evolução > Carga: toque num dia e em "Como calculamos".
11. Evolução > Jogos: preencha o diário de um jogo registrado.
12. Veja a barra inferior e as folhas (sheets) com a área segura do iPhone, o tema claro e o texto grande.
13. Anote aqui o que falhar. Se algo da Vercel ou do Supabase pedir ajuste (Site URL, cadastro de novos usuários desligado), isso é com você.

## 2026-10-13 22:30 - Etapa 9: testes de campo, metas, diário e Evolução (noite 2)

- Feito:
  - Check-in: com dor de 1 ou mais aparecem "Onde doeu" (lateral, medial, frente, atrás, tendão de Aquiles, dentro da articulação), "Movimento que doeu" e "Quanto tempo durou"; "Posterior apertou?" aparece sempre. Os valores vão para `regioes`, `movimentos`, `duracao_dor` e `posterior_apertou`.
  - Testes de campo T1 a T6 em `/evolucao/testes`: instruções curtas, aquecimento sugerido, aviso "Pare se doer mais de 3", cronômetro (T1 e T3), melhor de 3 tentativas, falhas no equilíbrio, gráfico de evolução por teste, simetria entre os pés e variação. O T5 só abre na fase 3 ou mais e com semáforo verde. A regra R10 (queda de 5% ou mais) e os marcos automáticos passam a ler esses testes.
  - Metas de 2027: sugeridas a partir do primeiro teste (sprint -4%, salto +5%, equilíbrio 30 s de olhos fechados, panturrilha com 90% de simetria), com valor inicial, atual, alvo, prazo, barra de progresso e alvo editável.
  - Marcos: detectados sozinhos nos dados e confirmados por você (cartão "Marco atingido?").
  - Diário do centroavante (20 s): contadores, notas de 1 a 5, duas coisas boas e duas a melhorar, na Evolução > Jogos e na página do jogo; tendência por média móvel de 5 jogos.
  - Insights I1 a I10 (aba Insights): só com 10 registros ou 4 semanas, sempre "com base em N registros", linguagem "parece que", botão "Por que?". Sem dados, mostra o que falta.
  - Evolução em 8 abas. Calendário com ponto de treino, check de feito, bola de jogo, cor da dor e lua de descanso; tocar numa data abre "Planejado x realizado" (treinos, jogo, check-in, testes, decisão do coach recalculada com os registros até aquele dia). Carga empilhada por tipo com filtros, "O que compôs o dia" (esforço x minutos, sono e dor), comparativo com as 4 semanas anteriores e "Como calculamos" com a fórmula e os dados. Força por exercício: gráfico (mínimo 3 sessões), recordes pessoais, platô e "Comparar sessões" (mínimo 2) com frase gerada por regra e aviso de quantas sessões faltam.
  - Migração 0008 aplicada (só aditiva): `field_tests`, `goals`, `game_stats`, todas com segurança por linha.
- Arquivos: `src/lib/testes`, `src/lib/diario`, `src/lib/evolucao/{dia,exercicios}.ts`, `src/lib/coach/insights.ts`, `src/lib/tipos-testes.ts`, `src/components/evolucao/*`, `src/components/features/{registrar-teste,metas-card,diario-sheet}.tsx`, `src/app/(app)/evolucao/{page,testes/page}.tsx`, `supabase/migrations/0008_testes_metas_diario.sql`, `e2e/etapa9.spec.ts`.
- Como testar: ver a lista "Para testar no iPhone de manhã" acima.
- Decisões tomadas: T3 guarda os segundos mantidos e as falhas; T5 e T6 têm variações (horizontal, triplo; frente, lateral, atrás). Metas guardam o valor inicial e o atual vem dos testes. Os insights usam "parece que" e nunca falam em causa. O calendário usa botões em grupo em vez de uma grade ARIA (a grade exigia linhas e o axe reprovava). Demo ganhou testes e diário fictícios para as abas aparecerem.
- Pendências: gráficos de carga e calendário só foram verificados em tela de 390 px; "comparar períodos" e "comparar dois dias" ficaram para depois; a IA entra na migração 0009 ou posterior.
- Teste automático: 376 testes de lógica e 84 de interface (fluxos, treino, coach, etapa 9 e axe nos dois temas) passando; ESLint, tsc e build limpos.
- Próximo passo: fim da noite 2. Etapa 10 (lembretes) é a próxima, em outra noite.

## 2026-10-13 18:30 - Etapa 8: motor do coach e adaptação (noite 2)

- Feito:
  - Motor do coach em código puro e testado (`src/lib/coach/`): contexto do dia, prontidão interna (0 a 100, nunca mostrada como "% de recuperação"), carga da semana (alerta amarelo acima de 1,30 e vermelho acima de 1,50, mínimo de 3 semanas), as 18 regras R01 a R18 e a decisão do dia (Completo, Reduzido, Recuperação, Folga). Regra de ouro: com bloqueio de segurança o modo nunca é Completo e a progressão nunca é liberada (testado por propriedade em todas as combinações de dor, inchaço, falha e sono).
  - Cartão "Decisão do dia" na Hoje (depois do check-in): modo, frase curta, alertas, ações sugeridas, "Por que?" (regra aplicada, dados com datas, o que mudaria, pontuação interna rotulada "não é medida fisiológica") e "Ajustar treino" (Completo, Reduzido, Sem academia, Recuperação, Só 15/20/30/45 min). A escolha vale para o dia, fica neste aparelho e vira o padrão do treino guiado; "Só X min" monta o essencial (tornozelo, 1 principal, 1 acessório) e registra como parcial.
  - Propostas (Hoje e Semana): progressão de carga (R06), descarga (R07), mudança de fase (R16, com checklist de critérios e aviso para confirmar com profissional) e sugestão de plano (P2 a P4, P7). Aceitar / Adiar (uma vez, 7 dias) / Recusar. Aceitar cria uma versão do plano (`plan_versions`) e um registro em `audit_log`; fase só muda por proposta aceita. Um validador recusa proposta que aumente carga com a segurança bloqueando, ponha impacto com dor 4 ou mais, remova aquecimento ou tornozelo, mude regras de segurança ou passe dos limites de volume.
  - Modelos de plano P1 a P7 (`src/lib/seed/templates.ts`): P1, P2, P3, P4 e P7 alteram o dia de verdade; P5 e P6 estão descritos mas ainda não alteram o dia. O plano Base nunca é editado; o modelo vale por 7 dias e depois volta sozinho.
  - Agenda inteligente: Semana > "Ajustar semana" (jogo extra, jogo cancelado, trabalho presencial extra, viagem, feriado, funcional cancelado, dia sem academia). Jogos extras e cancelados entram na carga e nos cartões de jogo. Perfil > Rotina (horários e dias presenciais, tabela `routine`).
  - "Sugestões para você" na Semana (recomendador por foco, lacuna de volume semanal, fase, impacto e modo do dia; Adicionar acrescenta o exercício ao dia). Progressão aceita já abre o treino guiado com a carga nova (só com a segurança liberada). Marcos detectados (R14) pedem confirmação. Reconhecimentos (R13, sono) aparecem na Hoje e no resumo de domingo. Os anéis seguem o modo do dia (Folga mostra descanso).
  - Migração 0007 aplicada no Supabase (só aditiva): `calendar_overrides`, `routine`, `coach_proposals`, `audit_log`.
- Arquivos: `src/lib/coach/*` (carga, prontidao, contexto, regras, modo, fase, marcos, agenda, dia, propostas, validador, recomendacao, ajuste-dia, use-coach), `src/lib/seed/templates.ts`, `src/components/features/{decisao-do-dia,propostas-card,ajustar-semana,rotina-card,marcos-detectados}.tsx`, `src/components/dados-provider.tsx`, `src/lib/repo/*`, `supabase/migrations/0007_coach.sql`, `e2e/coach.spec.ts`.
- Como testar: faça o check-in na Hoje com dor 1 (modo Completo) e depois com dor 7 (Recuperação, alerta); toque em "Por que?" e em "Ajustar treino" > "20 min" e abra o treino; na Semana use "Ajustar semana" e "Sugestões para você"; em Perfil edite a Rotina.
- Decisões tomadas: sem check-in de hoje a pontuação é só estimativa (70), então o treino e o cartão seguem a segurança e não reduzem o treino; o cartão "Decisão do dia" só aparece depois do check-in. A escolha de "Ajustar treino" fica no `localStorage` do aparelho (conveniência), não no banco. A proposta de progressão aceita vale até o exercício ser treinado de novo. Limite de aumento por proposta: 10%. P5 e P6 só descritos. Os reconhecimentos aparecem também em banner na Hoje, além do resumo de domingo. O `audit_log` entrou já na migração 0007 (a especificação previa a 0008).
- Pendências: gravação real no Supabase das tabelas novas e a ordem de versões não foram testadas com login (só modo local e demonstração); `routine`/`calendar_overrides` ainda não alimentam lembretes (etapa 10).
- Teste automático: 342 testes de lógica (18 regras, modo, fase, agenda, propostas, validador, recomendador, templates) e 54 de interface passando; ESLint, tsc e build limpos.
- Próximo passo: etapa 9 (testes de campo, metas, diário do centroavante, insights e Evolução).

## 2026-10-13 14:10 - Etapa 7: treino guiado e registro de séries (noite 2)

- Feito:
  - Treino guiado em tela cheia (`/treino/[bloco]`, sem barra inferior): "Iniciar treino" na Hoje, nos anéis (TREINOS e TORNOZELO) e no detalhe do dia. Um exercício por vez, com "como fazer" (2 linhas), cuidado (1 linha), espaço de mídia, chips S1/S2/S3, repetições e carga com botões de 56 px, tempo por série e esforço opcional (Fácil, Ok, Duro).
  - Botão principal único que muda por etapa: Concluir série, Descansar (timer em anel, -15 s, +15 s, Pular descanso), Próxima série, Próximo exercício, Finalizar treino. Descanso padrão: força 90 s, tornozelo 45 s, velocidade 120 s.
  - Cada série é gravada na hora (`set_logs`); o andamento fica em `execution_state` e o treino retoma depois de fechar o app ("Continuar treino de hoje" na Hoje e ao reabrir o link).
  - "Doeu" (R11): dor de 4 a 5 manda parar e sugere a versão mais leve do catálogo; 6 ou mais encerra o treino e abre o check-in. Pular exercício (com motivo) e Trocar exercício (mais leve, equivalente, mais difícil só com a segurança liberada; respeita fase do tornozelo, falta de academia e impacto).
  - Valores sugeridos vêm da última sessão do mesmo exercício; dica de progressão (+2,5% a 5%) só como sugestão e só com `podeProgredir` verdadeiro (`lib/coach/progressao.ts`: dupla progressão, reduzir após 3 sessões abaixo do piso, variante para peso do corpo).
  - Resumo final: duração, séries, volume, maiores cargas, esforço percebido, dor ao final e nota; grava uma sessão por bloco (feito, parcial) e limpa o andamento.
  - Modo do dia na tela de preparar: Completo, Reduzido, Só 20 min, Sem academia, Recuperação, com "Por que?". O ajuste só tira ou troca exercícios do plano, nunca acrescenta.
  - Sequência do dia: quando há 2 ou mais blocos pendentes no mesmo período (ex.: manhã de quarta, tornozelo + força de pernas, 55 min), aparece "Iniciar sequência"; tela de transição entre blocos com "Pular bloco"; cada bloco gera a sua sessão.
  - Tela acesa durante o treino (Screen Wake Lock, com falha silenciosa onde não houver suporte).
  - Catálogo com 77 exercícios (`src/lib/seed/catalogo.ts`), progressão e regressão ligadas. Migração 0006 aplicada: `set_logs`, `exercise_catalog`, `plan_templates`, `plan_versions`, `execution_state`, plano v2 (blocos separados) e função que semeia o catálogo.
- Arquivos: `src/lib/treino/{motor,apoio}.ts`, `src/lib/coach/progressao.ts`, `src/lib/seed/catalogo.ts`, `src/components/treino/*`, `src/app/(app)/treino/[bloco]/page.tsx`, `src/lib/use-wake-lock.ts`, `src/lib/rotas.ts`, `scripts/gerar-0006-sql.ts`, `supabase/migrations/0006_treino_guiado.sql`, `e2e/treino.spec.ts`.
- Como testar: na Hoje, toque em "Iniciar treino" (ou "Iniciar sequência" de manhã); conclua uma série, deixe o descanso, feche e reabra o app; toque em "Doeu" e escolha 4 e depois 7.
- Decisões tomadas: o modo do dia desta etapa vem só da segurança (bloqueio vira Recuperação, atenção vira Reduzido); a etapa 8 troca isso pelo motor do coach. O catálogo fica por usuário, igual às outras tabelas. `workout_exercises` não foi criada: os exercícios do bloco continuam no JSON de `workouts`. Cada arrancada conta como uma série (6 no plano). Descanso de tornozelo fixado em 45 s para todos os exercícios dessa categoria.
- Pendências: fotos e vídeos dos exercícios (etapa 11); a prontidão ainda não entra na sugestão de progressão (a etapa 8 passa `prontidaoOk`).
- Teste automático: 195 testes de lógica e 47 de interface (fluxos, treino guiado e acessibilidade com axe nos dois temas) passando.
- Próximo passo: etapa 8 (motor do coach e adaptação).

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
