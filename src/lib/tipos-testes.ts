// Tipos da etapa 9: testes de campo, metas e diário do centroavante.

export type TipoTeste = "T1" | "T2" | "T3" | "T4" | "T5" | "T6";
export type PeTeste = "direito" | "esquerdo";

/** Uma tentativa de um teste de campo (seção 9.1). */
export type TesteCampo = {
  id: string;
  tipo: TipoTeste;
  pe?: PeTeste | null;
  /** variação do teste (ex.: "olhos_fechados", "triplo") */
  subtipo?: string | null;
  valor: number;
  unidade: string;
  tentativa: number;
  /** AAAA-MM-DD */
  data: string;
  falhas?: number | null;
  nota?: string | null;
};

/** Meta de 2027 ligada a um teste; o valor atual vem dos testes registrados. */
export type Meta = {
  id: string;
  chave: string;
  titulo: string;
  tipoTeste: TipoTeste | null;
  subtipo?: string | null;
  pe?: PeTeste | null;
  inicial: number | null;
  alvo: number;
  unidade: string;
  menorEhMelhor: boolean;
  prazo: string | null;
};

/** Diário do centroavante (seção 9.5): um por jogo, preenchido em cerca de 20 segundos. */
export type DiarioJogo = {
  /** AAAA-MM-DD do jogo (mesma chave da rota /jogo/[id]) */
  jogoData: string;
  finalizacoes: number | null;
  gols: number | null;
  assistencias: number | null;
  arrancadas: number | null;
  /** 1 a 5 */
  olhadas: number | null;
  movimentacao: number | null;
  condicao: number | null;
  bom: string[];
  melhorar: string[];
};
