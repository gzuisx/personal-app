// Geometria da cena da demonstração (sem React): esqueleto no instante t, músculos destacados e o enquadramento.
import type { RegiaoCorpo } from "../seed/catalogo-detalhes";
import {
  SEG,
  calcularEsqueleto,
  duracaoDoCiclo,
  poseNoInstante,
  type Esqueleto,
  type Junta,
  type Ponto,
  type Pose,
} from "./esqueleto";
import type { Demo, Prop } from "./tipos";

/** Toda demonstração dura 30 segundos (decisão do Gabriel), repetindo o movimento completo. */
export const DURACAO_DEMO_S = 30;

type Face = "frente" | "tras" | "centro";
type Trecho = {
  seg: "tronco" | "coxa" | "canela" | "pe" | "braco" | "antebraco";
  de: number;
  ate: number;
  face: Face;
};

/** Onde cada região aparece no boneco. */
export const MAPA_REGIOES: Record<
  RegiaoCorpo,
  { trechos: Trecho[]; juntas: ("quadril" | "ombro" | "tornozelo")[] }
> = {
  Tornozelo: { trechos: [{ seg: "pe", de: 0, ate: 0.6, face: "centro" }], juntas: ["tornozelo"] },
  Fibulares: { trechos: [{ seg: "canela", de: 0.15, ate: 0.95, face: "centro" }], juntas: ["tornozelo"] },
  Panturrilha: { trechos: [{ seg: "canela", de: 0.08, ate: 0.6, face: "tras" }], juntas: [] },
  "Posterior de coxa": { trechos: [{ seg: "coxa", de: 0.12, ate: 0.92, face: "tras" }], juntas: [] },
  Quadríceps: { trechos: [{ seg: "coxa", de: 0.12, ate: 0.92, face: "frente" }], juntas: [] },
  Glúteo: { trechos: [{ seg: "coxa", de: 0, ate: 0.22, face: "tras" }], juntas: ["quadril"] },
  Adutores: { trechos: [{ seg: "coxa", de: 0.1, ate: 0.7, face: "centro" }], juntas: [] },
  Quadril: { trechos: [], juntas: ["quadril"] },
  Core: { trechos: [{ seg: "tronco", de: 0.08, ate: 0.6, face: "frente" }], juntas: [] },
  Oblíquos: { trechos: [{ seg: "tronco", de: 0.1, ate: 0.6, face: "centro" }], juntas: [] },
  Lombar: { trechos: [{ seg: "tronco", de: 0.05, ate: 0.45, face: "tras" }], juntas: [] },
  Peito: { trechos: [{ seg: "tronco", de: 0.6, ate: 0.92, face: "frente" }], juntas: [] },
  Costas: { trechos: [{ seg: "tronco", de: 0.45, ate: 0.95, face: "tras" }], juntas: [] },
  Ombros: { trechos: [{ seg: "braco", de: 0, ate: 0.35, face: "centro" }], juntas: ["ombro"] },
  Tríceps: { trechos: [{ seg: "braco", de: 0.2, ate: 0.95, face: "tras" }], juntas: [] },
  Bíceps: { trechos: [{ seg: "braco", de: 0.2, ate: 0.95, face: "frente" }], juntas: [] },
  Coordenação: { trechos: [], juntas: [] },
};

const PONTAS: Record<Trecho["seg"], [string, string]> = {
  tronco: ["quadril", "pescoco"],
  coxa: ["quadril", "joelho"],
  canela: ["joelho", "tornozelo"],
  pe: ["tornozelo", "ponta"],
  braco: ["ombro", "cotovelo"],
  antebraco: ["cotovelo", "punho"],
};

export type Brilho = { de: Ponto; para: Ponto; largura: number };
export type Ponto2 = Ponto;

const junta = (e: Esqueleto, nome: string, lado: "D" | "E" | ""): Ponto => {
  if (nome === "quadril" && lado) return e[`quadril${lado}` as Junta];
  if (nome === "quadril" || nome === "pescoco") return e[nome as Junta];
  return e[`${nome}${lado}` as Junta];
};

/** Trechos de músculo que brilham, já deslocados para a face certa (vista de lado). */
export function brilhos(e: Esqueleto, demo: Pick<Demo, "destaque" | "lado" | "vista">): Brilho[] {
  const lados: ("D" | "E")[] = demo.lado === "D" ? ["D"] : demo.lado === "E" ? ["E"] : ["D", "E"];
  const out: Brilho[] = [];
  for (const r of demo.destaque) {
    for (const t of MAPA_REGIOES[r].trechos) {
      const seLados = t.seg === "tronco" ? [""] : lados;
      for (const l of seLados as ("D" | "E" | "")[]) {
        const [n1, n2] = PONTAS[t.seg];
        const a = t.seg === "tronco" ? e.quadril : junta(e, n1, l);
        const b = t.seg === "tronco" ? e.pescoco : junta(e, n2, l);
        const v = { x: b.x - a.x, y: b.y - a.y };
        const n = Math.hypot(v.x, v.y) || 1;
        // frente do segmento: girar 90° anti-horário (membros) ou horário (tronco); de frente, sem desvio
        const giro = t.seg === "tronco" ? -1 : 1;
        const normal = { x: (-v.y / n) * giro, y: (v.x / n) * giro };
        const k = demo.vista === "lado" ? (t.face === "frente" ? 3.2 : t.face === "tras" ? -3.2 : 0) : 0;
        const larg = t.seg === "tronco" ? (demo.vista === "frente" ? 22 : 9) : t.seg === "coxa" ? 8 : 6;
        out.push({
          de: { x: a.x + v.x * t.de + normal.x * k, y: a.y + v.y * t.de + normal.y * k },
          para: { x: a.x + v.x * t.ate + normal.x * k, y: a.y + v.y * t.ate + normal.y * k },
          largura: larg,
        });
      }
    }
  }
  return out;
}

/** Juntas que brilham (quadril, ombros, tornozelo) para as regiões destacadas. */
export function juntasEmBrilho(e: Esqueleto, demo: Pick<Demo, "destaque" | "lado">): Ponto[] {
  const lados: ("D" | "E")[] = demo.lado === "D" ? ["D"] : demo.lado === "E" ? ["E"] : ["D", "E"];
  const pts: Ponto[] = [];
  for (const r of demo.destaque) {
    for (const j of MAPA_REGIOES[r].juntas) {
      for (const l of lados) pts.push(e[`${j}${l}` as Junta]);
    }
  }
  return pts;
}

export type Quadro = { pose: Pose; esqueleto: Esqueleto; esforco: number; bola: Ponto | null };

export function quadroNoInstante(demo: Demo, t: number): Quadro {
  const pose = poseNoInstante(demo.poses, t);
  const esqueleto = calcularEsqueleto(pose, demo.vista);
  return {
    pose,
    esqueleto,
    esforco: pose.esforco ?? 0,
    bola: pose.bola ? { x: pose.bola[0], y: pose.bola[1] } : null,
  };
}

export type Caixa = { x: number; y: number; w: number; h: number };

function pontosDosProps(props: Prop[] | undefined, e: Esqueleto): Ponto[] {
  const pts: Ponto[] = [];
  for (const p of props ?? []) {
    if (p.tipo === "caixa") pts.push({ x: p.x, y: p.y }, { x: p.x + p.w, y: p.y + p.h });
    else if (p.tipo === "parede") pts.push({ x: p.x, y: 0 }, { x: p.x, y: 120 });
    else if (p.tipo === "cabo")
      pts.push(e[p.de], typeof p.para === "string" ? e[p.para] : { x: p.para[0], y: p.para[1] });
    else if (p.tipo === "cone") pts.push({ x: p.x - 5, y: 0 }, { x: p.x + 5, y: 12 });
    else if (p.tipo === "bola" && p.pos) pts.push({ x: p.pos[0], y: p.pos[1] });
  }
  return pts;
}

/** Enquadramento fixo da demonstração inteira (amostra o ciclo), com o chão sempre visível. */
export function enquadramento(demo: Demo, folga = 14): Caixa {
  const ciclo = duracaoDoCiclo(demo.poses);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = 0;
  let maxY = -Infinity;
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const q = quadroNoInstante(demo, (ciclo * i) / n);
    const pts: Ponto[] = [
      ...Object.values(q.esqueleto),
      ...pontosDosProps(demo.props, q.esqueleto),
      ...(q.bola ? [q.bola] : []),
    ];
    const c = q.esqueleto.centroCabeca;
    pts.push(
      { x: c.x - SEG.raioCabeca, y: c.y + SEG.raioCabeca },
      { x: c.x + SEG.raioCabeca, y: c.y - SEG.raioCabeca },
    );
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
  }
  let x = minX - folga;
  let w = maxX - minX + folga * 2;
  let y = minY - 6;
  let h = maxY - minY + folga + 6;
  // proporção 4:3 (a área do vídeo), centralizando
  const alvo = 4 / 3;
  if (w / h < alvo) {
    const nw = h * alvo;
    x -= (nw - w) / 2;
    w = nw;
  } else {
    const nh = w / alvo;
    y -= (nh - h) / 2;
    if (y > minY - 6) y = minY - 6;
    h = nh;
  }
  return { x, y, w, h };
}

/**
 * Para fechar 30 s certinhos com repetições inteiras, o ritmo é ajustado de leve:
 * devolve o número de repetições e o instante do ciclo para um instante real.
 */
export function ritmo(demo: Demo) {
  const ciclo = duracaoDoCiclo(demo.poses);
  const reps = Math.max(1, Math.round(DURACAO_DEMO_S / ciclo));
  const escala = DURACAO_DEMO_S / (reps * ciclo);
  return {
    ciclo,
    reps,
    escala,
    instanteDoCiclo: (tReal: number) => Math.min(tReal, DURACAO_DEMO_S) / escala,
    repeticaoAtual: (tReal: number) =>
      Math.min(reps, Math.floor(Math.min(tReal, DURACAO_DEMO_S - 1e-6) / escala / ciclo) + 1),
  };
}
