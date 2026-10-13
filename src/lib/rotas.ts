/** Endereços do app em um lugar só (anéis, cartões e botões usam estas funções). */

/** Onde "Iniciar treino" leva para um bloco do dia. */
export const hrefDoBloco = (iso: string, blocoId: string) => `/semana/${iso}#${blocoId}`;

export const hrefDoDia = (iso: string) => `/semana/${iso}`;
export const hrefDoJogo = (data: string) => `/jogo/${data}`;
