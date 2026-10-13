// Cálculos sobre os dados salvos (métricas da Hoje e da Evolução).
import { addDias } from "./tempo";
import { SONO_HORAS, type Checkin, type Sessao } from "./tipos";

const conta = (r: Sessao) => r.resultado === "feito" || r.resultado === "parcial";

export function media(valores: number[]): number | null {
  if (!valores.length) return null;
  return valores.reduce((s, v) => s + v, 0) / valores.length;
}

export function checkinDoDia(checkins: Checkin[], data: string) {
  return checkins.find((c) => c.data === data) ?? null;
}

/** Check-in mais recente até `hoje`. */
export function ultimoCheckin(checkins: Checkin[], hoje: string) {
  return [...checkins].filter((c) => c.data <= hoje).sort((a, b) => b.data.localeCompare(a.data))[0] ?? null;
}

/** Compara a dor do último check-in com a do anterior. */
export function tendenciaDor(checkins: Checkin[], hoje: string): "sobe" | "desce" | "estavel" | null {
  const lista = [...checkins].filter((c) => c.data <= hoje).sort((a, b) => b.data.localeCompare(a.data));
  if (lista.length < 2) return null;
  const d = lista[0].dor - lista[1].dor;
  return d > 0 ? "sobe" : d < 0 ? "desce" : "estavel";
}

export function sessaoDoBloco(sessoes: Sessao[], data: string, bloco: string) {
  return sessoes.find((s) => s.data === data && s.bloco === bloco) ?? null;
}

/** Sessões feitas ou parciais entre duas datas (inclusive). */
export function sessoesNoPeriodo(sessoes: Sessao[], de: string, ate: string) {
  return sessoes.filter((s) => s.data >= de && s.data <= ate && conta(s));
}

/** Carga = média do esforço (0-10) das sessões feitas/parciais dos últimos 7 dias. */
export function cargaSemanal(sessoes: Sessao[], hoje: string) {
  const lista = sessoesNoPeriodo(sessoes, addDias(hoje, -6), hoje);
  return media(lista.flatMap((s) => (s.esforco === null ? [] : [s.esforco])));
}

export function esforcoMedio(sessoes: Sessao[], de: string, ate: string) {
  return media(sessoesNoPeriodo(sessoes, de, ate).flatMap((s) => (s.esforco === null ? [] : [s.esforco])));
}

/** Sono médio em horas (valores médios das faixas) entre duas datas. */
export function sonoMedio(checkins: Checkin[], de: string, ate: string) {
  return media(
    checkins.filter((c) => c.data >= de && c.data <= ate && c.sonoFaixa).map((c) => SONO_HORAS[c.sonoFaixa!]),
  );
}

export function dorMedia(checkins: Checkin[], de: string, ate: string) {
  return media(checkins.filter((c) => c.data >= de && c.data <= ate).map((c) => c.dor));
}
