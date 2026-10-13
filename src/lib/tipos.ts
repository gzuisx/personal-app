import { SEGURANCA_PADRAO, type ConfigSeguranca } from "./safety";

export type Gatilho = "chute" | "giro" | "terreno" | "nenhum" | "nao_sei";
export type SonoFaixa = "menos_5" | "5_6" | "7_8" | "mais_8";
export type Resultado = "feito" | "parcial" | "nao_fiz";

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
};

export type Sessao = {
  data: string;
  /** id do bloco do plano, ex.: "qua-manha" */
  bloco: string;
  resultado: Resultado;
  esforco: number | null;
  duracaoMin: number | null;
  notas: string | null;
};

export type Jogo = {
  /** instante de início do jogo (ISO, UTC) */
  inicio: string;
  minutosJogados: number | null;
  dor: number | null;
  gatilho: Gatilho | null;
  notas: string | null;
};

export type Marco = { chave: string; concluidoEm: string | null };

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

export const PERFIL_PADRAO: Perfil = {
  nome: "Gabriel",
  idade: 21,
  peso: 87,
  altura: null,
  posicao: "Atacante (centroavante)",
  focos: [...FOCOS],
  prioridade: "Tornozelo direito",
  restricoes: [
    {
      id: "tornozelo-direito",
      regiao: "Tornozelo direito",
      lado: "direito",
      tipo: "lesão",
      nivelDor: 0,
      status: "Em recuperação (torção há cerca de 3 anos)",
    },
  ],
};

export type DadosApp = {
  perfil: Perfil;
  checkins: Checkin[];
  sessoes: Sessao[];
  jogos: Jogo[];
  seguranca: ConfigSeguranca;
  marcos: Marco[];
};

export const DADOS_VAZIOS: DadosApp = {
  perfil: PERFIL_PADRAO,
  checkins: [],
  sessoes: [],
  jogos: [],
  seguranca: SEGURANCA_PADRAO,
  marcos: [],
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

export const MARCOS_DEFINICOES = [
  { chave: "30-dias-sem-dor", titulo: "30 dias sem dor acima de 3" },
  { chave: "jogo-sem-dor-chute", titulo: "Primeiro jogo sem dor depois do chute" },
  { chave: "sprint-100", titulo: "Sprint a 100% sem dor" },
] as const;
