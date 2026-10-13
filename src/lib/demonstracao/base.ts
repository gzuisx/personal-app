// Peças para montar as poses-chave: pés no chão, braços soltos e poses de partida.
import type { Membro, MembroAlvo, MembroAngulos, Pose } from "./esqueleto";

/** Altura do tornozelo com o pé apoiado e ângulo do pé apoiado (a ponta toca o chão). */
export const TORN = 5;
export const PE_PLANO = 70.5;
/** De frente o pé aparece curto, apontando um pouco para fora. */
export const PE_FRENTE = 44;

/** Tornozelo num ponto, pé com o ângulo dado (padrão: apoiado no chão). */
export const pe = (x: number, y = TORN, ext = PE_PLANO): MembroAlvo => ({ alvo: [x, y], ext });
/** Ponta do pé num ponto (útil no degrau): calcula onde fica o tornozelo. */
export function pePelaPonta(x: number, y: number, ext: number, comprimento = 15): MembroAlvo {
  const r = (ext * Math.PI) / 180;
  return { alvo: [x - Math.sin(r) * comprimento, y + Math.cos(r) * comprimento], ext };
}
/** Punho num ponto. */
export const mao = (x: number, y: number, ext = 0): MembroAlvo => ({ alvo: [x, y], ext });
export const ang = (a: number, b: number, c: number): MembroAngulos => ({ ang: [a, b, c] });

/** Braços soltos ao lado do corpo (vista de lado). */
export const BRACO_SOLTO_D = ang(6, 12, 10);
export const BRACO_SOLTO_E = ang(-6, 4, 2);
/** Braços soltos (vista de frente: ângulo positivo = para fora). */
export const BRACO_FRENTE = ang(9, 5, 2);

export const EM_PE_LADO: Pose = {
  quadril: [0, 89],
  tronco: 180,
  pernaD: pe(3),
  pernaE: pe(-3),
  bracoD: BRACO_SOLTO_D,
  bracoE: BRACO_SOLTO_E,
};

export const EM_PE_FRENTE: Pose = {
  quadril: [0, 89],
  tronco: 180,
  pernaD: pe(-12, TORN, PE_FRENTE),
  pernaE: pe(12, TORN, PE_FRENTE),
  bracoD: BRACO_FRENTE,
  bracoE: BRACO_FRENTE,
};

/** Monta uma pose a partir de outra, trocando só o que mudou. */
export const de = (base: Pose, mudancas: Partial<Pose>): Pose => ({ ...base, ...mudancas });

/** Espelha uma pose de frente (troca direita e esquerda), para exercícios alternados. */
export function espelharFrente(p: Pose): Pose {
  const inv = (m: Membro): Membro => ("alvo" in m ? { alvo: [-m.alvo[0], m.alvo[1]], ext: m.ext } : m);
  return {
    ...p,
    quadril: [-p.quadril[0], p.quadril[1]],
    tronco: 360 - p.tronco,
    cabeca: p.cabeca === undefined ? undefined : 360 - p.cabeca,
    olhar: p.olhar === undefined ? undefined : -p.olhar,
    pernaD: inv(p.pernaE),
    pernaE: inv(p.pernaD),
    bracoD: inv(p.bracoE),
    bracoE: inv(p.bracoD),
  };
}

/**
 * Corrida no lugar (como numa esteira), vista de lado: 4 poses que formam uma passada completa.
 * `k` vai de 0,4 (trote) a 1 (arrancada).
 */
export function corrida(k: number, opcoes: { tronco?: number; ate?: number; altura?: number } = {}): Pose[] {
  const tronco = opcoes.tronco ?? 180 - 8 * k;
  const h = opcoes.altura ?? 86;
  const ate = opcoes.ate ?? 0.32 - 0.12 * k;
  const frente = (lado: "D" | "E"): Partial<Pose> => {
    const vai: Membro = { alvo: [16 + 16 * k, 30 + 22 * k], ext: 85 };
    // pé de trás empurrando o chão (a ponta toca o chão)
    const volta: Membro = { alvo: [-22 - 14 * k, 13], ext: 30 };
    const bFrente = ang(35 + 25 * k, 110 + 20 * k, 120);
    const bTras = ang(-30 - 20 * k, 30, 20);
    return lado === "D"
      ? { pernaD: vai, pernaE: volta, bracoD: bTras, bracoE: bFrente }
      : { pernaD: volta, pernaE: vai, bracoD: bFrente, bracoE: bTras };
  };
  const meio = (apoio: "D" | "E"): Partial<Pose> => {
    const chao: Membro = { alvo: [5, TORN], ext: PE_PLANO };
    const sobe: Membro = { alvo: [-14 - 6 * k, 34 + 18 * k], ext: 20 };
    const b0 = ang(5, 60, 70);
    return apoio === "D"
      ? { pernaD: chao, pernaE: sobe, bracoD: b0, bracoE: b0 }
      : { pernaD: sobe, pernaE: chao, bracoD: b0, bracoE: b0 };
  };
  const p = (resto: Partial<Pose>, alt: number, esforco: number): Pose => ({
    quadril: [0, alt],
    tronco,
    pernaD: pe(0),
    pernaE: pe(0),
    bracoD: BRACO_SOLTO_D,
    bracoE: BRACO_SOLTO_E,
    ...resto,
    esforco,
    ate,
  });
  return [
    p(frente("D"), h + 2, 1),
    p(meio("D"), h - 2, 0.6),
    p(frente("E"), h + 2, 1),
    p(meio("E"), h - 2, 0.6),
  ];
}

/** Dois passos curtos para voltar ao ponto de partida (andando para trás), vista de lado. */
export function voltarAndando(x: number, final: Pose): Pose[] {
  const m = x / 2;
  return [
    {
      ...final,
      quadril: [x - 4, 88],
      pernaD: pe(x - 14, 18, 60),
      pernaE: pe(x - 2),
      esforco: 0.1,
      ate: 0.45,
    },
    { ...final, quadril: [m, 88], pernaD: pe(m - 6), pernaE: pe(m + 4), esforco: 0.1, ate: 0.45 },
    {
      ...final,
      quadril: [m / 2, 88],
      pernaD: pe(m / 2 + 2),
      pernaE: pe(m / 2 - 10, 18, 60),
      esforco: 0.1,
      ate: 0.45,
    },
  ];
}
