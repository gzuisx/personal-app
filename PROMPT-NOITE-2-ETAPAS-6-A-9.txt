MODO AUTÔNOMO (NOITE 2, ETAPAS 6 A 9). Primeiro salve este texto inteiro como PLANO-NOITE-2.md na raiz do projeto. Depois execute do início ao fim, sem me fazer perguntas. Se parar por limite de uso ou perder o contexto, releia PLANO-NOITE-2.md e PROGRESSO.md e continue da primeira etapa não concluída.

ARQUIVOS QUE VOCÊ DEVE LER ANTES DE TUDO (na raiz do projeto)
1. CLAUDE.md e PROGRESSO.md
2. ESPECIFICACAO-FASE-2.txt, inteiro. É a fonte de verdade desta noite: telas, regras, textos, tabelas e critérios de aceitação de cada etapa. A seção 20 lista as etapas 6 a 9; a seção 24 (ideias inspiradas no Apple Fitness) prevalece sobre qualquer trecho anterior que divirja.
3. Meu_Personal_Ideias_Funcionais_Apple_Fitness.txt (contexto da seção 24)
4. ESPECIFICACAO-APP.txt (base visual e regras já construídas nas etapas 1 a 5)
5. RELATORIO-ETAPAS-1-A-5.txt, se existir, e as imagens de "Ideias UI" e referencias/
Releia a seção da etapa antes de começar cada uma. Em caso de divergência entre este prompt e a especificação, vale a especificação. Em segurança e limites, vale o mais restritivo.

CONTEXTO
Sou o Gabriel e volto de manhã. É o app pessoal de treino de futebol (PWA para iPhone) "Meu Personal". As etapas 1 a 5 já estão prontas. Esta noite: etapas 6, 7, 8 e 9, nesta ordem. Siga o CLAUDE.md: resumo ao final de cada tarefa, PROGRESSO.md atualizado e commit. Use a skill caveman nas respostas.

AUTORIZAÇÃO
Autorização total para git, GitHub CLI (gh), Vercel CLI e Supabase CLI já logadas nesta máquina: commit, push, deploy, variáveis de ambiente, migrações novas (0005, 0006, 0007), tabelas, políticas RLS e dados de exemplo, instalar dependências npm. Se uma CLI não estiver logada, não contorne: anote em PROGRESSO.md e continue localmente.
LIMITES: nunca apagar projeto, banco ou dados existentes; nunca usar supabase db reset em ambiente remoto nem git push --force; migrações só aditivas (nada de DROP de dados reais); nunca imprimir nem commitar segredos; chave service_role nunca no cliente; não mexer fora da pasta do projeto; NÃO implementar a IA do Claude no app (etapa 12), nem a biblioteca de mídia (etapa 11), nem lembretes/push (etapa 10).

REGRAS DE EXECUÇÃO
- Uma etapa por vez. Ao fim de cada uma: build, lint e testes; corrigir o que falhar; atualizar PROGRESSO.md (formato da seção 15.2 da ESPECIFICACAO-APP.txt); commit; push; deploy.
- Se falhar 3 vezes na mesma etapa: anote o problema, volte ao último commit estável e siga para a próxima.
- Em dúvida, escolha a opção mais simples e anote a decisão em PROGRESSO.md.
- Se o Supabase não estiver conectado, use dados locais pelo repositório local e deixe pronto para conectar.
- Segurança do tornozelo nunca é relaxada: nenhuma função libera progressão de carga quando a segurança bloqueia.
- Nada de "% de recuperação" em nenhuma tela. A nota de prontidão 0 a 100 é só interna; a interface mostra modo + motivos.
- Não copie nome, cores, ícones nem textos do Apple Fitness. Use o design próprio do app.
- Crie testes (Vitest) para toda lógica nova em lib/ e testes Playwright para os fluxos principais.

ETAPA 6: CORREÇÕES, DECISÕES E VISUAL ALVO
Tarefas: C1 a C12, C16 e C17 (seção 1.2), seções 18.1, 24.1 (anéis acionáveis do plano) e 24.4 (card de jogo de 3 etapas); migração 0005.
Pronto quando: todos os itens de aceitação da etapa 6 na seção 20 estiverem marcados (segurança adaptativa C2 com 4 cenários testados, rótulos de carga por dia corrido, modo demonstração opt-in e apagável, fase do tornozelo no banco, card de jogo na Semana, acessibilidade, ESLint + Playwright + CI, anéis abrindo a pendência certa, "Descanso" no domingo e modo Folga, card de jogo com check-in do dia seguinte vinculado e rota /jogo/[id]).

ETAPA 7: TREINO GUIADO E REGISTRO DE SÉRIES
Tarefas: seção 5 inteira; migração 0006 (set_logs, catálogo base, plan_versions, execution_state); progressão por exercício (6.1) só como cálculo e sugestão; refinamentos do treino guiado (24.2) e Sequência do dia (24.6); religar os anéis TREINOS e TORNOZELO ao treino guiado.
Pronto quando: "Iniciar treino" grava cada série e retoma treino interrompido; botão principal único conduz série, descanso, próxima série, finalizar; timer, "Doeu" (R11), pular e trocar exercício funcionam; valores sugeridos vêm da última sessão; tela fica acesa quando suportado; Sequência do dia encadeia os blocos e retoma após fechar o app; anéis abrem o treino guiado.

ETAPA 8: MOTOR DO COACH E ADAPTAÇÃO
Tarefas: seções 3, 4, 6, 8, 11 (exceções e "só tenho X min") e 7.2/7.4 (regras e recomendador); botões "Por que?" e "Ajustar treino" na Hoje; cartão "Decisão do dia"; propostas sem IA (progressão, fase, descarga, plano); migração 0007 (parte calendar_overrides e routine). Incluir as regras R17 e R18 e a exibição do modo sem porcentagem (24.3 e).
Pronto quando: prontidão, modo e carga com testes de fronteira; as 18 regras (R01 a R18) com testes de "dispara" e "não dispara"; propostas com checklist de critérios e Aceitar/Adiar/Recusar (aceitar cria plan_version e audit_log); "Por que?" mostra regra, dados e o que mudaria a decisão.

ETAPA 9: TESTES DE CAMPO, METAS, DIÁRIO E INSIGHTS
Tarefas: seções 9 e 10; novas colunas do check-in (região, movimento, duração); abas da Evolução (Resumo, Calendário, Carga, Tornozelo, Força, Testes, Insights, Jogos); migração (field_tests, goals, game_stats) numerada em sequência segura, sem sobrescrever a 0007. Incluir carga da semana tocável (24.3), calendário planejado x realizado (24.5) e evolução por exercício com comparação de sessões (24.7).
Pronto quando: testes T1 a T6 gravam e mostram evolução e simetria; diário do centroavante em 20 s com tendência de 5 jogos; cada insight (I1 a I10) só aparece com dados mínimos e mostra "N registros" e "Por que?"; marcos automáticos pedem confirmação; tocar em um dia da carga lista as sessões e jogos, e "Como calculamos" mostra a fórmula; calendário coerente com Hoje e Semana; comparar sessões usa só dados registrados e informa quantas faltam.

AO TERMINAR A ETAPA 9
Pare. Escreva em PROGRESSO.md: o que foi feito etapa por etapa, o que não foi possível (logins ausentes, falhas, decisões tomadas por conta própria) e uma lista objetiva do que eu preciso testar no iPhone de manhã, em ordem. Termine com um resumo curto em português.
