# Progresso do app "Meu Personal"

Entradas mais recentes no topo. Fonte de verdade: `ESPECIFICACAO-APP.txt`. Plano da noite: `PLANO-NOITE.md`.

<!-- ENTRADAS -->

## 2026-10-13 02:25 - Etapa 1: fundação visual
- Feito: tema azul escuro com degradê fixo, fonte Poppins, tokens de design (CSS + TypeScript), 20 componentes reutilizáveis (cartão de vidro, botões em pílula, chips, escala de dor 0–10, barra inferior flutuante com 5 abas e círculo branco que desliza, anel de progresso, count-up, sheet, toast, skeleton, estado vazio, timer, faixa de dias, semáforo, banner, splash, logotipo original). Animações com Motion e opção "Reduzir animações" (Perfil + sistema). Tema claro e automático no Perfil. Rotas /hoje, /semana, /personal, /evolucao, /perfil e login com o visual novo. PWA: manifest "Meu Personal", ícones novos gerados do logotipo.
- Arquivos criados/alterados: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/*`, `src/components/providers.tsx`, `src/lib/design/tokens.ts`, `src/app/(app)/*`, `src/app/login/*`, `src/app/manifest.ts`, `scripts/gerar-icones.mjs`, `public/icons/*`.
- Como testar: abra o endereço no iPhone (Safari), toque nas 5 abas da barra inferior (o círculo branco desliza), vá em Perfil e troque tema/"Reduzir animações".
- Decisões tomadas: sem Recharts (gráficos serão SVG próprio, mais leve); splash aparece uma vez por sessão e pode ser pulada com `?splash=0`; botões usam animação de toque em CSS (scale 0.97) em vez de JS, para ser leve no iPhone; o desfoque (blur) é usado só na barra inferior.
- Pendências: nenhuma. Imagens de inspiração estão em `Ideias UI/` (não vão para o git).
- Próximo passo: etapa 2 (plano e tela Hoje).
