import { diffDias } from "../tempo";

/** Primeira semana do plano (terça, 13/10/2026). */
export const INICIO_PLANO = "2026-10-13";
const INICIO_FASE_2 = "2026-11-03";
const INICIO_FASE_3 = "2026-12-01";
const INICIO_DESCARGA_TESTES = "2026-12-22";
const INICIO_FASE_4 = "2026-12-29";

export type FaseNumero = 1 | 2 | 3 | 4;

export const NOME_FASE: Record<FaseNumero, string> = {
  1: "Base",
  2: "Estabilidade",
  3: "Ação de jogo",
  4: "Retorno total",
};

/** Semanas previstas de cada fase (a 4 não tem fim fixo). */
export const SEMANAS_DA_FASE: Record<FaseNumero, number | null> = { 1: 3, 2: 4, 3: 3, 4: null };

export type FaseTornozeloInfo = {
  fase: FaseNumero;
  nome: string;
  /** semana corrente do plano, a partir de 1 */
  semanaPlano: number;
  semanaNaFase: number;
  /** total de semanas da fase (null na fase 4, sem fim fixo) */
  semanasNaFase: number | null;
  criterioAvancar: string;
};

const semanaDoPlano = (iso: string) => Math.max(1, Math.floor(diffDias(INICIO_PLANO, iso) / 7) + 1);

const CRITERIO = "Para avançar: todos os critérios abaixo, e você aceitar a proposta.";

/**
 * Fase SUGERIDA pelo calendário (seção 8.3). Não decide a fase do plano:
 * a fase de verdade fica no banco e só muda por proposta aceita (C5).
 */
export function faseDoPlano(iso: string): FaseTornozeloInfo {
  const semanaPlano = semanaDoPlano(iso);
  let fase: FaseNumero = 1;
  let inicio = INICIO_PLANO;
  if (iso >= INICIO_FASE_4) {
    fase = 4;
    inicio = INICIO_FASE_4;
  } else if (iso >= INICIO_FASE_3) {
    fase = 3;
    inicio = INICIO_FASE_3;
  } else if (iso >= INICIO_FASE_2) {
    fase = 2;
    inicio = INICIO_FASE_2;
  }
  return {
    fase,
    nome: NOME_FASE[fase],
    semanaPlano,
    semanaNaFase: Math.floor(diffDias(inicio, iso) / 7) + 1,
    semanasNaFase: SEMANAS_DA_FASE[fase],
    criterioAvancar: CRITERIO,
  };
}

/** Fase guardada no banco, com a semana contada a partir de quando ela começou. */
export function faseGuardada(f: { fase: FaseNumero; inicio: string }, iso: string): FaseTornozeloInfo {
  return {
    fase: f.fase,
    nome: NOME_FASE[f.fase],
    semanaPlano: semanaDoPlano(iso),
    semanaNaFase: Math.max(1, Math.floor(diffDias(f.inicio, iso) / 7) + 1),
    semanasNaFase: SEMANAS_DA_FASE[f.fase],
    criterioAvancar: CRITERIO,
  };
}

/** Semana de descarga e testes de campo (22 a 28/12): o app avisa, o Gabriel decide. */
export function ehSemanaDeDescargaETestes(iso: string) {
  return iso >= INICIO_DESCARGA_TESTES && iso < INICIO_FASE_4;
}

/** Intensidade das arrancadas por semana do plano (quinta). */
export function intensidadeVelocidade(semanaPlano: number) {
  if (semanaPlano <= 2) return "80 a 85% da velocidade máxima";
  if (semanaPlano <= 6) return "90 a 95% da velocidade máxima";
  return "100% da velocidade máxima";
}
