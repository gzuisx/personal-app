import { JOGOS_SEMANAIS, addDias, diaSemanaISO } from "../tempo";

export type RotuloCarga =
  | "Dia de jogo"
  | "Recuperação pós-jogo"
  | "Folga"
  | "Recuperação ativa"
  | "Velocidade e potência"
  | "Pico de volume da semana"
  | "Carga normal";

const DIAS_DE_JOGO = JOGOS_SEMANAIS.map((j) => j.diaSemana);

/** Dias até o próximo jogo contando a partir de uma data (0 = hoje é dia de jogo). */
export function diasAteProximoJogo(iso: string) {
  for (let i = 0; i <= 7; i++) {
    if (DIAS_DE_JOGO.includes(diaSemanaISO(addDias(iso, i)))) return i;
  }
  return 7;
}

/**
 * Rótulo informativo da carga de um dia, relativo ao jogo mais próximo.
 * 24 h antes = recuperação ativa; 48 h = velocidade e potência; 72 h = pico de volume.
 * O plano fixo tem prioridade sobre o rótulo quando houver conflito.
 */
export function rotuloCarga(iso: string): RotuloCarga {
  const dow = diaSemanaISO(iso);
  if (DIAS_DE_JOGO.includes(dow)) return "Dia de jogo";
  if (dow === 0) return "Folga";
  if (DIAS_DE_JOGO.includes(diaSemanaISO(addDias(iso, -1)))) return "Recuperação pós-jogo";
  const dias = diasAteProximoJogo(iso);
  if (dias === 1) return "Recuperação ativa";
  if (dias === 2) return "Velocidade e potência";
  if (dias === 3) return "Pico de volume da semana";
  return "Carga normal";
}
