import { SEGURANCA_PADRAO, type ConfigSeguranca } from "./safety";
import { INICIO_PLANO } from "./seed/fase";
import type { EsforcoSerie, EstadoTreino } from "./treino/motor";

export type Gatilho = "chute" | "giro" | "terreno" | "nenhum" | "nao_sei";
export type SonoFaixa = "menos_5" | "5_6" | "7_8" | "mais_8";
export type Resultado = "feito" | "parcial" | "nao_fiz";

export type RegiaoDor = "lateral" | "medial" | "frente" | "atras" | "aquiles" | "dentro";
export type MovimentoDor =
  | "virar_dentro"
  | "virar_fora"
  | "flexionar_cima"
  | "esticar_ponta"
  | "chutar"
  | "apoiar"
  | "correr"
  | "saltar"
  | "nenhum";
export type DuracaoDor = "menos_1min" | "5_10min" | "dia_todo";

export type Checkin = {
  /** AAAA-MM-DD (um por dia) */
  data: string;
  dor: number;
  inchaco: boolean;
  falhou: boolean;
  energia: number | null;
  sonoFaixa: SonoFaixa | null;
  gatilho: Gatilho | null;
  observacao: string | null;
  /** onde doeu (só quando dor >= 1) */
  regioes?: RegiaoDor[];
  /** movimento que doeu */
  movimentos?: MovimentoDor[];
  duracaoDor?: DuracaoDor | null;
  /** "posterior apertou" (chip do check-in, seção 6.2) */
  posteriorApertou?: boolean | null;
  /** id do jogo, quando este é o check-in do dia seguinte (card de jogo, 24.4) */
  jogoId?: string | null;
};

export type Sessao = {
  data: string;
  /** id do bloco do plano, ex.: "qua-forca" */
  bloco: string;
  resultado: Resultado;
  esforco: number | null;
  duracaoMin: number | null;
  notas: string | null;
};

export type StatusJogo = "agendado" | "jogado" | "cancelado";

export type Jogo = {
  /** estável; gerado ao salvar (uuid) */
  id?: string;
  /** instante de início do jogo (ISO, UTC) */
  inicio: string;
  minutosJogados: number | null;
  /** esforço percebido do jogo, 0 a 10 */
  esforco?: number | null;
  /** dor depois do jogo */
  dor: number | null;
  gatilho: Gatilho | null;
  notas: string | null;
  status?: StatusJogo;
};

/** Registro do aquecimento pré-jogo (C8). Um por data de jogo. */
export type PreJogoLog = {
  /** data local do jogo, AAAA-MM-DD */
  jogoData: string;
  concluido: boolean;
  fasesConcluidas: number;
  duracaoS: number;
  tornozeleira: boolean | null;
};

/** Uma série registrada no treino guiado (set_logs). */
export type SerieLog = {
  execucaoId: string;
  /** AAAA-MM-DD */
  data: string;
  bloco: string;
  /** slug do exercício */
  exercicio: string;
  numero: number;
  cargaKg: number | null;
  reps: number | null;
  duracaoS: number | null;
  rir: number | null;
  esforco: EsforcoSerie | null;
  dorDurante: number | null;
  /** ISO */
  criadoEm: string;
};

/** Treino em andamento, guardado para retomar depois de fechar o app (execution_state). */
export type Execucao = {
  id: string;
  tipo: "bloco" | "sequencia";
  data: string;
  estado: EstadoTreino;
  atualizadoEm: string;
};

// ---------------------------------------------------------------- etapa 8: coach

export type TipoExcecao =
  | "jogo_extra"
  | "jogo_cancelado"
  | "trabalho_presencial_extra"
  | "viagem"
  | "feriado"
  | "funcional_cancelado"
  | "sem_academia"
  | "exercicio_extra"
  | "exercicio_trocado";

/** Exceção de agenda (seção 11.1) ou ajuste de exercício de um dia. */
export type ExcecaoAgenda = {
  id: string;
  /** AAAA-MM-DD */
  data: string;
  tipo: TipoExcecao;
  /** HH:MM, para jogo extra */
  hora?: string | null;
  nota?: string | null;
  /** exercicio_extra / exercicio_trocado: slug do exercício novo */
  slug?: string | null;
  /** exercicio_trocado: slug do exercício do plano que sai */
  substitui?: string | null;
  /** exercício extra ou trocado: bloco do dia onde entra */
  bloco?: string | null;
};

export const ROTULO_EXCECAO: Record<TipoExcecao, string> = {
  jogo_extra: "Jogo extra",
  jogo_cancelado: "Jogo cancelado",
  trabalho_presencial_extra: "Trabalho presencial extra",
  viagem: "Viagem",
  feriado: "Feriado",
  funcional_cancelado: "Funcional cancelado",
  sem_academia: "Dia sem academia",
  exercicio_extra: "Exercício acrescentado",
  exercicio_trocado: "Exercício trocado",
};

/** Horários da rotina (Perfil > Rotina). */
export type Rotina = {
  acordar: string;
  dormir: string;
  /** dias da semana (0 = domingo) em home office */
  homeOffice: number[];
  presencial: number[];
  saidaPresencial: string;
  funcionalInicio: string;
  funcionalFim: string;
};

export const ROTINA_PADRAO: Rotina = {
  acordar: "07:00",
  dormir: "23:00",
  homeOffice: [1, 2, 3],
  presencial: [4, 5],
  saidaPresencial: "17:00",
  funcionalInicio: "18:30",
  funcionalFim: "19:30",
};

export type TipoProposta = "progressao_carga" | "fase" | "descarga" | "plano";
export type StatusProposta = "pendente" | "aceita" | "adiada" | "recusada" | "expirada";

export type CriterioProposta = { texto: string; ok: boolean; progresso?: string };

/** Proposta do motor de regras (sem IA). Só vale depois que o Gabriel aceita. */
export type Proposta = {
  id: string;
  /** evita criar a mesma proposta duas vezes (ex.: "fase:2:2026-11-03") */
  chaveUnica: string;
  tipo: TipoProposta;
  status: StatusProposta;
  /** regra que a gerou (R06, R07, R16...) */
  regra: string;
  titulo: string;
  resumo: string;
  criterios: CriterioProposta[];
  payload: Record<string, unknown>;
  /** AAAA-MM-DD: quando adiada, só volta a aparecer depois desta data */
  adiadaAte?: string | null;
  criadaEm: string;
  decididaEm?: string | null;
};

/** Versão do plano: aceitar uma proposta cria uma versão nova; o plano base fica guardado. */
export type PlanoVersao = {
  id: string;
  chaveTemplate: string | null;
  inicio: string;
  fim: string | null;
  origem: "base" | "proposta" | "manual";
  ativo: boolean;
  conteudo: Record<string, unknown>;
};

export type RegistroAuditoria = {
  id: string;
  evento: string;
  detalhes: Record<string, unknown>;
  criadoEm: string;
};

export type { DiarioJogo, Meta, PeTeste, TesteCampo, TipoTeste } from "./tipos-testes";
import type { DiarioJogo, Meta, TesteCampo } from "./tipos-testes";

export type Marco = { chave: string; concluidoEm: string | null };

export type MarcoDef = {
  chave: string;
  titulo: string;
  criterio: string;
  /** chave da detecção automática (etapa 9); vazio = só manual */
  auto?: string;
};

export type Restricao = {
  id: string;
  regiao: string;
  lado: "direito" | "esquerdo" | "ambos" | "não se aplica";
  tipo: "lesão" | "ponto fraco";
  nivelDor: number;
  status: string;
};

export type Perfil = {
  nome: string;
  idade: number | null;
  peso: number | null;
  altura: number | null;
  posicao: string;
  focos: string[];
  prioridade: string;
  restricoes: Restricao[];
};

export type FaseNum = 1 | 2 | 3 | 4;

/** Fase do tornozelo guardada no banco. Só muda por proposta aceita (C5). */
export type FaseTornozelo = { fase: FaseNum; inicio: string };

export { INICIO_PLANO };

export const FOCOS = [
  "Tornozelo direito",
  "Velocidade",
  "Arranque",
  "Força de posterior",
  "Panturrilha",
  "Coxa",
  "Condução de bola",
  "Visão de jogo",
] as const;

export const RESTRICAO_TORNOZELO: Restricao = {
  id: "tornozelo-direito",
  regiao: "Tornozelo direito",
  lado: "direito",
  tipo: "lesão",
  nivelDor: 0,
  status: "Em recuperação (torção há cerca de 3 anos)",
};

export const PERFIL_PADRAO: Perfil = {
  nome: "Gabriel",
  idade: 21,
  peso: 87,
  altura: null,
  posicao: "Atacante (centroavante)",
  focos: [...FOCOS],
  prioridade: "Tornozelo direito",
  restricoes: [RESTRICAO_TORNOZELO],
};

export const MARCOS_DEFINICOES: MarcoDef[] = [
  {
    chave: "30-dias-sem-dor",
    titulo: "30 dias sem dor acima de 3",
    criterio: "30 dias seguidos com check-in e dor até 3, sem inchaço nem falha.",
    auto: "dias_30",
  },
  {
    chave: "jogo-completo-sem-dor",
    titulo: "Primeiro jogo completo sem dor",
    criterio: "Jogo de 70 min ou mais com dor depois de até 1.",
    auto: "jogo_completo",
  },
  {
    chave: "jogo-sem-dor-chute",
    titulo: "Primeiro jogo sem dor depois do chute",
    criterio: "Jogo em que você chutou e a dor depois ficou em 1 ou menos. Confirme você mesmo.",
  },
  {
    chave: "rotina-10-dias",
    titulo: "10 dias seguidos de rotina de tornozelo",
    criterio: "Rotina de tornozelo registrada como feita em 10 dias seguidos.",
    auto: "rotina_10",
  },
  {
    chave: "equilibrio-sem-falha",
    titulo: "Teste de equilíbrio sem falha",
    criterio: "Teste T3 com 0 falhas nos dois pés, olhos fechados.",
    auto: "teste_equilibrio",
  },
  {
    chave: "simetria-90",
    titulo: "Simetria de 90% ou mais no salto unipodal",
    criterio: "Teste T5: o pé mais fraco chega a 90% ou mais do mais forte.",
    auto: "simetria_salto",
  },
  {
    chave: "corrida-lancada",
    titulo: "Primeira corrida lançada sem queixa",
    criterio: "Corrida em velocidade máxima sem dor no tornozelo nem no posterior. Confirme você mesmo.",
  },
  {
    chave: "sprint-100",
    titulo: "Sprint a 100% sem dor",
    criterio: "Arrancadas a 100% sem dor no tornozelo. Confirme você mesmo.",
  },
];

export type DadosApp = {
  perfil: Perfil;
  checkins: Checkin[];
  sessoes: Sessao[];
  jogos: Jogo[];
  preJogos: PreJogoLog[];
  excecoes: ExcecaoAgenda[];
  rotina: Rotina;
  propostas: Proposta[];
  versoes: PlanoVersao[];
  auditoria: RegistroAuditoria[];
  testes: TesteCampo[];
  metas: Meta[];
  diarios: DiarioJogo[];
  series: SerieLog[];
  execucao: Execucao | null;
  seguranca: ConfigSeguranca;
  marcos: Marco[];
  marcosDefs: MarcoDef[];
  faseTornozelo: FaseTornozelo;
};

export const DADOS_VAZIOS: DadosApp = {
  perfil: PERFIL_PADRAO,
  checkins: [],
  sessoes: [],
  jogos: [],
  preJogos: [],
  excecoes: [],
  rotina: ROTINA_PADRAO,
  propostas: [],
  versoes: [],
  auditoria: [],
  testes: [],
  metas: [],
  diarios: [],
  series: [],
  execucao: null,
  seguranca: SEGURANCA_PADRAO,
  marcos: [],
  marcosDefs: MARCOS_DEFINICOES,
  faseTornozelo: { fase: 1, inicio: INICIO_PLANO },
};

export const SONO_ROTULO: Record<SonoFaixa, string> = {
  menos_5: "menos de 5 h",
  "5_6": "5 a 6 h",
  "7_8": "7 a 8 h",
  mais_8: "mais de 8 h",
};

/** Valor médio de cada faixa, usado só para médias e gráficos (seção 10.6). */
export const SONO_HORAS: Record<SonoFaixa, number> = {
  menos_5: 4.5,
  "5_6": 5.5,
  "7_8": 7.5,
  mais_8: 8.5,
};

export const GATILHO_ROTULO: Record<Gatilho, string> = {
  chute: "Chute",
  giro: "Giro",
  terreno: "Terreno",
  nenhum: "Nenhum",
  nao_sei: "Não sei",
};

export const REGIAO_ROTULO: Record<RegiaoDor, string> = {
  lateral: "Lateral",
  medial: "Medial",
  frente: "Frente",
  atras: "Atrás",
  aquiles: "Tendão de Aquiles",
  dentro: "Dentro da articulação",
};

export const MOVIMENTO_ROTULO: Record<MovimentoDor, string> = {
  virar_dentro: "Virar para dentro",
  virar_fora: "Virar para fora",
  flexionar_cima: "Pé para cima",
  esticar_ponta: "Esticar a ponta",
  chutar: "Chutar",
  apoiar: "Apoiar",
  correr: "Correr",
  saltar: "Saltar",
  nenhum: "Nenhum",
};

export const DURACAO_DOR_ROTULO: Record<DuracaoDor, string> = {
  menos_1min: "Passou em menos de 1 min",
  "5_10min": "5 a 10 min",
  dia_todo: "Ficou o dia todo",
};
