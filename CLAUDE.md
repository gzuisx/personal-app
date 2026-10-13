# App Personal de Treino

App pessoal (um único usuário) de acompanhamento de treino de futebol, em português, pensado primeiro para iPhone (PWA).

## Stack
Next.js (App Router, TypeScript, Tailwind), Supabase (login e Postgres), Vercel.

## Regras
- Chave da API do Claude só no servidor, em variável de ambiente. Nunca no código do cliente.
- Toda tabela tem user_id e segurança por linha ativada.
- Interface mobile first, botões grandes, uso com uma mão.
- Alterações de plano sugeridas pela IA viram propostas (ai_proposals) e só valem depois de eu aceitar.
- A IA não gera plano semanal novo toda semana: o plano atual já existe. Ela só propõe evolução (mais carga, mudar de fase do tornozelo) quando os dados mostrarem melhora.
- Regras de segurança do tornozelo ficam no código e só eu edito: dor 6/10 ou mais, inchaço ou "falhou" bloqueia aumento de carga.
- Ao terminar cada tarefa: rodar build e testes.

## Contexto
Jogos terça 20h30 e sábado 14h30. Funcional segunda, quarta e sexta. Foco: tornozelo direito, velocidade, arranque e força de posterior, panturrilha e coxa.
