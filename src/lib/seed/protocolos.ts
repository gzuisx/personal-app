// Protocolos de reabilitação por região (foco de lesão). Dados de seed, sem importações com alias.
// São PONTOS DE PARTIDA: confirmar com fisioterapeuta. O do tornozelo é o plano atual, sem mudanças.

export type RegiaoFoco = "tornozelo" | "posterior_coxa" | "panturrilha";
export type LadoFoco = "direito" | "esquerdo";
export type FaseProtocoloNum = 1 | 2 | 3;

export const AVISO_PROTOCOLO = "Pontos de partida, confirmar com fisioterapeuta.";

export type ItemProtocolo = { slug: string; series: string; reps: string; observacao?: string };

/** Critério de avanço de fase (regiões além do tornozelo; o tornozelo usa coach/fase.ts). */
export type CriterioProtocolo = {
  texto: string;
  slugs: string[];
  /** sessões seguidas exigidas */
  sessoes: number;
  /** séries boas por sessão */
  minSeries: number;
  minReps?: number;
  minTempoS?: number;
};

export type RestricoesFase = {
  /** exercícios que saem do resto do plano enquanto durar a fase */
  evitar: string[];
  /** exercício do plano -> substituto mais seguro */
  substituir: Record<string, string>;
  /** teto de intensidade das arrancadas, quando houver */
  velocidade?: string;
  nota: string;
};

export type FaseProtocolo = {
  fase: FaseProtocoloNum;
  nome: string;
  objetivo: string;
  exercicios: ItemProtocolo[];
  restricoes: RestricoesFase;
  /** dias seguidos de semáforo verde para propor a próxima fase */
  diasVerdes: number;
  criterios: CriterioProtocolo[];
};

export type Protocolo = {
  regiao: RegiaoFoco;
  /** "Tornozelo", "Posterior de coxa"... */
  nome: string;
  /** frase curta do que a reabilitação busca */
  descricao: string;
  /** regiões trabalhadas que identificam o foco na biblioteca */
  regioesCatalogo: string[];
  fases: Record<FaseProtocoloNum, FaseProtocolo>;
};

const SEM_RESTRICAO: RestricoesFase = { evitar: [], substituir: {}, nota: "" };

const it = (slug: string, series: string, reps: string, observacao?: string): ItemProtocolo => ({
  slug,
  series,
  reps,
  observacao,
});

export const PROTOCOLOS: Record<RegiaoFoco, Protocolo> = {
  tornozelo: {
    regiao: "tornozelo",
    nome: "Tornozelo",
    descricao:
      "Estabilidade, força dos fibulares e controle no apoio, até voltar a saltar e mudar de direção.",
    regioesCatalogo: ["Tornozelo", "Fibulares", "Panturrilha"],
    fases: {
      1: {
        fase: 1,
        nome: "Base",
        objetivo: "Equilíbrio em um pé, elástico nas 3 direções e panturrilha no degrau.",
        exercicios: [
          it("eq-um-pe", "3", "30 s"),
          it("el-fora", "3", "15"),
          it("el-dentro", "3", "15"),
          it("el-cima", "3", "15"),
          it("pant-degrau", "3", "12"),
          it("joelho-parede", "2", "10"),
        ],
        restricoes: SEM_RESTRICAO,
        diasVerdes: 7,
        criterios: [],
      },
      2: {
        fase: 2,
        nome: "Estabilidade",
        objetivo: "Panturrilha em um pé, equilíbrio instável e agachamento unilateral.",
        exercicios: [
          it("pant-um-pe", "3", "10"),
          it("eq-almofada", "3", "30 s"),
          it("agach-uma-perna", "3", "10"),
        ],
        restricoes: SEM_RESTRICAO,
        diasVerdes: 14,
        criterios: [],
      },
      3: {
        fase: 3,
        nome: "Ação de jogo",
        objetivo: "Saltos, aterrissagens e mudanças de direção.",
        exercicios: [
          it("salto-aterrissagem", "3", "8", "Manutenção: 2 a 3 vezes por semana."),
          it("salto-lateral", "3", "8", "Manutenção: 2 a 3 vezes por semana."),
        ],
        restricoes: SEM_RESTRICAO,
        diasVerdes: 21,
        criterios: [],
      },
    },
  },

  posterior_coxa: {
    regiao: "posterior_coxa",
    nome: "Posterior de coxa",
    descricao: "Isometria sem dor, depois força em amplitude maior e, por fim, excêntrico e corrida.",
    regioesCatalogo: ["Posterior de coxa"],
    fases: {
      1: {
        fase: 1,
        nome: "Proteção",
        objetivo: "Contrair sem dor: isometrias e ponte, sem alongar forte nem correr rápido.",
        exercicios: [
          it("isometria-posterior", "4", "30 s", "Força de até 5 em 10, sem dor."),
          it("ponte-gluteo", "3", "12"),
          it("elev-quadril", "2", "10"),
        ],
        restricoes: {
          evitar: [
            "vel-arrancadas",
            "vel-fechamento",
            "aceleracao-3-pontos",
            "mob-posterior",
            "flexora",
            "nordica-assistida",
            "nordica-excentrica",
            "stiff-unilateral",
            "salto-horizontal",
            "box-jump-baixo",
          ],
          substituir: { stiff: "agachamento-goblet" },
          velocidade: "sem arrancadas nesta fase",
          nota: "Sem arrancadas, sem alongamento forte do posterior e sem flexora até a fase 2.",
        },
        diasVerdes: 7,
        criterios: [
          {
            texto: "Isometria de posterior, 3 séries de 30 s, sem dor de 4 ou mais",
            slugs: ["isometria-posterior"],
            sessoes: 3,
            minSeries: 3,
            minTempoS: 30,
          },
          {
            texto: "Ponte de glúteo, 3x12, sem dor de 4 ou mais",
            slugs: ["ponte-gluteo"],
            sessoes: 3,
            minSeries: 3,
            minReps: 12,
          },
        ],
      },
      2: {
        fase: 2,
        nome: "Força",
        objetivo: "Força em amplitude maior e corrida técnica leve.",
        exercicios: [
          it("ponte-flexao-joelho", "3", "10"),
          it("stiff", "3", "8", "Carga leve e amplitude curta, sem dor."),
          it("isometria-posterior", "3", "30 s"),
        ],
        restricoes: {
          evitar: ["vel-fechamento", "nordica-excentrica", "salto-horizontal"],
          substituir: { "vel-arrancadas": "skipping" },
          velocidade: "até 70 a 80% da velocidade máxima",
          nota: "Arrancadas trocadas por skipping técnico; flexora com carga leve.",
        },
        diasVerdes: 14,
        criterios: [
          {
            texto: "Ponte com flexão de joelho, 3x10, sem dor de 4 ou mais",
            slugs: ["ponte-flexao-joelho"],
            sessoes: 3,
            minSeries: 3,
            minReps: 10,
          },
          {
            texto: "Stiff, 3x8, sem dor de 4 ou mais",
            slugs: ["stiff"],
            sessoes: 3,
            minSeries: 3,
            minReps: 8,
          },
        ],
      },
      3: {
        fase: 3,
        nome: "Retorno à corrida",
        objetivo: "Excêntrico (nórdica assistida), trabalho unilateral e arrancadas progressivas.",
        exercicios: [
          it("nordica-assistida", "3", "5"),
          it("stiff-unilateral", "3", "8"),
          it("skipping", "3", "20 m"),
        ],
        restricoes: {
          evitar: ["nordica-excentrica"],
          substituir: {},
          velocidade: "até 90% da velocidade máxima",
          nota: "Arrancadas liberadas até 90%. Velocidade máxima só depois de confirmar com o fisioterapeuta.",
        },
        diasVerdes: 21,
        criterios: [],
      },
    },
  },

  panturrilha: {
    regiao: "panturrilha",
    nome: "Panturrilha",
    descricao: "Carga leve nos dois pés, depois um pé só com descida lenta e, por fim, saltos curtos.",
    regioesCatalogo: ["Panturrilha"],
    fases: {
      1: {
        fase: 1,
        nome: "Proteção",
        objetivo: "Panturrilha nos dois pés, sem impacto.",
        exercicios: [
          it("pant-pe-sentado", "3", "15", "Leve: dor até 3."),
          it("pant-degrau", "3", "12", "Nos dois pés, sem descer abaixo do degrau."),
          it("joelho-parede", "2", "10"),
        ],
        restricoes: {
          evitar: [
            "pogo",
            "saltinhos-lugar",
            "salto-aterrissagem",
            "salto-lateral",
            "salto-vertical",
            "salto-horizontal",
            "box-jump-baixo",
            "vel-arrancadas",
            "vel-fechamento",
            "aceleracao-3-pontos",
            "pant-um-pe-carga",
          ],
          substituir: {},
          velocidade: "sem arrancadas nesta fase",
          nota: "Sem saltos nem arrancadas até a fase 2.",
        },
        diasVerdes: 7,
        criterios: [
          {
            texto: "Panturrilha em pé e sentado, 3x15, sem dor de 4 ou mais",
            slugs: ["pant-pe-sentado"],
            sessoes: 3,
            minSeries: 3,
            minReps: 15,
          },
          {
            texto: "Panturrilha no degrau, 3x12, sem dor de 4 ou mais",
            slugs: ["pant-degrau"],
            sessoes: 3,
            minSeries: 3,
            minReps: 12,
          },
        ],
      },
      2: {
        fase: 2,
        nome: "Força",
        objetivo: "Um pé só e descida lenta.",
        exercicios: [
          it("pant-um-pe", "3", "10"),
          it("pant-descida-lenta", "3", "8"),
          it("pant-excentrica", "2", "8"),
        ],
        restricoes: {
          evitar: ["pogo", "salto-aterrissagem", "box-jump-baixo", "vel-fechamento", "salto-horizontal"],
          substituir: { "vel-arrancadas": "skipping" },
          velocidade: "até 70 a 80% da velocidade máxima",
          nota: "Arrancadas trocadas por skipping técnico; sem saltos em um pé.",
        },
        diasVerdes: 14,
        criterios: [
          {
            texto: "Panturrilha em um pé, 3x10, sem dor de 4 ou mais",
            slugs: ["pant-um-pe"],
            sessoes: 3,
            minSeries: 3,
            minReps: 10,
          },
          {
            texto: "Panturrilha com descida lenta, 3x8, sem dor de 4 ou mais",
            slugs: ["pant-descida-lenta"],
            sessoes: 3,
            minSeries: 3,
            minReps: 8,
          },
        ],
      },
      3: {
        fase: 3,
        nome: "Retorno ao impacto",
        objetivo: "Carga em um pé e saltos curtos.",
        exercicios: [
          it("pant-um-pe-carga", "3", "8"),
          it("saltinhos-lugar", "3", "20"),
          it("pogo", "3", "10"),
        ],
        restricoes: {
          evitar: [],
          substituir: {},
          velocidade: "até 90% da velocidade máxima",
          nota: "Arrancadas liberadas até 90%.",
        },
        diasVerdes: 21,
        criterios: [],
      },
    },
  },
};

export const REGIOES_FOCO: RegiaoFoco[] = ["tornozelo", "posterior_coxa", "panturrilha"];

/** Manutenção curta do tornozelo quando o foco é outra região (o tornozelo nunca sai do plano). */
export const MANUTENCAO_TORNOZELO: ItemProtocolo[] = [
  it("el-fora", "2", "15", "Manutenção do tornozelo."),
  it("eq-um-pe", "2", "30 s", "Manutenção do tornozelo."),
];

/** Fase do protocolo para uma fase do plano (a fase 4 do tornozelo repete a 3). */
export const faseDoProtocolo = (fase: number): FaseProtocoloNum =>
  (fase <= 1 ? 1 : fase === 2 ? 2 : 3) as FaseProtocoloNum;
