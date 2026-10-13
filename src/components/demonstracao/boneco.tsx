// Desenho de um quadro do "boneco de nós" em SVG: segmentos com volume, nós nas articulações,
// músculos trabalhados em brilho e os aparelhos da cena.
import { brilhos, juntasEmBrilho, type Caixa, type Quadro } from "@/lib/demonstracao/cena";
import { SEG, type Esqueleto, type Junta, type Ponto } from "@/lib/demonstracao/esqueleto";
import type { Demo, Prop } from "@/lib/demonstracao/tipos";

const LARGURA: Record<string, number> = {
  braco: 8,
  antebraco: 6.5,
  mao: 4,
  coxa: 11.5,
  canela: 8,
  pe: 4.5,
  pescoco: 6,
};

type Linha = { de: Ponto; para: Ponto; w: number };

const L = (e: Esqueleto, de: Junta, para: Junta, w: number): Linha => ({ de: e[de], para: e[para], w });

function membros(e: Esqueleto, lado: "D" | "E"): Linha[] {
  return [
    L(e, `quadril${lado}`, `joelho${lado}`, LARGURA.coxa),
    L(e, `joelho${lado}`, `tornozelo${lado}`, LARGURA.canela),
    L(e, `tornozelo${lado}`, `ponta${lado}`, LARGURA.pe),
    L(e, `ombro${lado}`, `cotovelo${lado}`, LARGURA.braco),
    L(e, `cotovelo${lado}`, `punho${lado}`, LARGURA.antebraco),
    L(e, `punho${lado}`, `mao${lado}`, LARGURA.mao),
  ];
}

const NOS_LADO = ["ombro", "cotovelo", "punho", "joelho", "tornozelo"] as const;

function Segmentos({ linhas, classe }: { linhas: Linha[]; classe: string }) {
  return (
    <g className={classe} strokeLinecap="round" fill="none">
      {linhas.map((l, i) => (
        <line key={i} x1={l.de.x} y1={l.de.y} x2={l.para.x} y2={l.para.y} strokeWidth={l.w} />
      ))}
    </g>
  );
}

function Nos({ pontos }: { pontos: Ponto[] }) {
  return (
    <g className="boneco-no">
      {pontos.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.4} />
      ))}
    </g>
  );
}

function PropSvg({ p, e }: { p: Prop; e: Esqueleto }) {
  switch (p.tipo) {
    case "caixa":
      return <rect className="boneco-prop" x={p.x} y={p.y} width={p.w} height={p.h} rx={2} />;
    case "parede":
      return <rect className="boneco-prop" x={p.x} y={0} width={4} height={150} />;
    case "cabo": {
      const fim = typeof p.para === "string" ? e[p.para] : { x: p.para[0], y: p.para[1] };
      return (
        <line
          className="boneco-cabo"
          x1={e[p.de].x}
          y1={e[p.de].y}
          x2={fim.x}
          y2={fim.y}
          strokeWidth={1.6}
          strokeDasharray="3 2"
        />
      );
    }
    case "halter": {
      const c = e[p.junta];
      return (
        <g className="boneco-peso">
          <rect x={c.x - 7} y={c.y - 3} width={14} height={6} rx={2} />
          <rect x={c.x - 9} y={c.y - 5} width={4} height={10} rx={1.5} />
          <rect x={c.x + 5} y={c.y - 5} width={4} height={10} rx={1.5} />
        </g>
      );
    }
    case "barra": {
      const a = e[p.juntas[0]];
      const b = e[p.juntas[1]];
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (Math.hypot(a.x - b.x, a.y - b.y) < 6) {
        // de lado: a barra aponta para quem olha; aparece a anilha
        return (
          <g className="boneco-peso">
            <circle cx={m.x} cy={m.y} r={9} />
            <circle cx={m.x} cy={m.y} r={2} className="boneco-furo" />
          </g>
        );
      }
      const v = { x: b.x - a.x, y: b.y - a.y };
      const n = Math.hypot(v.x, v.y) || 1;
      const u = { x: v.x / n, y: v.y / n };
      const ext = 16;
      return (
        <g className="boneco-peso">
          <line
            x1={a.x - u.x * ext}
            y1={a.y - u.y * ext}
            x2={b.x + u.x * ext}
            y2={b.y + u.y * ext}
            strokeWidth={2.5}
            className="boneco-barra"
          />
          <rect x={a.x - u.x * ext - 2} y={a.y - 8} width={4} height={16} rx={1.5} />
          <rect x={b.x + u.x * ext - 2} y={b.y - 8} width={4} height={16} rx={1.5} />
        </g>
      );
    }
    case "bola": {
      const c = p.junta ? e[p.junta] : p.pos ? { x: p.pos[0], y: p.pos[1] } : null;
      if (!c) return null;
      const r = p.r ?? (p.medicinal ? 7 : 5.5);
      return <circle className={p.medicinal ? "boneco-peso" : "boneco-bola"} cx={c.x} cy={c.y} r={r} />;
    }
    case "cone":
      return <polygon className="boneco-cone" points={`${p.x - 5},0 ${p.x + 5},0 ${p.x},12`} />;
    case "rolo": {
      const c = e[p.junta];
      return <circle className="boneco-peso" cx={c.x} cy={c.y} r={4.5} />;
    }
  }
}

/** Tronco de frente: um trapézio entre ombros e quadril; de lado, um segmento largo. */
function Tronco({ e, frente }: { e: Esqueleto; frente: boolean }) {
  if (!frente) {
    return (
      <g className="boneco-corpo" strokeLinecap="round">
        <line x1={e.quadril.x} y1={e.quadril.y} x2={e.pescoco.x} y2={e.pescoco.y} strokeWidth={17} />
      </g>
    );
  }
  const pts = [e.ombroD, e.ombroE, e.quadrilE, e.quadrilD].map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <polygon className="boneco-corpo boneco-torso" points={pts} strokeLinejoin="round" strokeWidth={8} />
  );
}

export function BonecoQuadro({
  demo,
  quadro,
  caixa,
  pulso,
  titulo,
}: {
  demo: Demo;
  quadro: Quadro;
  caixa: Caixa;
  /** 0 a 1: intensidade do brilho neste instante */
  pulso: number;
  titulo: string;
}) {
  const e = quadro.esqueleto;
  const frente = demo.vista === "frente";
  // de lado o boneco olha para a esquerda da tela: espelha a cena inteira
  const espelho = frente ? "" : `scale(-1 1) translate(${-(2 * caixa.x + caixa.w)} 0)`;
  const brilho = brilhos(e, demo);
  const juntasB = juntasEmBrilho(e, demo);
  const longe: "D" | "E" = "E";
  const perto: "D" | "E" = "D";
  const c = e.centroCabeca;
  const olhar = quadro.pose.olhar ?? 0;

  return (
    <svg
      viewBox={`${caixa.x} ${-(caixa.y + caixa.h)} ${caixa.w} ${caixa.h}`}
      className="boneco h-full w-full"
      role="img"
      aria-label={titulo}
    >
      <defs>
        <filter id="boneco-brilho" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>
      {/* o desenho usa y para cima; o SVG usa y para baixo */}
      <g transform="scale(1 -1)">
        <g transform={espelho}>
          <line
            className="boneco-chao"
            x1={caixa.x - 50}
            y1={0}
            x2={caixa.x + caixa.w + 50}
            y2={0}
            strokeWidth={1.2}
          />
          {(demo.props ?? [])
            .filter((p) => p.tipo === "caixa" || p.tipo === "parede" || p.tipo === "cone")
            .map((p, i) => (
              <PropSvg key={`f${i}`} p={p} e={e} />
            ))}

          {/* membros do lado de lá (mais apagados de lado) */}
          <Segmentos linhas={membros(e, longe)} classe={frente ? "boneco-corpo" : "boneco-longe"} />
          <Tronco e={e} frente={frente} />
          <Segmentos linhas={[L(e, "pescoco", "cabeca", LARGURA.pescoco)]} classe="boneco-corpo" />
          {/* cabeça */}
          <circle className="boneco-cabeca" cx={c.x} cy={c.y} r={SEG.raioCabeca} />
          {frente ? (
            <ellipse
              className="boneco-rosto"
              cx={c.x + olhar * 7}
              cy={c.y + 1}
              rx={6 - Math.abs(olhar) * 3}
              ry={2.2}
            />
          ) : (
            <ellipse className="boneco-rosto" cx={c.x + 6} cy={c.y + 1} rx={3.2} ry={2} />
          )}
          <Segmentos linhas={membros(e, perto)} classe="boneco-corpo" />

          {/* músculos trabalhados */}
          <g className="boneco-brilho" style={{ opacity: 0.35 + 0.65 * pulso }} strokeLinecap="round">
            {brilho.map((b, i) => (
              <line
                key={i}
                x1={b.de.x}
                y1={b.de.y}
                x2={b.para.x}
                y2={b.para.y}
                strokeWidth={b.largura}
                filter="url(#boneco-brilho)"
              />
            ))}
            {brilho.map((b, i) => (
              <line
                key={`n${i}`}
                x1={b.de.x}
                y1={b.de.y}
                x2={b.para.x}
                y2={b.para.y}
                strokeWidth={b.largura * 0.45}
                className="boneco-brilho-nucleo"
              />
            ))}
            {juntasB.map((p, i) => (
              <circle
                key={`j${i}`}
                cx={p.x}
                cy={p.y}
                r={5}
                filter="url(#boneco-brilho)"
                className="boneco-brilho-junta"
              />
            ))}
          </g>

          <Nos
            pontos={[
              ...NOS_LADO.flatMap((n) => [e[`${n}D` as Junta], e[`${n}E` as Junta]]),
              e.quadrilD,
              e.quadrilE,
              e.pescoco,
            ]}
          />

          {(demo.props ?? [])
            .filter((p) => p.tipo !== "caixa" && p.tipo !== "parede" && p.tipo !== "cone")
            .map((p, i) => (
              <PropSvg key={`p${i}`} p={p} e={e} />
            ))}
          {quadro.bola && <circle className="boneco-bola" cx={quadro.bola.x} cy={quadro.bola.y} r={5.5} />}
        </g>
      </g>
    </svg>
  );
}
