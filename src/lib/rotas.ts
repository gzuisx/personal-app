/** Endereços do app em um lugar só (anéis, cartões e botões usam estas funções). */

type BlocoRota = { id: string; exercicios: unknown[] };

/**
 * Onde "Iniciar treino" leva para um bloco: o treino guiado quando há exercícios,
 * ou o detalhe do dia quando o bloco é uma sessão do instrutor (sem exercícios no app).
 */
export const hrefDoBloco = (iso: string, bloco: BlocoRota) =>
  bloco.exercicios.length > 0 ? `/treino/${bloco.id}?data=${iso}` : `/semana/${iso}#${bloco.id}`;

/** Sequência do dia: os blocos pendentes do mesmo período, encadeados. */
export const hrefSequencia = (iso: string, primeiroBlocoId: string) =>
  `/treino/${primeiroBlocoId}?data=${iso}&sequencia=1`;

export const hrefDoDia = (iso: string) => `/semana/${iso}`;
export const hrefDoJogo = (data: string) => `/jogo/${data}`;
