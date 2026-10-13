// Tipos do motor do coach (seção 3). O motor é feito de funções puras: mesmos dados, mesma decisão.
import type { FocoLesao } from "../foco";
import type { ConfigSeguranca, ResultadoSeguranca } from "../safety";
import type { DiaPlano } from "../seed/plano";
import type { ResultadoSemaforo } from "../semaforo";
import type {
  Checkin,
  ExcecaoAgenda,
  FaseTornozelo,
  Jogo,
  Marco,
  Perfil,
  PreJogoLog,
  Proposta,
  SerieLog,
  Sessao,
} from "../tipos";
import type { VariacaoCarga } from "./carga";

export type ModoDia = "completo" | "reduzido" | "recuperacao" | "folga";

export const ROTULO_MODO: Record<ModoDia, string> = {
  completo: "Completo",
  reduzido: "Reduzido",
  recuperacao: "Recuperação",
  folga: "Folga",
};

/** Ordem de severidade: quanto maior, mais conservador. */
export const SEVERIDADE_MODO: Record<ModoDia, number> = {
  completo: 0,
  reduzido: 1,
  recuperacao: 2,
  folga: 3,
};

/** Resultado resumido de um teste de campo (a etapa 9 grava e mostra os testes). */
export type TesteCampoResumo = {
  tipo: "T1" | "T2" | "T3" | "T4" | "T5" | "T6";
  pe?: "direito" | "esquerdo" | null;
  /** variação do teste (ex.: "olhos_fechados"); testes só se comparam com o mesmo subtipo */
  subtipo?: string | null;
  valor: number;
  unidade: string;
  /** AAAA-MM-DD */
  data: string;
  /** no sprint, tempo menor é melhor */
  menorEhMelhor: boolean;
  falhas?: number | null;
};

export type CoachContext = {
  agora: Date;
  /** AAAA-MM-DD em São Paulo */
  hoje: string;
  diaSemana: number;
  perfil: Perfil;
  /** fase do foco de lesão ativo */
  fase: FaseTornozelo;
  /** foco de lesão ativo (null em contextos antigos de teste = tornozelo direito) */
  foco?: FocoLesao | null;
  semanaDaFase: number;
  diasVerdes: number;
  /** últimos 28 dias */
  checkins: Checkin[];
  sessoes: Sessao[];
  series: SerieLog[];
  jogos: Jogo[];
  preJogos: PreJogoLog[];
  testes: TesteCampoResumo[];
  excecoes: ExcecaoAgenda[];
  propostas: Proposta[];
  marcos: Marco[];
  plano: DiaPlano;
  config: ConfigSeguranca;
  seguranca: ResultadoSeguranca;
  semaforo: ResultadoSemaforo;
  carga: VariacaoCarga;
  horasDesdeUltimoJogo: number | null;
  horasAteProximoJogo: number | null;
  /** último jogo já registrado (com dor depois) */
  ultimoJogoRegistrado: Jogo | null;
  /** marcos da Jornada cujo critério já foi atingido (o Gabriel confirma) */
  marcosDetectados: string[];
};

export type ComponenteProntidao = {
  id: "dor" | "sono" | "energia" | "carga" | "jogo" | "sem_checkin" | "sem_dados";
  rotulo: string;
  /** pontos somados à base de 100 (zero ou negativo) */
  pontos: number;
  detalhe: string;
};

export type Prontidao = {
  /** 0 a 100. Pontuação INTERNA: serve só para escolher o modo do dia; a tela nunca mostra como "%". */
  pontuacao: number;
  componentes: ComponenteProntidao[];
  /** inchaço, falha ou dor no limite de bloqueio: teto de 40 e modo Recuperação */
  sobrescrita: { motivo: string; teto: number } | null;
  /** o check-in usado é o de hoje? */
  checkinDeHoje: boolean;
  dataDoCheckin: string | null;
};

export type SeveridadeAlerta = "info" | "aviso" | "alto";

export type Alerta = { regra: string; severidade: SeveridadeAlerta; texto: string };

export type AcaoCard = {
  id:
    | "checkin_leve"
    | "perguntar_movimento"
    | "priorizar_sono"
    | "perguntar_motivo"
    | "abrir_checkin"
    | "plano_de_retorno"
    | "foco_tornozelo"
    | "checar_sono_carga";
  regra: string;
  titulo: string;
  texto: string;
  /** chips de resposta, quando a ação pergunta algo */
  opcoes?: string[];
};

export type TipoPropostaSugerida = "progressao_carga" | "fase" | "descarga" | "plano";

export type PropostaSugerida = {
  tipo: TipoPropostaSugerida;
  regra: string;
  titulo: string;
  resumo: string;
  /** chave única para não repetir a mesma proposta */
  chave: string;
  criterios: { texto: string; ok: boolean; progresso?: string }[];
  payload: Record<string, unknown>;
};

export type Efeitos = {
  modoMax?: ModoDia;
  bloqueiaProgressao?: boolean;
  semPliometria?: boolean;
  semVelocidade?: boolean;
  semSprintMaximo?: boolean;
  ajustes?: string[];
  substituicoes?: string[];
  alertas?: Alerta[];
  acoes?: AcaoCard[];
  planoSugerido?: string;
  propostas?: PropostaSugerida[];
  reconhecimento?: string;
  marcos?: string[];
  aneisDescanso?: boolean;
  recalcularCarga?: boolean;
};

/** O que a regra mostra em "Por que?": regra aplicada, dados usados e o que mudaria a decisão. */
export type PorQue = { dados: string[]; mudaria: string };

export type RegraDisparada = {
  id: string;
  titulo: string;
  mensagem: string;
  porque: PorQue;
  efeitos: Efeitos;
};

export type Decisao = {
  modo: ModoDia;
  prontidao: Prontidao;
  componentes: ComponenteProntidao[];
  ajustesDoTreino: string[];
  substituicoes: string[];
  alertas: Alerta[];
  proximasAcoes: AcaoCard[];
  podeProgredir: boolean;
  motivoBloqueio?: string;
  sugestaoDePlano?: string;
  sugestaoDeFase?: boolean;
  propostas: PropostaSugerida[];
  regras: RegraDisparada[];
  semPliometria: boolean;
  semVelocidade: boolean;
  semSprintMaximo: boolean;
  aneisDescanso: boolean;
  /** frase curta do cartão "Decisão do dia" (sem porcentagem) */
  frase: string;
  /** o que mudaria a decisão, para o "Por que?" */
  oQueMudaria: string;
  reconhecimentos: string[];
  marcosDetectados: string[];
};
