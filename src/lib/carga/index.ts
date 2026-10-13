import { DIAS_SEMANA, JOGOS_SEMANAIS, addDias, diaSemanaISO } from "../tempo";

export type RotuloCarga = string;

/** Exceções de agenda (seção 11): jogos extras e jogos cancelados, por data (AAAA-MM-DD). */
export type ExcecoesJogo = { extras?: string[]; cancelados?: string[] };

/** Rótulos fixos por dia da semana (C3): jogos na terça e no sábado. Índice = dia da semana (0 = domingo). */
export const ROTULO_POR_DIA: RotuloCarga[] = [
  "Folga - recuperação pós-jogo", // domingo
  "24 h antes do jogo - leve", // segunda
  "Dia de jogo", // terça
  "Pós-jogo + 72 h antes do sábado - força moderada", // quarta
  "48 h antes do jogo - velocidade", // quinta
  "24 h antes do jogo - recuperação ativa", // sexta
  "Dia de jogo", // sábado
];

const DIAS_DE_JOGO = JOGOS_SEMANAIS.map((j) => j.diaSemana);

const semExcecoes = (e?: ExcecoesJogo) => !e || (!e.extras?.length && !e.cancelados?.length);

/** Dia com jogo, considerando extras e cancelamentos. */
export function temJogoNoDia(iso: string, e?: ExcecoesJogo) {
  if (e?.cancelados?.includes(iso)) return false;
  if (e?.extras?.includes(iso)) return true;
  return DIAS_DE_JOGO.includes(diaSemanaISO(iso));
}

/** Dias corridos até o próximo jogo (0 = hoje) ou desde o último (olhando para trás). */
function diasAte(iso: string, passo: 1 | -1, e?: ExcecoesJogo) {
  for (let i = passo === 1 ? 0 : 1; i <= 10; i++) {
    if (temJogoNoDia(addDias(iso, passo * i), e)) return i;
  }
  return null;
}

export function diasAteProximoJogo(iso: string, e?: ExcecoesJogo) {
  return diasAte(iso, 1, e) ?? 7;
}

/**
 * Rótulo informativo da carga do dia, por DIAS CORRIDOS em relação aos jogos (C3).
 * Sem exceções de agenda usa a tabela fixa por dia da semana; com jogo extra ou cancelado
 * recalcula pelos deslocamentos em dias. O plano fixo tem prioridade sobre o rótulo.
 */
export function rotuloCarga(iso: string, excecoes?: ExcecoesJogo): RotuloCarga {
  if (semExcecoes(excecoes)) return ROTULO_POR_DIA[diaSemanaISO(iso)];

  if (temJogoNoDia(iso, excecoes)) return "Dia de jogo";
  const desde = diasAte(iso, -1, excecoes);
  const ate = diasAte(iso, 1, excecoes);

  if (desde === 1 && ate !== null && ate <= 3) {
    const nome = DIAS_SEMANA[diaSemanaISO(addDias(iso, ate))];
    const artigo = nome === "sábado" || nome === "domingo" ? "do" : "da";
    return `Pós-jogo + ${ate * 24} h antes ${artigo} ${nome} - força moderada`;
  }
  if (desde === 1) return "Pós-jogo - recuperação";
  if (diaSemanaISO(iso) === 0) return "Folga - recuperação pós-jogo";
  if (ate === 1) return "24 h antes do jogo - recuperação ativa";
  if (ate === 2) return "48 h antes do jogo - velocidade";
  if (ate === 3) return "72 h antes do jogo - força moderada";
  return "Carga normal";
}
