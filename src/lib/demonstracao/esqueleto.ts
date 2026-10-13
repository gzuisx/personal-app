// "Boneco de nós": esqueleto 2D de articulações ligadas por segmentos de comprimento constante.
// Proporções de um corpo atlético (Referencias/Boneco-base 3D em três vistas.png): cerca de 7,8 cabeças,
// ombros largos (quase 2 cabeças) e pernas longas. Unidades arbitrárias; o chão é y = 0 e y cresce para cima.
//
// Cada pose-chave diz onde está o quadril, o ângulo do tronco e, para cada membro, OU os ângulos dos três
// segmentos (cinemática direta) OU o alvo da extremidade (tornozelo/punho), resolvido por cinemática inversa
// de dois segmentos. Nos dois casos o comprimento dos segmentos nunca muda.

export type Vista = "frente" | "lado";
export type Ponto = { x: number; y: number };

/** Ângulos em graus, medidos a partir da vertical para baixo: 0 = para baixo, 90 = para a frente, 180 = para cima. */
export type MembroAngulos = { ang: [number, number, number] };
/** Alvo da extremidade (tornozelo ou punho) e ângulo do pé/mão. */
export type MembroAlvo = { alvo: [number, number]; ext: number };
export type Membro = MembroAngulos | MembroAlvo;

export type Pose = {
  /** centro do quadril */
  quadril: [number, number];
  /** direção do quadril para o pescoço (180 = em pé) */
  tronco: number;
  /** direção do pescoço para a cabeça (padrão: a do tronco) */
  cabeca?: number;
  /** na vista de frente: para onde o rosto olha (-1 esquerda da tela, 0 frente, 1 direita) */
  olhar?: number;
  pernaD: Membro;
  pernaE: Membro;
  bracoD: Membro;
  bracoE: Membro;
  /** força o lado da dobra (joelho/cotovelo) quando a regra padrão não serve: 1 ou -1 */
  dobra?: Partial<Record<"pernaD" | "pernaE" | "bracoD" | "bracoE", 1 | -1>>;
  /** 0 a 1: quanto o músculo trabalha nesta pose (brilho do destaque) */
  esforco?: number;
  /** segundos parado nesta pose antes de seguir */
  pausa?: number;
  /** segundos da transição desta pose para a próxima */
  ate?: number;
  /** posição da bola nesta pose (quando a bola se move) */
  bola?: [number, number];
};

export const SEG = {
  tronco: 50,
  pescoco: 8,
  raioCabeca: 11,
  /** ombros: distância ao longo do tronco abaixo do pescoço e meia largura (vista de frente) */
  ombroDesce: 5,
  ombroLargura: 21,
  quadrilLargura: 10,
  braco: 29,
  antebraco: 25,
  mao: 8,
  coxa: 44,
  canela: 42,
  pe: 15,
  /** na vista de frente o pé aponta para quem olha: aparece curto */
  peFrente: 7,
} as const;

export type Junta =
  | "cabeca"
  | "pescoco"
  | "ombroD"
  | "ombroE"
  | "cotoveloD"
  | "cotoveloE"
  | "punhoD"
  | "punhoE"
  | "maoD"
  | "maoE"
  | "quadril"
  | "quadrilD"
  | "quadrilE"
  | "joelhoD"
  | "joelhoE"
  | "tornozeloD"
  | "tornozeloE"
  | "pontaD"
  | "pontaE";

export type Esqueleto = Record<Junta, Ponto> & { centroCabeca: Ponto };

const RAD = Math.PI / 180;
/** vetor unitário para um ângulo (0 = para baixo, 90 = para a frente/direita) */
export const dir = (a: number): Ponto => ({ x: Math.sin(a * RAD), y: -Math.cos(a * RAD) });
const soma = (p: Ponto, v: Ponto, k = 1): Ponto => ({ x: p.x + v.x * k, y: p.y + v.y * k });
export const dist = (a: Ponto, b: Ponto) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Cinemática inversa de dois segmentos: devolve a junta do meio (joelho/cotovelo).
 * `lado` escolhe a solução: +1 = à esquerda do vetor base->alvo (girando 90° anti-horário), -1 = à direita.
 * Alvos fora do alcance deixam o membro esticado na direção do alvo (o comprimento continua o mesmo).
 */
export function resolverDois(base: Ponto, alvo: Ponto, l1: number, l2: number, lado: 1 | -1): Ponto {
  const dx = alvo.x - base.x;
  const dy = alvo.y - base.y;
  const norma = Math.hypot(dx, dy) || 1e-9;
  const vx = dx / norma;
  const vy = dy / norma;
  const d = Math.max(Math.abs(l1 - l2) + 1e-6, Math.min(norma, l1 + l2 - 1e-6));
  // distância da base até o pé da perpendicular e altura do triângulo
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  // perpendicular à esquerda: (-vy, vx)
  return { x: base.x + vx * a - vy * h * lado, y: base.y + vy * a + vx * h * lado };
}

const ehAlvo = (m: Membro): m is MembroAlvo => "alvo" in m;

/**
 * Lado da dobra de um membro: com a preferência dada (vista de frente: para fora do corpo), escolhe a
 * solução daquele lado; sem preferência, usa o lado fixo (vista de lado, boneco olhando para +x: o joelho
 * fica sempre à esquerda do vetor quadril->tornozelo e o cotovelo à direita do vetor ombro->punho, o que
 * vale em pé, agachado, deitado de costas ou de bruços).
 */
function ladoDaDobra(base: Ponto, alvo: Ponto, preferida: Ponto | 1 | -1): 1 | -1 {
  if (preferida === 1 || preferida === -1) return preferida;
  const vx = alvo.x - base.x;
  const vy = alvo.y - base.y;
  // perpendicular à esquerda do vetor base->alvo
  const esq = { x: -vy, y: vx };
  return esq.x * preferida.x + esq.y * preferida.y >= 0 ? 1 : -1;
}

type ResultadoMembro = { meio: Ponto; fim: Ponto; ponta: Ponto };

function membro(
  m: Membro,
  base: Ponto,
  l1: number,
  l2: number,
  l3: number,
  preferida: Ponto | 1 | -1,
  forcado: 1 | -1 | undefined,
  espelho: number,
): ResultadoMembro {
  if (ehAlvo(m)) {
    const alvo = { x: m.alvo[0], y: m.alvo[1] };
    const lado = forcado ?? ladoDaDobra(base, alvo, preferida);
    const meio = resolverDois(base, alvo, l1, l2, lado);
    // o fim fica exatamente a l2 do meio (alvos fora do alcance: membro esticado)
    const v = { x: alvo.x - meio.x, y: alvo.y - meio.y };
    const n = Math.hypot(v.x, v.y) || 1;
    const fim = { x: meio.x + (v.x / n) * l2, y: meio.y + (v.y / n) * l2 };
    const e = dir(m.ext);
    return { meio, fim, ponta: soma(fim, { x: e.x * espelho, y: e.y }, l3) };
  }
  const [a1, a2, a3] = m.ang;
  const d1 = dir(a1);
  const d2 = dir(a2);
  const d3 = dir(a3);
  const meio = soma(base, { x: d1.x * espelho, y: d1.y }, l1);
  const fim = soma(meio, { x: d2.x * espelho, y: d2.y }, l2);
  return { meio, fim, ponta: soma(fim, { x: d3.x * espelho, y: d3.y }, l3) };
}

/**
 * Posição de todas as juntas.
 * Vista de lado: o boneco olha para +x; o lado direito é o mais próximo de quem olha (desenhado por cima).
 * Vista de frente: o boneco olha para quem vê; o lado direito dele fica à esquerda da tela (x negativo) e,
 * nos membros por ângulos, ângulo positivo = para fora do corpo.
 */
export function calcularEsqueleto(p: Pose, vista: Vista): Esqueleto {
  const q = { x: p.quadril[0], y: p.quadril[1] };
  const dt = dir(p.tronco);
  const pescoco = soma(q, dt, SEG.tronco);
  const cabeca = soma(pescoco, dir(p.cabeca ?? p.tronco), SEG.pescoco);
  const centroCabeca = soma(cabeca, dir(p.cabeca ?? p.tronco), SEG.raioCabeca);
  const ombroCentro = soma(pescoco, dt, -SEG.ombroDesce);
  // perpendicular ao tronco que aponta para a direita da tela
  const perp = { x: -dt.y, y: dt.x };
  const perpTela = perp.x >= 0 ? perp : { x: -perp.x, y: -perp.y };
  const frente = vista === "frente";
  const larg = (l: number, lado: "D" | "E") => (frente ? (lado === "D" ? -l : l) : 0);

  const ombroD = soma(ombroCentro, perpTela, larg(SEG.ombroLargura, "D"));
  const ombroE = soma(ombroCentro, perpTela, larg(SEG.ombroLargura, "E"));
  const quadrilD = soma(q, perpTela, larg(SEG.quadrilLargura, "D"));
  const quadrilE = soma(q, perpTela, larg(SEG.quadrilLargura, "E"));

  const pe = frente ? SEG.peFrente : SEG.pe;

  const prefPerna = (lado: "D" | "E"): Ponto | 1 => (frente ? { x: lado === "D" ? -1 : 1, y: 0 } : 1);
  const prefBraco = (lado: "D" | "E"): Ponto | -1 => (frente ? { x: lado === "D" ? -1 : 1, y: 0 } : -1);
  const espelho = (lado: "D" | "E") => (frente && lado === "D" ? -1 : 1);

  const pD = membro(
    p.pernaD,
    quadrilD,
    SEG.coxa,
    SEG.canela,
    pe,
    prefPerna("D"),
    p.dobra?.pernaD,
    espelho("D"),
  );
  const pE = membro(
    p.pernaE,
    quadrilE,
    SEG.coxa,
    SEG.canela,
    pe,
    prefPerna("E"),
    p.dobra?.pernaE,
    espelho("E"),
  );
  const bD = membro(
    p.bracoD,
    ombroD,
    SEG.braco,
    SEG.antebraco,
    SEG.mao,
    prefBraco("D"),
    p.dobra?.bracoD,
    espelho("D"),
  );
  const bE = membro(
    p.bracoE,
    ombroE,
    SEG.braco,
    SEG.antebraco,
    SEG.mao,
    prefBraco("E"),
    p.dobra?.bracoE,
    espelho("E"),
  );

  return {
    cabeca,
    centroCabeca,
    pescoco,
    ombroD,
    ombroE,
    cotoveloD: bD.meio,
    cotoveloE: bE.meio,
    punhoD: bD.fim,
    punhoE: bE.fim,
    maoD: bD.ponta,
    maoE: bE.ponta,
    quadril: q,
    quadrilD,
    quadrilE,
    joelhoD: pD.meio,
    joelhoE: pE.meio,
    tornozeloD: pD.fim,
    tornozeloE: pE.fim,
    pontaD: pD.ponta,
    pontaE: pE.ponta,
  };
}

/** Segmentos desenhados (de, para) e o comprimento esperado de cada um. */
export const SEGMENTOS: { id: string; de: Junta; para: Junta; lado: "D" | "E" | "C" }[] = [
  { id: "tronco", de: "quadril", para: "pescoco", lado: "C" },
  { id: "pescoco", de: "pescoco", para: "cabeca", lado: "C" },
  { id: "bracoD", de: "ombroD", para: "cotoveloD", lado: "D" },
  { id: "antebracoD", de: "cotoveloD", para: "punhoD", lado: "D" },
  { id: "maoD", de: "punhoD", para: "maoD", lado: "D" },
  { id: "bracoE", de: "ombroE", para: "cotoveloE", lado: "E" },
  { id: "antebracoE", de: "cotoveloE", para: "punhoE", lado: "E" },
  { id: "maoE", de: "punhoE", para: "maoE", lado: "E" },
  { id: "coxaD", de: "quadrilD", para: "joelhoD", lado: "D" },
  { id: "canelaD", de: "joelhoD", para: "tornozeloD", lado: "D" },
  { id: "peD", de: "tornozeloD", para: "pontaD", lado: "D" },
  { id: "coxaE", de: "quadrilE", para: "joelhoE", lado: "E" },
  { id: "canelaE", de: "joelhoE", para: "tornozeloE", lado: "E" },
  { id: "peE", de: "tornozeloE", para: "pontaE", lado: "E" },
];

export function comprimentoEsperado(id: string, vista: Vista): number {
  const base = id.replace(/[DE]$/, "");
  switch (base) {
    case "tronco":
      return SEG.tronco;
    case "pescoco":
      return SEG.pescoco;
    case "braco":
      return SEG.braco;
    case "antebraco":
      return SEG.antebraco;
    case "mao":
      return SEG.mao;
    case "coxa":
      return SEG.coxa;
    case "canela":
      return SEG.canela;
    case "pe":
      return vista === "frente" ? SEG.peFrente : SEG.pe;
    default:
      return 0;
  }
}

// ------------------------------------------------------------ interpolação

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** suaviza começo e fim de cada transição (ritmo de movimento real) */
export const suave = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, t)));

/** Interpola ângulos pelo caminho mais curto. */
const lerpAng = (a: number, b: number, t: number) => {
  let d = ((b - a + 540) % 360) - 180;
  if (d === -180) d = 180;
  return a + d * t;
};

function interpMembro(a: Membro, b: Membro, t: number): Membro {
  if (ehAlvo(a) && ehAlvo(b)) {
    return {
      alvo: [lerp(a.alvo[0], b.alvo[0], t), lerp(a.alvo[1], b.alvo[1], t)],
      ext: lerpAng(a.ext, b.ext, t),
    };
  }
  if (!ehAlvo(a) && !ehAlvo(b)) {
    return {
      ang: [lerpAng(a.ang[0], b.ang[0], t), lerpAng(a.ang[1], b.ang[1], t), lerpAng(a.ang[2], b.ang[2], t)],
    };
  }
  // modos diferentes não são permitidos (o teste de poses garante); mantém o primeiro
  return a;
}

export function interpolarPose(a: Pose, b: Pose, t: number): Pose {
  return {
    quadril: [lerp(a.quadril[0], b.quadril[0], t), lerp(a.quadril[1], b.quadril[1], t)],
    tronco: lerpAng(a.tronco, b.tronco, t),
    cabeca: lerpAng(a.cabeca ?? a.tronco, b.cabeca ?? b.tronco, t),
    olhar: lerp(a.olhar ?? 0, b.olhar ?? 0, t),
    pernaD: interpMembro(a.pernaD, b.pernaD, t),
    pernaE: interpMembro(a.pernaE, b.pernaE, t),
    bracoD: interpMembro(a.bracoD, b.bracoD, t),
    bracoE: interpMembro(a.bracoE, b.bracoE, t),
    dobra: t < 0.5 ? a.dobra : b.dobra,
    esforco: lerp(a.esforco ?? 0, b.esforco ?? 0, t),
    bola: a.bola && b.bola ? [lerp(a.bola[0], b.bola[0], t), lerp(a.bola[1], b.bola[1], t)] : a.bola,
  };
}

/** Duração de um ciclo (uma repetição completa), em segundos. */
export function duracaoDoCiclo(poses: Pose[]): number {
  return poses.reduce((s, p) => s + (p.pausa ?? 0) + (p.ate ?? 1), 0);
}

/** Pose no instante `t` (segundos) de um ciclo que se repete. */
export function poseNoInstante(poses: Pose[], t: number): Pose {
  if (poses.length === 1) return poses[0];
  const ciclo = duracaoDoCiclo(poses);
  let r = ((t % ciclo) + ciclo) % ciclo;
  for (let i = 0; i < poses.length; i++) {
    const p = poses[i];
    const pausa = p.pausa ?? 0;
    if (r < pausa) return p;
    r -= pausa;
    const ate = p.ate ?? 1;
    if (r < ate) return interpolarPose(p, poses[(i + 1) % poses.length], suave(r / ate));
    r -= ate;
  }
  return poses[0];
}
