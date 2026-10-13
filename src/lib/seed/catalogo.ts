// Catálogo de exercícios (seção 7.1 e 7.3 da fase 2). Conteúdo próprio, sem texto copiado de outros apps.
// Sem importações com alias: o script scripts/gerar-0006-sql.ts também lê este arquivo.

export type TipoCatalogo =
  "tornozelo" | "forca" | "velocidade" | "potencia" | "mobilidade" | "core" | "bola" | "visao";

export type Equipamento =
  "nenhum" | "elastico" | "degrau" | "anilha" | "halter" | "barra" | "academia" | "campo" | "cones";

export type Impacto = "baixo" | "medio" | "alto";

export type ItemCatalogo = {
  id: string;
  nome: string;
  grupo: string;
  tipo: TipoCatalogo;
  equipamento: Equipamento[];
  /** 1 (mais fácil) a 5 */
  nivel: 1 | 2 | 3 | 4 | 5;
  /** fase mínima do tornozelo para aparecer no plano (1 a 4) */
  faseMinima: 1 | 2 | 3 | 4;
  impacto: Impacto;
  contraindicacoes: string[];
  /** próxima variação mais difícil */
  progressao?: string;
  /** variação mais fácil (usada quando doeu) */
  regressao?: string;
  alternativas: string[];
  series: number;
  /** "8", "6 a 8", "30 s"... */
  reps: string;
  tempoS?: number;
  descansoS: number;
  /** 2 linhas */
  comoFazer: [string, string];
  /** 1 linha */
  cuidado: string;
  midia: string | null;
  licenca: string;
};

type Base = Omit<
  ItemCatalogo,
  | "id"
  | "nome"
  | "grupo"
  | "tipo"
  | "midia"
  | "licenca"
  | "alternativas"
  | "contraindicacoes"
  | "faseMinima"
  | "nivel"
  | "impacto"
  | "equipamento"
> &
  Partial<
    Pick<
      ItemCatalogo,
      "alternativas" | "contraindicacoes" | "faseMinima" | "nivel" | "impacto" | "equipamento"
    >
  >;

function item(id: string, nome: string, grupo: string, tipo: TipoCatalogo, b: Base): ItemCatalogo {
  return {
    id,
    nome,
    grupo,
    tipo,
    equipamento: ["nenhum"],
    nivel: 1,
    faseMinima: 1,
    impacto: "baixo",
    contraindicacoes: [],
    alternativas: [],
    midia: null,
    licenca: "conteúdo próprio",
    ...b,
  };
}

const LEVE = "Pare se a dor passar de 3 em 10.";

export const CATALOGO: ItemCatalogo[] = [
  // ---------------------------------------------------------------- tornozelo: mobilidade
  item("joelho-parede", "Joelho na parede", "Tornozelo", "mobilidade", {
    series: 2,
    reps: "10",
    descansoS: 30,
    progressao: "alongamento-panturrilha-degrau",
    comoFazer: [
      "Pé a um palmo da parede, calcanhar no chão.",
      "Leve o joelho até tocar a parede sem erguer o calcanhar.",
    ],
    cuidado: "Se o calcanhar subir, afaste o pé um pouco.",
    alternativas: ["alongamento-panturrilha-degrau", "circulos-tornozelo"],
  }),
  item("alongamento-panturrilha-degrau", "Alongamento de panturrilha no degrau", "Tornozelo", "mobilidade", {
    series: 2,
    reps: "30 s",
    tempoS: 30,
    descansoS: 30,
    regressao: "joelho-parede",
    comoFazer: [
      "Ponta do pé no degrau, calcanhar para fora.",
      "Desça o calcanhar devagar, com o joelho esticado e depois dobrado.",
    ],
    cuidado: "Segure só até sentir esticar, sem dor.",
    alternativas: ["joelho-parede"],
  }),
  item("circulos-tornozelo", "Círculos de tornozelo controlados", "Tornozelo", "mobilidade", {
    series: 2,
    reps: "10",
    descansoS: 20,
    regressao: "joelho-parede",
    comoFazer: [
      "Sentado, pé no ar, desenhe círculos grandes com o pé.",
      "Faça 10 para cada lado, sem pressa.",
    ],
    cuidado: "Movimento amplo e lento; pare se doer.",
    alternativas: ["joelho-parede"],
  }),

  // ---------------------------------------------------------------- tornozelo: força
  item("el-fora", "Elástico: pé para fora", "Tornozelo", "tornozelo", {
    equipamento: ["elastico"],
    series: 3,
    reps: "15",
    descansoS: 45,
    progressao: "isometria-eversao-parede",
    comoFazer: [
      "Elástico preso ao lado de dentro do pé, perna esticada.",
      "Leve o pé para fora devagar e volte contando 3 s.",
    ],
    cuidado: LEVE,
    alternativas: ["isometria-eversao-parede", "el-dentro"],
  }),
  item("el-dentro", "Elástico: pé para dentro", "Tornozelo", "tornozelo", {
    equipamento: ["elastico"],
    series: 3,
    reps: "15",
    descansoS: 45,
    comoFazer: [
      "Elástico preso ao lado de fora do pé.",
      "Leve o pé para dentro devagar e volte contando 3 s.",
    ],
    cuidado: LEVE,
    alternativas: ["el-fora"],
  }),
  item("el-cima", "Elástico: pé para cima", "Tornozelo", "tornozelo", {
    equipamento: ["elastico"],
    series: 3,
    reps: "15",
    descansoS: 45,
    comoFazer: ["Elástico preso à frente do pé.", "Puxe a ponta do pé para cima e volte devagar."],
    cuidado: LEVE,
    alternativas: ["el-baixo"],
  }),
  item("el-baixo", "Elástico: ponta do pé para baixo", "Tornozelo", "tornozelo", {
    equipamento: ["elastico"],
    series: 3,
    reps: "15",
    descansoS: 45,
    comoFazer: [
      "Elástico no peito do pé, preso atrás de você.",
      "Empurre a ponta do pé para baixo e volte devagar.",
    ],
    cuidado: LEVE,
    alternativas: ["el-cima"],
  }),
  item("isometria-eversao-parede", "Isometria de eversão contra a parede", "Tornozelo", "tornozelo", {
    series: 3,
    reps: "20 s",
    tempoS: 20,
    descansoS: 30,
    regressao: "el-fora",
    nivel: 2,
    comoFazer: [
      "Lado de fora do pé contra a parede, joelho esticado.",
      "Empurre a parede com o pé e segure sem mexer a perna.",
    ],
    cuidado: "Força moderada, sem dor.",
    alternativas: ["el-fora"],
  }),
  item("pant-degrau", "Panturrilha no degrau", "Tornozelo", "tornozelo", {
    equipamento: ["degrau"],
    series: 3,
    reps: "12",
    descansoS: 45,
    progressao: "pant-um-pe",
    regressao: "caminhada-pontas",
    nivel: 2,
    comoFazer: [
      "Pontas dos pés no degrau, suba nas pontas.",
      "Desça contando 3 s até o calcanhar passar do degrau.",
    ],
    cuidado: "Segure em algo para se equilibrar.",
    alternativas: ["caminhada-pontas"],
  }),
  item("pant-um-pe", "Panturrilha em um pé só", "Tornozelo", "tornozelo", {
    equipamento: ["degrau"],
    series: 3,
    reps: "10",
    descansoS: 45,
    faseMinima: 2,
    nivel: 3,
    regressao: "pant-degrau",
    progressao: "pant-um-pe-carga",
    comoFazer: [
      "Em um pé no degrau, suba nas pontas com o joelho esticado.",
      "Repita com o joelho dobrado, descendo devagar.",
    ],
    cuidado: "Se a dor passar de 3, volte para os dois pés.",
    alternativas: ["pant-degrau"],
  }),
  item("pant-um-pe-carga", "Panturrilha em um pé com carga", "Tornozelo", "tornozelo", {
    equipamento: ["degrau", "halter"],
    series: 3,
    reps: "8",
    descansoS: 60,
    faseMinima: 3,
    nivel: 4,
    regressao: "pant-um-pe",
    progressao: "pant-descida-lenta",
    comoFazer: ["Em um pé, segure um halter ou mochila no lado do pé.", "Suba nas pontas e desça devagar."],
    cuidado: "Carga leve primeiro; sem dor.",
    alternativas: ["pant-um-pe"],
  }),
  item("pant-descida-lenta", "Panturrilha com descida lenta (4 s)", "Tornozelo", "tornozelo", {
    equipamento: ["degrau"],
    series: 3,
    reps: "8",
    descansoS: 60,
    faseMinima: 3,
    nivel: 4,
    regressao: "pant-um-pe-carga",
    comoFazer: ["Suba com os dois pés e tire um.", "Desça só com o pé de teste, contando 4 s."],
    cuidado: LEVE,
    alternativas: ["pant-um-pe"],
  }),
  item("caminhada-pontas", "Caminhada nas pontas dos pés", "Tornozelo", "tornozelo", {
    series: 2,
    reps: "20 passos",
    descansoS: 30,
    progressao: "pant-degrau",
    comoFazer: [
      "Caminhe nas pontas dos pés, com o corpo alto.",
      "Depois repita nos calcanhares, com a ponta do pé para cima.",
    ],
    cuidado: "Passos curtos e controlados.",
    alternativas: ["pant-degrau"],
  }),

  // ---------------------------------------------------------------- tornozelo: propriocepção
  item("eq-um-pe", "Equilíbrio em um pé só (direito)", "Tornozelo", "tornozelo", {
    series: 3,
    reps: "30 s",
    tempoS: 30,
    descansoS: 30,
    progressao: "eq-olhos-fechados",
    comoFazer: [
      "Em pé só no pé direito, joelho levemente dobrado.",
      "Olhe para um ponto fixo e mantenha o quadril parado.",
    ],
    cuidado: "Fique perto de uma parede para se apoiar.",
    alternativas: ["eq-olhos-fechados"],
  }),
  item("eq-olhos-fechados", "Equilíbrio em um pé, olhos fechados", "Tornozelo", "tornozelo", {
    series: 3,
    reps: "20 s",
    tempoS: 20,
    descansoS: 30,
    nivel: 3,
    regressao: "eq-um-pe",
    progressao: "eq-almofada-simples",
    comoFazer: [
      "No pé direito, feche os olhos depois de firmar.",
      "Conte as vezes que o outro pé tocar o chão.",
    ],
    cuidado: "Só com uma parede por perto.",
    alternativas: ["eq-um-pe"],
  }),
  item("eq-almofada-simples", "Equilíbrio na almofada", "Tornozelo", "tornozelo", {
    equipamento: ["nenhum"],
    series: 3,
    reps: "30 s",
    tempoS: 30,
    descansoS: 30,
    faseMinima: 2,
    nivel: 3,
    regressao: "eq-um-pe",
    progressao: "eq-almofada",
    comoFazer: [
      "Em um pé sobre uma almofada firme ou toalha dobrada.",
      "Mantenha o joelho alinhado com o pé.",
    ],
    cuidado: "Almofada firme e perto de apoio.",
    alternativas: ["eq-um-pe"],
  }),
  item("eq-almofada", "Equilíbrio na almofada passando a bola", "Tornozelo", "tornozelo", {
    equipamento: ["nenhum"],
    series: 3,
    reps: "30 s",
    tempoS: 30,
    descansoS: 30,
    faseMinima: 2,
    nivel: 4,
    regressao: "eq-almofada-simples",
    progressao: "eq-perturbacao",
    comoFazer: [
      "Em um pé na almofada, passe a bola contra a parede.",
      "Receba e passe sem perder o equilíbrio.",
    ],
    cuidado: LEVE,
    alternativas: ["eq-almofada-simples"],
  }),
  item("eq-perturbacao", "Equilíbrio com perturbações leves", "Tornozelo", "tornozelo", {
    series: 3,
    reps: "30 s",
    tempoS: 30,
    descansoS: 30,
    faseMinima: 3,
    nivel: 5,
    regressao: "eq-almofada",
    comoFazer: [
      "Em um pé, alguém passa a bola de ângulos diferentes.",
      "Controle o corpo sem apoiar o outro pé.",
    ],
    cuidado: "Comece com passes lentos.",
    alternativas: ["eq-almofada"],
  }),
  item("alcance-multidirecional", "Alcance multidirecional", "Tornozelo", "tornozelo", {
    series: 2,
    reps: "5 por direção",
    descansoS: 30,
    faseMinima: 2,
    nivel: 3,
    comoFazer: [
      "Em um pé, toque o chão à frente, ao lado e atrás com o outro pé.",
      "Volte ao centro entre cada toque, sem se apoiar.",
    ],
    cuidado: "Alcance só até onde controla.",
    alternativas: ["eq-um-pe"],
  }),

  // ---------------------------------------------------------------- saltos e agilidade (fase 3+)
  item("saltinhos-lugar", "Saltinhos no lugar", "Tornozelo", "tornozelo", {
    series: 3,
    reps: "10",
    descansoS: 45,
    faseMinima: 2,
    nivel: 3,
    impacto: "medio",
    progressao: "salto-bipodal-aterrissagem",
    contraindicacoes: ["dor lateral >= 4"],
    comoFazer: [
      "Saltos curtos nas pontas dos pés, sem tirar o corpo do lugar.",
      "Aterrisse macio, com joelho levemente dobrado.",
    ],
    cuidado: LEVE,
    alternativas: ["pant-degrau"],
  }),
  item(
    "salto-bipodal-aterrissagem",
    "Salto e aterrissagem controlada nos dois pés",
    "Tornozelo",
    "tornozelo",
    {
      series: 3,
      reps: "8",
      descansoS: 60,
      faseMinima: 3,
      nivel: 4,
      impacto: "medio",
      regressao: "saltinhos-lugar",
      progressao: "salto-aterrissagem",
      contraindicacoes: ["dor lateral >= 4"],
      comoFazer: [
        "Salte para cima e aterrisse nos dois pés, parando 2 s.",
        "Joelhos para frente, nunca para dentro.",
      ],
      cuidado: LEVE,
      alternativas: ["saltinhos-lugar"],
    },
  ),
  item("salto-aterrissagem", "Saltos e aterrissagens em um pé só", "Tornozelo", "tornozelo", {
    series: 3,
    reps: "8",
    descansoS: 60,
    faseMinima: 3,
    nivel: 4,
    impacto: "alto",
    regressao: "salto-bipodal-aterrissagem",
    progressao: "salto-lateral",
    contraindicacoes: ["dor lateral >= 4", "semáforo diferente de verde"],
    comoFazer: [
      "Salte em um pé e aterrisse no mesmo pé, firme por 2 s.",
      "Quadril estável, joelho alinhado.",
    ],
    cuidado: LEVE,
    alternativas: ["salto-bipodal-aterrissagem"],
  }),
  item("salto-lateral", "Saltos laterais e mudanças de direção", "Tornozelo", "tornozelo", {
    series: 3,
    reps: "8",
    descansoS: 60,
    faseMinima: 3,
    nivel: 5,
    impacto: "alto",
    regressao: "salto-aterrissagem",
    progressao: "zigue-zague-lento",
    contraindicacoes: ["dor lateral >= 4", "semáforo diferente de verde"],
    comoFazer: [
      "Salte de lado a lado sobre uma linha, em um pé.",
      "Comece devagar e aumente a velocidade só se estiver firme.",
    ],
    cuidado: LEVE,
    alternativas: ["salto-aterrissagem"],
  }),
  item("zigue-zague-lento", "Zigue-zague em cones, devagar", "Tornozelo", "tornozelo", {
    equipamento: ["cones", "campo"],
    series: 3,
    reps: "4 voltas",
    descansoS: 60,
    faseMinima: 3,
    nivel: 4,
    impacto: "medio",
    progressao: "mudanca-direcao",
    contraindicacoes: ["dor lateral >= 4"],
    comoFazer: [
      "Contorne 5 cones, a um metro um do outro, em trote leve.",
      "Olhe à frente, não para os pés.",
    ],
    cuidado: LEVE,
    alternativas: ["salto-lateral"],
  }),
  item("mudanca-direcao", "Mudança de direção com desaceleração", "Tornozelo", "tornozelo", {
    equipamento: ["cones", "campo"],
    series: 4,
    reps: "1 corrida",
    descansoS: 90,
    faseMinima: 3,
    nivel: 5,
    impacto: "alto",
    progressao: "giros-com-bola",
    contraindicacoes: ["dor lateral >= 4", "semáforo diferente de verde"],
    comoFazer: [
      "Corra 8 m, desacelere em 2 passos e troque de direção.",
      "Apoie o pé de fora com o joelho alinhado.",
    ],
    cuidado: LEVE,
    alternativas: ["zigue-zague-lento"],
  }),
  item("giros-com-bola", "Giros com bola", "Bola", "bola", {
    equipamento: ["campo", "cones"],
    series: 4,
    reps: "6 giros",
    descansoS: 60,
    faseMinima: 3,
    nivel: 4,
    impacto: "medio",
    comoFazer: [
      "Receba a bola de costas para o cone e gire para os dois lados.",
      "Primeiro toque já na direção do giro.",
    ],
    cuidado: LEVE,
    alternativas: ["conducao-slalom"],
  }),

  // ---------------------------------------------------------------- posterior de coxa
  item("stiff", "Stiff (levantamento terra romeno)", "Posterior de coxa", "forca", {
    equipamento: ["halter", "barra", "academia"],
    series: 3,
    reps: "8",
    descansoS: 90,
    nivel: 2,
    progressao: "stiff-unilateral",
    comoFazer: [
      "Joelhos levemente dobrados, leve o quadril para trás com as costas retas.",
      "Desça até sentir esticar atrás da coxa e volte apertando o glúteo.",
    ],
    cuidado: "Costas neutras; pare se doer na lombar.",
    alternativas: ["ponte-gluteo", "stiff-unilateral"],
  }),
  item("stiff-unilateral", "Stiff em uma perna", "Posterior de coxa", "forca", {
    equipamento: ["halter"],
    series: 3,
    reps: "8 por perna",
    descansoS: 90,
    faseMinima: 2,
    nivel: 3,
    regressao: "stiff",
    comoFazer: [
      "Em uma perna, leve o tronco à frente e a outra perna para trás.",
      "Volte controlando, sem girar o quadril.",
    ],
    cuidado: "Comece sem peso para testar o equilíbrio.",
    alternativas: ["stiff"],
  }),
  item("ponte-gluteo", "Ponte de glúteo", "Posterior de coxa", "forca", {
    series: 3,
    reps: "12",
    descansoS: 60,
    progressao: "ponte-flexao-joelho",
    comoFazer: [
      "Deitado, pés no chão, suba o quadril apertando o glúteo.",
      "Segure 1 s no alto e desça devagar.",
    ],
    cuidado: "Não arqueie a lombar no alto.",
    alternativas: ["elev-quadril"],
  }),
  item("ponte-flexao-joelho", "Ponte com flexão de joelho (toalha)", "Posterior de coxa", "forca", {
    series: 3,
    reps: "8",
    descansoS: 75,
    nivel: 3,
    regressao: "ponte-gluteo",
    progressao: "nordica-assistida",
    comoFazer: [
      "Calcanhares em uma toalha no chão, suba o quadril.",
      "Deslize os calcanhares para perto do glúteo e volte.",
    ],
    cuidado: "Se o posterior apertar, reduza a amplitude.",
    alternativas: ["ponte-gluteo"],
  }),
  item("flexora", "Flexora (elástico, slider ou nórdica assistida)", "Posterior de coxa", "forca", {
    equipamento: ["elastico", "academia"],
    series: 3,
    reps: "6 a 8",
    descansoS: 90,
    nivel: 3,
    regressao: "ponte-flexao-joelho",
    progressao: "nordica-excentrica",
    comoFazer: [
      "Controle a descida do corpo ou da carga contando 3 s.",
      "Suba com ajuda do elástico ou das mãos, se precisar.",
    ],
    cuidado: "Pare se o posterior da coxa doer.",
    alternativas: ["ponte-flexao-joelho", "nordica-assistida"],
  }),
  item("nordica-assistida", "Flexora nórdica assistida (elástico)", "Posterior de coxa", "forca", {
    equipamento: ["elastico"],
    series: 3,
    reps: "6",
    descansoS: 90,
    faseMinima: 2,
    nivel: 4,
    regressao: "ponte-flexao-joelho",
    progressao: "nordica-excentrica",
    comoFazer: [
      "Ajoelhado com os pés presos, desça o corpo devagar com ajuda do elástico.",
      "Segure no chão com as mãos e volte.",
    ],
    cuidado: "Desça só até onde controla.",
    alternativas: ["flexora"],
  }),
  item("nordica-excentrica", "Flexora nórdica excêntrica completa", "Posterior de coxa", "forca", {
    series: 3,
    reps: "5",
    descansoS: 120,
    faseMinima: 3,
    nivel: 5,
    regressao: "nordica-assistida",
    comoFazer: [
      "Ajoelhado com os pés presos, desça o corpo inteiro o mais devagar possível.",
      "Amorteça no chão com as mãos e volte.",
    ],
    cuidado: "Exercício forte: só com o posterior sem queixa.",
    alternativas: ["nordica-assistida"],
  }),
  item("isometria-posterior", "Isometria de posterior em 30 graus", "Posterior de coxa", "forca", {
    series: 3,
    reps: "20 s",
    tempoS: 20,
    descansoS: 45,
    nivel: 2,
    comoFazer: [
      "Calcanhar no chão, joelho levemente dobrado, empurre o calcanhar para baixo.",
      "Segure sem mexer a perna.",
    ],
    cuidado: "Força moderada, sem dor.",
    alternativas: ["ponte-gluteo"],
  }),

  // ---------------------------------------------------------------- panturrilha
  item("pant-pe-sentado", "Panturrilha em pé e sentado", "Panturrilha", "forca", {
    equipamento: ["degrau", "halter"],
    series: 3,
    reps: "12 a 15",
    descansoS: 60,
    nivel: 2,
    comoFazer: [
      "Suba nas pontas dos pés, devagar, e desça contando 3 s.",
      "Faça metade em pé e metade sentado, com carga no joelho.",
    ],
    cuidado: "Movimento lento e completo.",
    alternativas: ["pant-degrau"],
  }),
  item("pant-excentrica", "Panturrilha excêntrica lenta", "Panturrilha", "forca", {
    equipamento: ["degrau"],
    series: 3,
    reps: "10",
    descansoS: 60,
    nivel: 3,
    comoFazer: ["Suba com os dois pés e desça com um só, em 4 s.", "Troque de pé a cada série."],
    cuidado: LEVE,
    alternativas: ["pant-pe-sentado"],
  }),
  item("pogo", "Pogo jumps (saltos curtos)", "Panturrilha", "potencia", {
    series: 3,
    reps: "15",
    descansoS: 60,
    faseMinima: 3,
    nivel: 4,
    impacto: "medio",
    contraindicacoes: ["dor lateral >= 4", "semáforo diferente de verde"],
    comoFazer: [
      "Saltos rápidos e baixos, só com o movimento do tornozelo.",
      "Joelhos quase esticados, contato curto com o chão.",
    ],
    cuidado: LEVE,
    alternativas: ["saltinhos-lugar"],
  }),

  // ---------------------------------------------------------------- coxa e glúteo
  item("agachamento-goblet", "Agachamento goblet", "Coxa", "forca", {
    equipamento: ["halter"],
    series: 3,
    reps: "10",
    descansoS: 90,
    nivel: 2,
    progressao: "bulgaro",
    comoFazer: [
      "Segure o peso junto ao peito e agache com as costas retas.",
      "Joelhos na direção dos pés; suba empurrando o chão.",
    ],
    cuidado: "Calcanhares no chão.",
    alternativas: ["agach-isometrico-parede"],
  }),
  item("bulgaro", "Afundo búlgaro ou step-up", "Coxa", "forca", {
    equipamento: ["halter", "degrau"],
    series: 3,
    reps: "8 por perna",
    descansoS: 90,
    nivel: 3,
    regressao: "step-up",
    comoFazer: [
      "Pé de trás apoiado atrás, desça o joelho de trás perto do chão.",
      "Suba empurrando com a perna da frente.",
    ],
    cuidado: "Joelho da frente alinhado com o pé.",
    alternativas: ["step-up", "agachamento-goblet"],
  }),
  item("step-up", "Step-up", "Coxa", "forca", {
    equipamento: ["degrau", "halter"],
    series: 3,
    reps: "8 por perna",
    descansoS: 75,
    nivel: 2,
    progressao: "bulgaro",
    comoFazer: ["Suba no degrau com uma perna e fique em pé em cima.", "Desça devagar com a mesma perna."],
    cuidado: "Degrau firme e estável.",
    alternativas: ["agachamento-goblet"],
  }),
  item("agach-isometrico-parede", "Agachamento isométrico na parede", "Coxa", "forca", {
    series: 3,
    reps: "30 s",
    tempoS: 30,
    descansoS: 60,
    nivel: 2,
    comoFazer: ["Costas na parede, joelhos a 90 graus, pés à frente.", "Segure respirando normalmente."],
    cuidado: "Desça só até um ângulo confortável.",
    alternativas: ["agachamento-goblet"],
  }),
  item("agach-uma-perna", "Agachamento em uma perna e saltinhos no lugar", "Coxa", "forca", {
    series: 3,
    reps: "10",
    descansoS: 75,
    faseMinima: 2,
    nivel: 4,
    impacto: "medio",
    regressao: "step-up",
    contraindicacoes: ["dor lateral >= 4"],
    comoFazer: [
      "Em um pé, agache até onde controla e suba.",
      "Depois faça saltinhos curtos no lugar, no mesmo pé.",
    ],
    cuidado: LEVE,
    alternativas: ["step-up", "eq-um-pe"],
  }),
  item("hip-thrust", "Hip thrust", "Glúteo", "forca", {
    equipamento: ["halter", "barra"],
    series: 3,
    reps: "10",
    descansoS: 90,
    nivel: 2,
    comoFazer: [
      "Costas apoiadas em um banco, peso no quadril.",
      "Suba o quadril apertando o glúteo e desça devagar.",
    ],
    cuidado: "Queixo para o peito, sem arquear a lombar.",
    alternativas: ["ponte-gluteo"],
  }),
  item("elev-quadril", "Elevação de quadril", "Glúteo e posterior", "forca", {
    series: 3,
    reps: "8 a 10",
    descansoS: 60,
    nivel: 2,
    progressao: "ponte-flexao-joelho",
    comoFazer: ["Deitado, suba o quadril com os pés no chão.", "Segure 1 s no alto e desça controlando."],
    cuidado: "Pare se doer na lombar.",
    alternativas: ["ponte-gluteo"],
  }),
  item("abducao-elastico", "Abdução de quadril com elástico", "Glúteo", "forca", {
    equipamento: ["elastico"],
    series: 3,
    reps: "15",
    descansoS: 45,
    comoFazer: [
      "Elástico acima dos joelhos, em pé, afaste uma perna para o lado.",
      "Volte devagar, sem inclinar o tronco.",
    ],
    cuidado: "Quadril parado.",
    alternativas: ["clamshell"],
  }),
  item("clamshell", "Clamshell", "Glúteo", "forca", {
    equipamento: ["elastico"],
    series: 3,
    reps: "15",
    descansoS: 45,
    comoFazer: [
      "Deitado de lado, joelhos dobrados, abra o joelho de cima.",
      "Os pés ficam juntos; o quadril não gira.",
    ],
    cuidado: "Movimento curto e firme.",
    alternativas: ["abducao-elastico"],
  }),
  item("caminhada-lateral-elastico", "Caminhada lateral com elástico", "Glúteo", "forca", {
    equipamento: ["elastico"],
    series: 3,
    reps: "12 passos",
    descansoS: 45,
    comoFazer: [
      "Elástico acima dos joelhos, agachamento leve.",
      "Dê passos laterais mantendo o elástico esticado.",
    ],
    cuidado: "Joelhos alinhados com os pés.",
    alternativas: ["abducao-elastico"],
  }),

  // ---------------------------------------------------------------- core
  item("prancha", "Prancha", "Core", "core", {
    series: 3,
    reps: "30 a 45 s",
    tempoS: 30,
    descansoS: 45,
    nivel: 2,
    progressao: "prancha-lateral",
    comoFazer: [
      "Antebraços e pontas dos pés no chão, corpo em linha reta.",
      "Aperte o abdômen e respire normalmente.",
    ],
    cuidado: "Não deixe o quadril cair.",
    alternativas: ["dead-bug"],
  }),
  item("prancha-lateral", "Prancha lateral", "Core", "core", {
    series: 3,
    reps: "20 s",
    tempoS: 20,
    descansoS: 45,
    nivel: 3,
    regressao: "prancha",
    comoFazer: ["De lado, apoie o antebraço e suba o quadril.", "Corpo em linha reta; troque de lado."],
    cuidado: "Ombro sobre o cotovelo.",
    alternativas: ["prancha"],
  }),
  item("dead-bug", "Dead bug", "Core", "core", {
    series: 3,
    reps: "8 por lado",
    descansoS: 45,
    nivel: 2,
    comoFazer: [
      "Deitado, braços para cima e joelhos a 90 graus.",
      "Estique braço e perna opostos devagar, sem arquear a lombar.",
    ],
    cuidado: "Lombar colada no chão.",
    alternativas: ["prancha"],
  }),
  item("pallof", "Pallof press com elástico", "Core", "core", {
    equipamento: ["elastico"],
    series: 3,
    reps: "10 por lado",
    descansoS: 45,
    nivel: 3,
    comoFazer: [
      "De lado para o elástico, empurre as mãos à frente do peito.",
      "Não deixe o elástico girar o seu tronco.",
    ],
    cuidado: "Quadril e ombros parados.",
    alternativas: ["prancha"],
  }),
  item("abdominal-rotacao", "Abdominal com rotação", "Core", "core", {
    series: 3,
    reps: "12",
    descansoS: 45,
    nivel: 2,
    comoFazer: [
      "Deitado, suba o tronco girando um cotovelo para o joelho oposto.",
      "Alterne os lados com controle.",
    ],
    cuidado: "Não puxe o pescoço com as mãos.",
    alternativas: ["dead-bug"],
  }),

  // ---------------------------------------------------------------- superiores
  item("supino", "Supino ou flexão", "Peito", "forca", {
    equipamento: ["halter", "barra", "academia"],
    series: 3,
    reps: "8 a 10",
    descansoS: 90,
    nivel: 2,
    comoFazer: [
      "Empurre o peso ou o corpo a partir do peito, cotovelos a 45 graus.",
      "Desça contando 2 s e suba firme.",
    ],
    cuidado: "Deixe 2 repetições de reserva.",
    alternativas: ["flexao"],
  }),
  item("flexao", "Flexão de braços", "Peito", "forca", {
    series: 3,
    reps: "8 a 10",
    descansoS: 75,
    nivel: 2,
    comoFazer: ["Mãos sob os ombros, corpo em linha reta.", "Desça o peito até perto do chão e suba."],
    cuidado: "Apoie os joelhos se não conseguir manter a linha.",
    alternativas: ["supino"],
  }),
  item("remada", "Remada", "Costas", "forca", {
    equipamento: ["halter", "barra", "academia", "elastico"],
    series: 3,
    reps: "8 a 10",
    descansoS: 90,
    nivel: 2,
    comoFazer: [
      "Tronco inclinado, puxe o peso até a lateral do corpo.",
      "Junte as escápulas e desça devagar.",
    ],
    cuidado: "Costas retas; deixe 2 repetições de reserva.",
    alternativas: ["puxada"],
  }),
  item("desenvolvimento", "Desenvolvimento", "Ombros", "forca", {
    equipamento: ["halter", "barra", "academia"],
    series: 3,
    reps: "8 a 10",
    descansoS: 90,
    nivel: 2,
    comoFazer: [
      "Empurre os pesos de cima dos ombros até esticar os braços.",
      "Desça devagar até a altura das orelhas.",
    ],
    cuidado: "Core firme, sem arquear a lombar.",
    alternativas: ["flexao"],
  }),
  item("puxada", "Puxada ou barra", "Costas", "forca", {
    equipamento: ["academia", "barra", "elastico"],
    series: 3,
    reps: "8",
    descansoS: 90,
    nivel: 3,
    comoFazer: ["Puxe a barra ou o elástico até a altura do queixo.", "Controle a volta, sem balançar."],
    cuidado: "Deixe 2 repetições de reserva.",
    alternativas: ["remada"],
  }),

  // ---------------------------------------------------------------- velocidade e arranque
  item("vel-aquecimento", "Aquecimento de velocidade", "Velocidade", "velocidade", {
    series: 1,
    reps: "15 min",
    tempoS: 900,
    descansoS: 0,
    comoFazer: [
      "Mobilidade, corrida leve e skipping.",
      "Termine com 2 a 3 progressivas até quase a velocidade máxima.",
    ],
    cuidado: "Não pule o aquecimento.",
    alternativas: [],
  }),
  item("skipping", "Skipping técnico", "Velocidade", "velocidade", {
    equipamento: ["campo"],
    series: 3,
    reps: "15 m",
    descansoS: 45,
    impacto: "medio",
    comoFazer: [
      "Eleve o joelho e apoie na ponta do pé, com cadência rápida.",
      "Braços em oposição, tronco alto.",
    ],
    cuidado: LEVE,
    alternativas: [],
  }),
  item("vel-arrancadas", "Arrancadas de 10 a 20 m", "Velocidade", "velocidade", {
    equipamento: ["campo"],
    series: 6,
    reps: "10 a 20 m",
    descansoS: 120,
    nivel: 3,
    impacto: "alto",
    contraindicacoes: ["dor lateral >= 4", "posterior apertou", "semáforo diferente de verde"],
    comoFazer: [
      "Varie a saída: parado, de costas, depois de girar ou de deslocamento lateral.",
      "Acelere nos primeiros passos, tronco inclinado.",
    ],
    cuidado: "Pare se a dor passar de 3 em 10 ou se o posterior apertar.",
    alternativas: ["aceleracao-3-pontos"],
  }),
  item("aceleracao-3-pontos", "Aceleração em 3 pontos", "Velocidade", "velocidade", {
    equipamento: ["campo", "cones"],
    series: 4,
    reps: "10 m",
    descansoS: 90,
    nivel: 3,
    impacto: "alto",
    comoFazer: ["Três cones em linha, acelere do primeiro ao último.", "Aumente a velocidade a cada cone."],
    cuidado: "Comece a 80% da velocidade.",
    alternativas: ["vel-arrancadas"],
  }),
  item("vel-fechamento", "Arrancadas com finalização", "Velocidade", "velocidade", {
    equipamento: ["campo"],
    series: 3,
    reps: "1 arrancada + finalização",
    descansoS: 120,
    nivel: 4,
    impacto: "alto",
    contraindicacoes: ["dor lateral >= 4", "posterior apertou"],
    comoFazer: [
      "Arrancada de 10 a 15 m seguida de finalização em condição de jogo.",
      "Chute com o tornozelo firme, sem forçar o gesto.",
    ],
    cuidado: "Se doer ao chutar, pare e avise no check-in.",
    alternativas: ["vel-arrancadas"],
  }),

  // ---------------------------------------------------------------- potência (fase 3+, tornozelo verde)
  item("salto-vertical", "Salto vertical", "Potência", "potencia", {
    series: 3,
    reps: "5",
    descansoS: 90,
    faseMinima: 3,
    nivel: 4,
    impacto: "alto",
    contraindicacoes: ["semáforo diferente de verde"],
    comoFazer: [
      "Agache rápido e salte o mais alto que puder, braços ajudando.",
      "Aterrisse macio nos dois pés.",
    ],
    cuidado: LEVE,
    alternativas: ["salto-bipodal-aterrissagem"],
  }),
  item("salto-horizontal", "Salto horizontal", "Potência", "potencia", {
    series: 3,
    reps: "5",
    descansoS: 90,
    faseMinima: 3,
    nivel: 4,
    impacto: "alto",
    contraindicacoes: ["semáforo diferente de verde"],
    comoFazer: [
      "Salte para frente o mais longe possível e firme a aterrissagem.",
      "Marque a distância e tente repetir.",
    ],
    cuidado: LEVE,
    alternativas: ["salto-bipodal-aterrissagem"],
  }),
  item("box-jump-baixo", "Box jump baixo", "Potência", "potencia", {
    equipamento: ["degrau"],
    series: 3,
    reps: "5",
    descansoS: 90,
    faseMinima: 3,
    nivel: 4,
    impacto: "alto",
    contraindicacoes: ["semáforo diferente de verde"],
    comoFazer: [
      "Salte em uma caixa baixa (20 a 30 cm) e aterrisse em cima.",
      "Desça andando, sem saltar para baixo.",
    ],
    cuidado: LEVE,
    alternativas: ["salto-vertical"],
  }),
  item("arremesso-medicinal", "Arremesso de bola medicinal", "Potência", "potencia", {
    equipamento: ["halter"],
    series: 3,
    reps: "6",
    descansoS: 75,
    nivel: 3,
    comoFazer: ["Arremesse a bola contra a parede com o corpo todo.", "Pegue de volta e repita."],
    cuidado: "Pés firmes no chão.",
    alternativas: ["flexao"],
  }),

  // ---------------------------------------------------------------- bola (centroavante)
  item("conducao-slalom", "Condução em slalom", "Bola", "bola", {
    equipamento: ["campo", "cones"],
    series: 4,
    reps: "1 volta",
    descansoS: 45,
    impacto: "medio",
    comoFazer: [
      "Conduza a bola entre cones, com toques curtos dos dois pés.",
      "Cabeça erguida, olhando para frente.",
    ],
    cuidado: LEVE,
    alternativas: ["controle-orientado"],
  }),
  item("controle-orientado", "Controle orientado", "Bola", "bola", {
    equipamento: ["campo"],
    series: 3,
    reps: "8",
    descansoS: 45,
    comoFazer: ["Receba a bola e já tire o primeiro toque para o lado livre.", "Olhe antes de receber."],
    cuidado: LEVE,
    alternativas: ["tabela-parede"],
  }),
  item("giro-costas", "Giro de costas para o zagueiro", "Bola", "bola", {
    equipamento: ["campo"],
    series: 3,
    reps: "6",
    descansoS: 60,
    impacto: "medio",
    comoFazer: [
      "Receba de costas, proteja com o corpo e gire para o lado livre.",
      "Primeiro toque já na direção da finalização.",
    ],
    cuidado: LEVE,
    alternativas: ["protecao-bola"],
  }),
  item("protecao-bola", "Proteção de bola", "Bola", "bola", {
    equipamento: ["campo"],
    series: 3,
    reps: "30 s",
    tempoS: 30,
    descansoS: 45,
    comoFazer: [
      "Mantenha a bola protegida com o corpo contra um colega.",
      "Apoios firmes e braço de fora aberto.",
    ],
    cuidado: "Sem tranco forte nas primeiras semanas.",
    alternativas: ["controle-orientado"],
  }),
  item("tabela-parede", "Tabela na parede", "Bola", "bola", {
    equipamento: ["campo"],
    series: 3,
    reps: "20",
    descansoS: 45,
    comoFazer: ["Passe de primeira contra a parede e receba de volta.", "Alterne o pé de passe."],
    cuidado: "Aumente a força dos chutes aos poucos.",
    alternativas: ["controle-orientado"],
  }),
  item("finalizacao-primeira", "Finalização de primeira", "Bola", "bola", {
    equipamento: ["campo"],
    series: 3,
    reps: "6",
    descansoS: 60,
    faseMinima: 2,
    impacto: "medio",
    contraindicacoes: ["dor ao chutar"],
    comoFazer: [
      "Bola rolando de lado: chute de primeira no gol.",
      "Depois de giro e com o pé não dominante, aos poucos.",
    ],
    cuidado: "Se o tornozelo doer ao chutar, pare e registre no check-in.",
    alternativas: ["tabela-parede"],
  }),

  // ---------------------------------------------------------------- visão de jogo
  item("scan", "Scan antes de receber", "Visão de jogo", "visao", {
    equipamento: ["campo"],
    series: 3,
    reps: "10 recepções",
    descansoS: 30,
    comoFazer: ["Antes de cada recepção, olhe por cima dos dois ombros.", "Conte quantas vezes você olhou."],
    cuidado: "Olhar rápido e sem perder a bola.",
    alternativas: ["estudo-sem-bola"],
  }),
  item("estudo-sem-bola", "Estudo de movimento sem bola", "Visão de jogo", "visao", {
    series: 1,
    reps: "10 min",
    tempoS: 600,
    descansoS: 0,
    comoFazer: [
      "Assista a gols de centroavantes olhando só o movimento sem bola.",
      "Anote 2 movimentos que você pode copiar.",
    ],
    cuidado: "Sem celular durante o treino de campo.",
    alternativas: [],
  }),
  item("anotacao-pos-jogo", "Anotação pós-jogo", "Visão de jogo", "visao", {
    series: 1,
    reps: "5 min",
    tempoS: 300,
    descansoS: 0,
    comoFazer: ["Anote 2 decisões boas e 2 que poderiam melhorar.", "Releia antes do próximo jogo."],
    cuidado: "Curto e honesto.",
    alternativas: [],
  }),

  // ---------------------------------------------------------------- mobilidade geral
  item("mob-quadril", "Mobilidade de quadril (90/90)", "Mobilidade", "mobilidade", {
    series: 2,
    reps: "10",
    descansoS: 20,
    comoFazer: [
      "Sentado com as duas pernas a 90 graus, gire o quadril de um lado para o outro.",
      "Mantenha o tronco alto.",
    ],
    cuidado: "Movimento suave, sem dor.",
    alternativas: [],
  }),
  item("mob-posterior", "Mobilidade dinâmica de posteriores e panturrilha", "Mobilidade", "mobilidade", {
    series: 2,
    reps: "10",
    descansoS: 20,
    comoFazer: [
      "Leve a perna esticada à frente e toque a ponta do pé com a mão oposta.",
      "Alterne as pernas andando.",
    ],
    cuidado: "Só até esticar, sem dor.",
    alternativas: [],
  }),
];

export const CATALOGO_POR_ID: Record<string, ItemCatalogo> = Object.fromEntries(
  CATALOGO.map((c) => [c.id, c]),
);

/** Equipamentos que indicam "precisa de academia ou peso". */
const PRECISA_ACADEMIA: Equipamento[] = ["halter", "barra", "academia", "anilha"];

export const exigeAcademia = (c: ItemCatalogo) =>
  c.equipamento.every((e) => PRECISA_ACADEMIA.includes(e)) &&
  c.equipamento.length > 0 &&
  !c.equipamento.includes("nenhum");

/** Usa carga externa em kg (halter, barra, academia, anilha). */
export const usaCargaExterna = (c: ItemCatalogo) => c.equipamento.some((e) => PRECISA_ACADEMIA.includes(e));
