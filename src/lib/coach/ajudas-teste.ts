// Construtores usados só pelos testes do coach.
import { DADOS_VAZIOS, type Checkin, type DadosApp, type Jogo, type SerieLog, type Sessao } from "../tipos";
import { buildCoachContext } from "./contexto";
import type { CoachContext, TesteCampoResumo } from "./tipos";

export const QUARTA = "2026-10-14T09:00:00-03:00";

export const dadosBase = (extra: Partial<DadosApp> = {}): DadosApp => ({
  ...structuredClone(DADOS_VAZIOS),
  ...extra,
});

export const ck = (data: string, dor = 0, extra: Partial<Checkin> = {}): Checkin => ({
  data,
  dor,
  inchaco: false,
  falhou: false,
  energia: 5,
  sonoFaixa: "7_8",
  gatilho: null,
  observacao: null,
  ...extra,
});

export const sess = (
  data: string,
  bloco: string,
  resultado: Sessao["resultado"] = "feito",
  esforco: number | null = 6,
  duracaoMin: number | null = 30,
): Sessao => ({
  data,
  bloco,
  resultado,
  esforco,
  duracaoMin,
  notas: null,
});

export const jogo = (inicio: string, extra: Partial<Jogo> = {}): Jogo => ({
  id: `j-${inicio}`,
  inicio,
  minutosJogados: 75,
  esforco: 7,
  dor: 2,
  gatilho: null,
  notas: null,
  status: "jogado",
  ...extra,
});

export const serie = (
  data: string,
  exercicio: string,
  numero: number,
  extra: Partial<SerieLog> = {},
): SerieLog => ({
  execucaoId: `e-${data}-${exercicio}`,
  data,
  bloco: "x",
  exercicio,
  numero,
  cargaKg: null,
  reps: 8,
  duracaoS: null,
  rir: null,
  esforco: "ok",
  dorDurante: 0,
  criadoEm: `${data}T12:00:00Z`,
  ...extra,
});

export function contexto(
  agora: string,
  dados: Partial<DadosApp> = {},
  testes: TesteCampoResumo[] = [],
): CoachContext {
  return buildCoachContext(new Date(agora), dadosBase(dados), testes);
}

/** Datas consecutivas terminando em `ate`. */
export function ultimosDias(ate: string, n: number): string[] {
  const base = new Date(`${ate}T12:00:00Z`).getTime();
  return Array.from({ length: n }, (_, i) =>
    new Date(base - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10),
  );
}
