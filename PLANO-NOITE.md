MODO AUTÔNOMO (NOITE). Primeiro salve este texto inteiro como PLANO-NOITE.md na raiz do projeto. Depois execute do início ao fim, sem me fazer perguntas. Se parar por limite de uso ou perder o contexto, releia PLANO-NOITE.md e PROGRESSO.md e continue da primeira etapa não concluída.

   Antes de tudo, leia o arquivo ESPECIFICACAO-APP.txt (na raiz do projeto) inteiro. Ele é a fonte de verdade para visual, telas, botões, regras e critérios de aceitação de cada etapa. Releia a seção da etapa antes de começar cada uma e use-o para retomar o trabalho se parar. Se o arquivo e este prompt divergirem em visual ou comportamento do produto, vale o arquivo. Em segurança e limites, vale o mais restritivo.

CONTEXTO
Sou o Gabriel e volto às 7h. É o app pessoal de treino de futebol (PWA para iPhone) descrito no CLAUDE.md. Siga as regras dele: resumo ao final de cada tarefa, PROGRESSO.md e commit.

AUTORIZAÇÃO
Você tem minha autorização total para usar git, GitHub CLI (gh), Vercel CLI e Supabase CLI, que devem estar logadas nesta máquina. Pode: criar repositório e fazer push, ligar o projeto à Vercel, configurar variáveis de ambiente, fazer deploy, aplicar migrações no Supabase, criar tabelas, políticas de segurança por linha e dados de exemplo, e instalar dependências npm e as CLIs necessárias. Se uma CLI não estiver logada, não tente contornar: anote em PROGRESSO.md e continue localmente.
LIMITES: nunca apagar projeto, banco ou dados existentes; nunca usar supabase db reset em ambiente remoto nem git push --force; nunca imprimir nem commitar segredos (.env.local fica fora do git; chave service_role nunca no cliente); não mexer em nada fora da pasta do projeto, exceto instalar as CLIs; não implementar a IA (API do Claude) nem a biblioteca de imagens de exercícios nesta noite.

REGRAS DE EXECUÇÃO
- Comece lendo CLAUDE.md, PROGRESSO.md, git log, a estrutura de pastas e as imagens de referencias/ (se existirem). Decida de onde partir.
- Uma etapa por vez, na ordem. Ao fim de cada etapa: build e testes, corrigir o que falhar, atualizar PROGRESSO.md com o resumo, commit, push (se gh estiver logado) e deploy (se a Vercel estiver logada).
- Se falhar 3 vezes na mesma etapa: anote o problema, volte ao último commit estável e siga para a próxima.
- Em caso de dúvida, escolha a opção mais simples e anote a decisão.
- Se o Supabase não estiver conectado, use dados de exemplo locais e deixe tudo pronto para conectar depois.
- O visual deve ser moderno e polido, com animações suaves, conforme a etapa 1.

ETAPA 1: FUNDAÇÃO VISUAL
1. Leia as imagens em referencias/ só como inspiração de estilo (tema azul escuro, cartões de vidro, barra flutuante em pílula, botões em pílula). Não copie nome, logotipo, fotos nem textos delas. Nome provisório do app: "Meu Personal".
2. Tokens de design em um único lugar: cores (fundo #030B1F para #0A3A9C em degradê, botão principal #1F6BFF, realce #4DB8FF, texto #FFFFFF, texto secundário #B8C7E6, semáforo #2ECC71, #F5C542 e #FF5A5F), tipografia geométrica arredondada em fonte livre (por exemplo Poppins via next/font), raios, espaçamentos e sombras.
3. Componentes reutilizáveis: cartão de vidro, botão primário e secundário em pílula, barra de navegação inferior flutuante com 5 abas (Hoje, Semana, Personal, Evolução, Perfil) com círculo branco na aba ativa, cabeçalho com saudação, bloco de métrica, chips em pílula, anel de progresso, toast, skeleton de carregamento e estado vazio.
4. Animações com a biblioteca Motion: transição entre telas, toque nos botões, entrada dos cartões em sequência, anel de progresso animado e pulso suave no semáforo. Respeitar prefers-reduced-motion e limitar o uso de backdrop-filter para não pesar no iPhone.
5. Regras de qualidade: fonte mínima de 13 px, alto contraste (usar fundo mais opaco onde houver texto pequeno), áreas de toque de pelo menos 44 px, respeitar a área segura do iPhone e deixar espaço no fim das telas para a barra flutuante.
6. Rotas: /hoje, /semana, /personal (placeholder "em breve"), /evolucao, /perfil e login. Tela de abertura (splash) e PWA completo: manifest, ícones e cor de tema.
Pronto quando: o app compila, as 5 abas navegam com animação e o visual é consistente em todas as telas.

ETAPA 2: PLANO E TELA HOJE
1. Crie a migração 0002 com a tabela exercises (nome, grupo, tipo, observações) e cadastre o plano abaixo em plans, workouts e exercises, com segurança por linha. Se não conseguir aplicar no Supabase, mantenha o plano também como dados locais no código.
2. Plano da semana:
- Segunda: manhã, tornozelo 10 min e força de superiores e core (40 min). Noite: funcional leve a moderado com bola (sessão do instrutor).
- Terça: manhã, tornozelo 10 min e mobilidade. Jogo às 20h30.
- Quarta: manhã, tornozelo 10 min e força de pernas (45 min). Noite: funcional leve.
- Quinta: manhã, tornozelo 15 min antes de sair para o trabalho. Por volta das 19h, velocidade e arranque (35 min).
- Sexta: manhã, tornozelo e mobilidade (15 min). Noite: funcional como recuperação ativa.
- Sábado: ativação de tornozelo às 13h. Jogo às 14h30.
- Domingo: folga total.
3. Rotina do tornozelo, fase 1 (semanas 1 a 3): equilíbrio em um pé 3x30 s (depois de olhos fechados); elástico para fora, para dentro e para cima 3x15, lento; panturrilha no degrau descendo em 3 s, 3x12; joelho na parede 2x10.
4. Força de pernas (quarta): stiff 3x8; flexora 3x6 a 8 (2 séries nas semanas 1 e 2); afundo búlgaro ou step-up 3x8 por perna; panturrilha em pé e sentado 3x12 a 15; elevação de quadril 3x8 a 10.
5. Superiores e core (segunda): supino ou flexão, remada, desenvolvimento, prancha e abdominal com rotação, 3 séries cada, deixando 2 repetições de reserva.
6. Velocidade (quinta): aquecimento de 15 min, 6 a 8 arrancadas de 10 a 20 m com 1 a 2 min de pausa variando a saída, fechamento com arrancada e finalização. Semanas 1 e 2 a 80 a 85% da velocidade.
7. Tela Hoje: saudação por horário ("Bom dia, Gabriel"), cartão de destaque com o treino do dia, contagem para o próximo jogo, lista dos blocos do dia (manhã e noite) para marcar como feitos, e três blocos (dor, sono, carga) com valores de exemplo até a etapa 3.
8. Tela Semana: segunda a domingo com jogos destacados; tocar em um dia abre o detalhe com exercícios, séries e repetições. Cada exercício tem espaço reservado para mídia (será preenchido depois).
Pronto quando: a tela Hoje mostra o treino correto do dia da semana e a Semana mostra todos os dias com os detalhes.

ETAPA 3: CHECK-IN, REGISTRO DE SESSÃO E SEGURANÇA
1. Check-in de 30 segundos, só botões grandes: dor do tornozelo de 0 a 10, inchaço (sim ou não), "falhou" (sim ou não), energia de 1 a 5, sono (menos de 5 h, 5 a 6 h, 7 a 8 h, mais de 8 h), gatilho (chute, giro, terreno, nenhum) e observação opcional. Um por dia, salvo em checkins (se já existir no dia, atualiza). Animação de confirmação ao salvar.
2. Registro de sessão: feito, parcial ou não fiz; esforço de 0 a 10; duração; notas. Salvo em session_logs, a partir do bloco do dia na tela Hoje.
3. Regras de segurança em um único módulo (lib/safety), com testes automatizados (Vitest): dor de 6 ou mais, inchaço ou "falhou" bloqueia aumento de carga na semana e mostra aviso para buscar avaliação com ortopedista ou fisioterapeuta; dor de 4 a 5 mantém a carga; dor até 3 permite progredir. Os limites ficam no Perfil, em "Regras de segurança", e só eu edito, com confirmação antes de salvar.
4. A tela Hoje passa a mostrar dor, sono e carga com dados reais do check-in e das sessões.
Pronto quando: um check-in salvo muda a tela Hoje, e os testes das regras de segurança passam.

ETAPA 4: JOGOS, MODO PRÉ E PÓS-JOGO E SEMÁFORO
1. Jogos recorrentes: terça às 20h30 e sábado às 14h30, na tabela games: data, minutos jogados, dor depois (0 a 10), gatilho e notas.
2. Modo pré-jogo, que aparece na tela Hoje nas horas antes do jogo: lembrete da refeição principal (terça por volta das 17h30, sábado por volta das 11h30), lanche leve (19h15 na terça, 13h15 no sábado) e ativação guiada de 10 a 12 minutos com timer: elástico para fora, para dentro e para cima 1x15 cada, equilíbrio de 30 s em cada perna, corrida leve, mobilidade dinâmica e 2 a 3 progressivas. Lembrete de usar tornozeleira nas primeiras semanas.
3. Modo pós-jogo, que aparece depois do horário do jogo: pergunta de 10 segundos (minutos jogados, dor de 0 a 10, gatilho) e lembrete de comer logo depois.
4. Na tela Semana, mostrar a carga relativa aos jogos: 24 h antes recuperação ativa, 48 h antes velocidade, 72 h antes pico de volume.
5. Semáforo do tornozelo em módulo próprio (lib/semaforo) com testes: vermelho se dor de 6 ou mais, inchaço ou "falhou"; amarelo se dor de 4 a 5; verde se dor até 3 nos últimos check-ins. Cartão do semáforo na tela Hoje com o motivo em uma frase (por exemplo "dor 2 de 10 há 3 dias") e pulso suave animado.
Pronto quando: o modo pré-jogo aparece no horário certo, o pós-jogo grava em games e o semáforo muda com o check-in.

ETAPA 5: EVOLUÇÃO COM GRÁFICOS
1. Tela Evolução com faixa da semana (dia selecionado em destaque e jogos marcados), três círculos de métricas (treinos feitos, esforço médio, sono médio) e filtro semana ou mês.
2. Gráfico de linha da dor do tornozelo por semana, com os dias de jogo destacados, usando uma biblioteca leve (por exemplo Recharts) ou SVG próprio. Gráficos simples de esforço e sono.
3. Área do tornozelo: fase atual da reabilitação, histórico de dor depois dos jogos e jornada com marcos na tabela milestones (por exemplo, "30 dias sem dor acima de 3"), com data de conclusão.
4. Estados vazios amigáveis quando ainda não houver dados e animações de entrada dos gráficos.
Pronto quando: a tela Evolução mostra dados reais dos check-ins, sessões e jogos, e funciona sem dados.

AO TERMINAR A ETAPA 5
Pare. Escreva em PROGRESSO.md: o que foi feito, o que não foi possível (logins ausentes, falhas) e uma lista objetiva do que eu preciso fazer e testar de manhã.
