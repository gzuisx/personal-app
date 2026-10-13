import { diffDias } from "../tempo";

/** Primeira semana do plano (terça, 13/10/2026). */
export const INICIO_PLANO = "2026-10-13";
const INICIO_FASE_2 = "2026-11-03";
const INICIO_FASE_3 = "2026-12-01";

export type FaseTornozelo = {
  fase: 1 | 2 | 3;
  nome: string;
  /** semana corrente do plano, a partir de 1 */
  semanaPlano: number;
  semanaNaFase: number;
  /** total de semanas da fase (null na fase 3, sem fim fixo) */
  semanasNaFase: number | null;
  criterioAvancar: string;
};

export function faseDoPlano(iso: string): FaseTornozelo {
  const semanaPlano = Math.max(1, Math.floor(diffDias(INICIO_PLANO, iso) / 7) + 1);
  if (iso < INICIO_FASE_2) {
    return {
      fase: 1,
      nome: "Base",
      semanaPlano,
      semanaNaFase: semanaPlano,
      semanasNaFase: 3,
      criterioAvancar: "Para avançar: semáforo verde por 7 dias.",
    };
  }
  if (iso < INICIO_FASE_3) {
    return {
      fase: 2,
      nome: "Estabilidade",
      semanaPlano,
      semanaNaFase: semanaPlano - 3,
      semanasNaFase: 4,
      criterioAvancar: "Para avançar: semáforo verde por 7 dias.",
    };
  }
  return {
    fase: 3,
    nome: "Ação de jogo",
    semanaPlano,
    semanaNaFase: semanaPlano - 7,
    semanasNaFase: null,
    criterioAvancar: "Manutenção: semáforo verde por 7 dias para seguir progredindo.",
  };
}

/** Intensidade das arrancadas por semana do plano (quinta). */
export function intensidadeVelocidade(semanaPlano: number) {
  if (semanaPlano <= 2) return "80 a 85% da velocidade máxima";
  if (semanaPlano <= 6) return "90 a 95% da velocidade máxima";
  return "100% da velocidade máxima";
}
