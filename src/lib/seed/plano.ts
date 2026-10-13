// Plano de treino (dados de seed). Fonte: seção 12 da ESPECIFICACAO-APP.txt.
// Sem importações com alias: o script scripts/gerar-seed-sql.ts também lê este arquivo.
import { DIAS_SEMANA, JOGOS_SEMANAIS, diaSemanaISO, type JogoSlot } from "../tempo";
import { faseDoPlano, intensidadeVelocidade } from "./fase";

export type Tag =
  "Tornozelo" | "Força" | "Velocidade" | "Funcional" | "Jogo" | "Recuperação" | "Folga" | "Mobilidade";

export type TipoExercicio = "tornozelo" | "forca" | "velocidade" | "mobilidade" | "funcional";

export type ExercicioBase = {
  slug: string;
  nome: string;
  grupo: string;
  tipo: TipoExercicio;
  observacoes?: string;
  mediaUrl: string | null;
};

export type ExercicioNoBloco = ExercicioBase & {
  series?: string;
  repeticoes: string;
  /** observação específica deste uso (vale mais que a do exercício) */
  observacao?: string;
};

export type Periodo = "manha" | "tarde" | "noite" | "jogo" | "dia";

export const ROTULO_PERIODO: Record<Periodo, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  jogo: "Jogo",
  dia: "Dia",
};

export type Bloco = {
  /** estável: usado para gravar a sessão (ex.: "qua-manha") */
  id: string;
  periodo: Periodo;
  titulo: string;
  duracaoMin: number;
  horario?: string;
  tags: Tag[];
  exercicios: ExercicioNoBloco[];
  /** sessão conduzida pelo instrutor (sem lista de exercícios) */
  instrutor?: boolean;
  observacao?: string;
};

export type DiaPlano = {
  iso: string;
  diaSemana: number;
  nome: string;
  titulo: string;
  blocos: Bloco[];
  jogo: JogoSlot | null;
};

// ------------------------------------------------------------ exercícios

const ex = (
  slug: string,
  nome: string,
  grupo: string,
  tipo: TipoExercicio,
  observacoes?: string,
): ExercicioBase => ({ slug, nome, grupo, tipo, observacoes, mediaUrl: null });

export const EXERCICIOS: Record<string, ExercicioBase> = Object.fromEntries(
  [
    // tornozelo, fase 1
    ex(
      "eq-um-pe",
      "Equilíbrio em um pé só (direito)",
      "Tornozelo",
      "tornozelo",
      "Depois de dominar, repita de olhos fechados.",
    ),
    ex(
      "el-fora",
      "Elástico: pé para fora",
      "Tornozelo",
      "tornozelo",
      "Lento. O movimento para fora (fibulares) é o que mais protege contra torção.",
    ),
    ex("el-dentro", "Elástico: pé para dentro", "Tornozelo", "tornozelo", "Lento e controlado."),
    ex("el-cima", "Elástico: pé para cima", "Tornozelo", "tornozelo", "Lento e controlado."),
    ex("pant-degrau", "Panturrilha no degrau", "Tornozelo", "tornozelo", "Desça em 3 segundos."),
    ex(
      "joelho-parede",
      "Joelho na parede",
      "Tornozelo",
      "mobilidade",
      "Mobilidade do tornozelo. Mantenha o calcanhar no chão.",
    ),
    // tornozelo, fase 2
    ex(
      "pant-um-pe",
      "Panturrilha em um pé só",
      "Tornozelo",
      "tornozelo",
      "Faça com o joelho esticado e depois com o joelho dobrado.",
    ),
    ex(
      "eq-almofada",
      "Equilíbrio na almofada passando a bola",
      "Tornozelo",
      "tornozelo",
      "Passe a bola contra a parede sem perder o equilíbrio.",
    ),
    ex(
      "agach-uma-perna",
      "Agachamento em uma perna e saltinhos no lugar",
      "Tornozelo",
      "tornozelo",
      "Controle o joelho: não deixe cair para dentro.",
    ),
    // tornozelo, fase 3
    ex(
      "salto-aterrissagem",
      "Saltos e aterrissagens em um pé só",
      "Tornozelo",
      "tornozelo",
      "Aterrisse macio e estável.",
    ),
    ex(
      "salto-lateral",
      "Saltos laterais e mudanças de direção",
      "Tornozelo",
      "tornozelo",
      "Comece devagar e aumente a velocidade.",
    ),
    // mobilidade
    ex("mob-quadril", "Mobilidade de quadril (90/90)", "Mobilidade", "mobilidade"),
    ex("mob-posterior", "Mobilidade dinâmica de posteriores e panturrilha", "Mobilidade", "mobilidade"),
    // força de pernas
    ex(
      "stiff",
      "Stiff (levantamento terra romeno)",
      "Posterior de coxa",
      "forca",
      "Deixe 2 repetições de reserva.",
    ),
    ex(
      "flexora",
      "Flexora (elástico, slider ou nórdica assistida)",
      "Posterior de coxa",
      "forca",
      "Deixe 2 repetições de reserva.",
    ),
    ex("bulgaro", "Afundo búlgaro ou step-up", "Coxa", "forca", "Deixe 2 repetições de reserva."),
    ex("pant-pe-sentado", "Panturrilha em pé e sentado", "Panturrilha", "forca", "Lenta."),
    ex(
      "elev-quadril",
      "Elevação de quadril",
      "Glúteo e posterior",
      "forca",
      "Deixe 2 repetições de reserva.",
    ),
    // superiores e core
    ex("supino", "Supino ou flexão", "Peito", "forca", "Deixe 2 repetições de reserva."),
    ex("remada", "Remada", "Costas", "forca", "Deixe 2 repetições de reserva."),
    ex("desenvolvimento", "Desenvolvimento", "Ombros", "forca", "Deixe 2 repetições de reserva."),
    ex("prancha", "Prancha", "Core", "forca"),
    ex("abdominal-rotacao", "Abdominal com rotação", "Core", "forca"),
    // velocidade
    ex(
      "vel-aquecimento",
      "Aquecimento de velocidade",
      "Velocidade",
      "velocidade",
      "Mobilidade, corrida leve, skipping e 2 a 3 progressivas.",
    ),
    ex(
      "vel-arrancadas",
      "Arrancadas de 10 a 20 m",
      "Velocidade",
      "velocidade",
      "Varie a saída: parado, de costas, depois de girar e depois de deslocamento lateral.",
    ),
    ex("vel-fechamento", "Arrancadas com finalização", "Velocidade", "velocidade", "Em condição de jogo."),
  ].map((e) => [e.slug, e]),
);

const noBloco = (
  slug: string,
  repeticoes: string,
  series?: string,
  observacao?: string,
): ExercicioNoBloco => ({
  ...EXERCICIOS[slug],
  repeticoes,
  series,
  observacao,
});

// ------------------------------------------------------------ rotinas

/** Rotina de tornozelo da fase. Séries e repetições para a fase 2 e 3 são decisões nossas (a especificação não as define). */
export function rotinaTornozelo(fase: 1 | 2 | 3): ExercicioNoBloco[] {
  if (fase === 1) {
    return [
      noBloco("eq-um-pe", "30 s", "3"),
      noBloco("el-fora", "15", "3"),
      noBloco("el-dentro", "15", "3"),
      noBloco("el-cima", "15", "3"),
      noBloco("pant-degrau", "12", "3"),
      noBloco("joelho-parede", "10", "2"),
    ];
  }
  if (fase === 2) {
    return [
      noBloco("pant-um-pe", "10", "3"),
      noBloco("eq-almofada", "30 s", "3"),
      noBloco("agach-uma-perna", "10", "3"),
    ];
  }
  return [
    noBloco("salto-aterrissagem", "8", "3", "Manutenção: 2 a 3 vezes por semana."),
    noBloco("salto-lateral", "8", "3", "Manutenção: 2 a 3 vezes por semana."),
  ];
}

/** Ativação do sábado e do pré-jogo: parte de tornozelo do aquecimento. */
export function rotinaAtivacao(): ExercicioNoBloco[] {
  return [
    noBloco("el-fora", "15", "1"),
    noBloco("el-dentro", "15", "1"),
    noBloco("el-cima", "15", "1"),
    noBloco("eq-um-pe", "30 s em cada perna", "1"),
  ];
}

const mobilidade = (): ExercicioNoBloco[] => [
  noBloco("mob-quadril", "10", "2"),
  noBloco("mob-posterior", "10", "2"),
];

const superiores = (): ExercicioNoBloco[] => [
  noBloco("supino", "8 a 10", "3"),
  noBloco("remada", "8 a 10", "3"),
  noBloco("desenvolvimento", "8 a 10", "3"),
  noBloco("prancha", "30 a 45 s", "3"),
  noBloco("abdominal-rotacao", "12", "3"),
];

const pernas = (semanaPlano: number): ExercicioNoBloco[] => [
  noBloco("stiff", "8", "3"),
  noBloco(
    "flexora",
    "6 a 8",
    semanaPlano <= 2 ? "2" : "3",
    semanaPlano <= 2 ? "Semanas 1 e 2: apenas 2 séries." : undefined,
  ),
  noBloco("bulgaro", "8 por perna", "3"),
  noBloco("pant-pe-sentado", "12 a 15", "3"),
  noBloco("elev-quadril", "8 a 10", "3"),
];

const velocidade = (semanaPlano: number): ExercicioNoBloco[] => [
  noBloco("vel-aquecimento", "15 min"),
  noBloco(
    "vel-arrancadas",
    "6 a 8 arrancadas",
    undefined,
    `Pausa de 1 a 2 min. Intensidade: ${intensidadeVelocidade(semanaPlano)}.`,
  ),
  noBloco("vel-fechamento", "3 a 4 arrancadas seguidas de finalização"),
];

// ------------------------------------------------------------ plano da semana

const SIGLAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;

const NOMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;

function bloco(
  dia: number,
  periodo: Periodo,
  b: Omit<Bloco, "id" | "periodo"> & { idSufixo?: string },
): Bloco {
  const { idSufixo, ...resto } = b;
  return { id: `${SIGLAS[dia]}-${idSufixo ?? periodo}`, periodo, ...resto };
}

export function diaDoPlano(iso: string): DiaPlano {
  const dia = diaSemanaISO(iso);
  const { fase, semanaPlano } = faseDoPlano(iso);
  const tornozelo = rotinaTornozelo(fase);
  const jogo = JOGOS_SEMANAIS.find((j) => j.diaSemana === dia) ?? null;
  const base = { iso, diaSemana: dia, nome: NOMES[dia], jogo };

  switch (dia) {
    case 1:
      return {
        ...base,
        titulo: "Segunda: superiores e funcional",
        blocos: [
          bloco(1, "manha", {
            titulo: "Tornozelo + superiores e core",
            duracaoMin: 50,
            tags: ["Tornozelo", "Força"],
            exercicios: [...tornozelo, ...superiores()],
          }),
          bloco(1, "noite", {
            titulo: "Funcional leve a moderado, com bola",
            duracaoMin: 60,
            horario: "18h30",
            tags: ["Funcional"],
            exercicios: [],
            instrutor: true,
            observacao: "Sessão do instrutor, das 18h30 às 19h30. Conduza a bola sempre que puder.",
          }),
        ],
      };
    case 2:
      return {
        ...base,
        titulo: "Terça: mobilidade e jogo",
        blocos: [
          bloco(2, "manha", {
            titulo: "Tornozelo + mobilidade",
            duracaoMin: 20,
            tags: ["Tornozelo", "Mobilidade"],
            exercicios: [...tornozelo, ...mobilidade()],
          }),
          bloco(2, "jogo", {
            titulo: "Jogo",
            duracaoMin: 80,
            horario: "20h30",
            tags: ["Jogo"],
            exercicios: [],
            observacao: "Aquecimento em campo às 19h45. Use a tornozeleira nas primeiras semanas.",
          }),
        ],
      };
    case 3:
      return {
        ...base,
        titulo: "Quarta: pernas e funcional leve",
        blocos: [
          bloco(3, "manha", {
            titulo: "Tornozelo + força de pernas",
            duracaoMin: 55,
            tags: ["Tornozelo", "Força"],
            exercicios: [...tornozelo, ...pernas(semanaPlano)],
            observacao: "Se as pernas estiverem muito pesadas do jogo, faça 2 séries.",
          }),
          bloco(3, "noite", {
            titulo: "Funcional leve, com bola",
            duracaoMin: 60,
            horario: "18h30",
            tags: ["Funcional"],
            exercicios: [],
            instrutor: true,
            observacao: "Cardio contínuo e suave, com bola.",
          }),
        ],
      };
    case 4:
      return {
        ...base,
        titulo: "Quinta: velocidade e arranque",
        blocos: [
          bloco(4, "manha", {
            titulo: "Tornozelo antes do trabalho",
            duracaoMin: 15,
            tags: ["Tornozelo"],
            exercicios: tornozelo,
          }),
          bloco(4, "noite", {
            titulo: "Velocidade e arranque",
            duracaoMin: 35,
            horario: "19h",
            tags: ["Velocidade"],
            exercicios: velocidade(semanaPlano),
            observacao:
              "Se a dor do tornozelo passar de 3/10, pare a sessão e faça só a rotina do tornozelo.",
          }),
        ],
      };
    case 5:
      return {
        ...base,
        titulo: "Sexta: mobilidade e recuperação ativa",
        blocos: [
          bloco(5, "manha", {
            titulo: "Tornozelo + mobilidade",
            duracaoMin: 15,
            tags: ["Tornozelo", "Mobilidade"],
            exercicios: [...tornozelo, ...mobilidade()],
          }),
          bloco(5, "noite", {
            titulo: "Funcional: recuperação ativa",
            duracaoMin: 60,
            horario: "18h30",
            tags: ["Funcional", "Recuperação"],
            exercicios: [],
            instrutor: true,
            observacao: "Intensidade baixa. Conduza a bola sempre que puder.",
          }),
        ],
      };
    case 6:
      return {
        ...base,
        titulo: "Sábado: ativação e jogo",
        blocos: [
          bloco(6, "tarde", {
            idSufixo: "ativacao",
            titulo: "Ativação de tornozelo",
            duracaoMin: 10,
            horario: "13h",
            tags: ["Tornozelo"],
            exercicios: rotinaAtivacao(),
          }),
          bloco(6, "jogo", {
            titulo: "Jogo",
            duracaoMin: 80,
            horario: "14h30",
            tags: ["Jogo"],
            exercicios: [],
            observacao: "Aquecimento em campo às 13h45. Use a tornozeleira nas primeiras semanas.",
          }),
        ],
      };
    default:
      return {
        ...base,
        titulo: "Domingo: folga total",
        blocos: [
          bloco(0, "dia", {
            idSufixo: "folga",
            titulo: "Folga total",
            duracaoMin: 0,
            tags: ["Folga"],
            exercicios: [],
            observacao: "No máximo uma caminhada e 10 min de mobilidade.",
          }),
        ],
      };
  }
}

/** Blocos que podem ser marcados como feitos (jogo e folga não entram). */
export const blocoTreinavel = (b: Bloco) => b.periodo !== "jogo" && !b.tags.includes("Folga");

/** Treinos planejados em uma data (para a taxa de treinos feitos). */
export function treinosPlanejados(iso: string) {
  return diaDoPlano(iso).blocos.filter(blocoTreinavel).length;
}

export const NOMES_DIAS = DIAS_SEMANA;

// ------------------------------------------------------------ pré-jogo

export type FaseAquecimento = { id: string; titulo: string; instrucao: string; segundos: number };

/** Aquecimento pré-jogo guiado (seção 12.8): ~10 min. */
export const AQUECIMENTO_PRE_JOGO: FaseAquecimento[] = [
  {
    id: "elastico",
    titulo: "Elástico",
    instrucao: "Pé para fora 1x15, para dentro 1x15 e para cima 1x15. Lento.",
    segundos: 135,
  },
  { id: "equilibrio", titulo: "Equilíbrio", instrucao: "30 s em cada perna, em um pé só.", segundos: 60 },
  { id: "corrida", titulo: "Corrida leve", instrucao: "Trote leve para aquecer.", segundos: 180 },
  {
    id: "mobilidade",
    titulo: "Mobilidade dinâmica",
    instrucao: "Quadril, posteriores e tornozelos, em movimento.",
    segundos: 120,
  },
  {
    id: "progressivas",
    titulo: "Progressivas",
    instrucao: "2 a 3 progressivas até quase a velocidade máxima.",
    segundos: 120,
  },
];

export const DICAS_DO_DIA = [
  "Olhe por cima do ombro antes de receber a bola: saiba onde está o zagueiro.",
  "Não pule a refeição antes do jogo.",
  "Durma e acorde em horário fixo: recuperar é treinar.",
  "Assista a gols de centroavantes prestando atenção só ao movimento sem bola.",
  "Dor até 3 em 10 é aceitável, desde que passe em 24 h.",
  "Depois do jogo, anote duas decisões boas e duas que poderiam melhorar.",
];

export function dicaDoDia(iso: string) {
  const n = Number(iso.replaceAll("-", ""));
  return DICAS_DO_DIA[n % DICAS_DO_DIA.length];
}
