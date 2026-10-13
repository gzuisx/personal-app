"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { movimento } from "@/lib/design/tokens";

/** Largura real (em px CSS) do contêiner, para os textos do SVG nunca ficarem abaixo de 13 px. */
function useLargura(inicial = 320) {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(inicial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const atualizar = () => setLargura(Math.max(240, Math.floor(el.clientWidth)));
    atualizar();
    const ro = new ResizeObserver(atualizar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, largura };
}

export type PontoDor = {
  iso: string;
  rotulo: string;
  /** dor do check-in do dia */
  dor: number | null;
  /** dor depois do jogo, quando houve jogo no dia */
  dorJogo: number | null;
  jogo: boolean;
};

const corDor = (v: number, atencao: number, bloqueio: number) =>
  v >= bloqueio ? "var(--danger)" : v >= atencao ? "var(--warning)" : "var(--success)";

const mostrarRotulo = (i: number, n: number) => n <= 8 || i % 5 === 0 || i === n - 1;

export function GraficoDor({
  pontos,
  limiteAtencao,
  limiteBloqueio,
  descricao,
}: {
  pontos: PontoDor[];
  limiteAtencao: number;
  limiteBloqueio: number;
  descricao: string;
}) {
  const { ref, largura } = useLargura();
  const altura = 210;
  const m = { l: 30, r: 8, t: 12, b: 30 };
  const iw = largura - m.l - m.r;
  const ih = altura - m.t - m.b;
  const n = pontos.length;
  const banda = iw / n;
  const x = (i: number) => m.l + (i + 0.5) * banda;
  const y = (v: number) => m.t + ih * (1 - v / 10);

  const com = pontos.flatMap((p, i) => (p.dor === null ? [] : [{ i, v: p.dor }]));
  const caminho = com
    .map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`)
    .join(" ");

  return (
    <div ref={ref} className="w-full">
      <svg width={largura} height={altura} role="img" aria-label={descricao}>
        {pontos.map(
          (p, i) =>
            p.jogo && (
              <rect
                key={`b-${p.iso}`}
                x={m.l + i * banda + 1}
                y={m.t}
                width={Math.max(2, banda - 2)}
                height={ih}
                rx={6}
                fill="var(--accent)"
                opacity={0.16}
              />
            ),
        )}

        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line
              x1={m.l}
              x2={largura - m.r}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border-glass)"
              strokeWidth={1}
            />
            <text x={m.l - 6} y={y(v) + 4} textAnchor="end" fontSize={13} fill="var(--text-2)">
              {v}
            </text>
          </g>
        ))}
        {[
          { v: limiteAtencao, c: "var(--warning)" },
          { v: limiteBloqueio, c: "var(--danger)" },
        ].map((l) => (
          <line
            key={l.v + l.c}
            x1={m.l}
            x2={largura - m.r}
            y1={y(l.v)}
            y2={y(l.v)}
            stroke={l.c}
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.7}
          />
        ))}

        {caminho && (
          <motion.path
            d={caminho}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: movimento.easing }}
          />
        )}

        {com.map((p, k) => (
          <motion.circle
            key={`p-${pontos[p.i].iso}`}
            cx={x(p.i)}
            cy={y(p.v)}
            r={5}
            fill={corDor(p.v, limiteAtencao, limiteBloqueio)}
            stroke="var(--surface-solid)"
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + k * 0.03, duration: 0.25 }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        ))}

        {pontos.map(
          (p, i) =>
            p.dorJogo !== null && (
              <motion.rect
                key={`j-${p.iso}`}
                x={x(i) - 7}
                y={y(p.dorJogo) - 7}
                width={14}
                height={14}
                rx={3}
                fill={corDor(p.dorJogo, limiteAtencao, limiteBloqueio)}
                stroke="var(--text)"
                strokeWidth={2}
                transform={`rotate(45 ${x(i)} ${y(p.dorJogo)})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              />
            ),
        )}

        {pontos.map(
          (p, i) =>
            mostrarRotulo(i, n) && (
              <text
                key={`t-${p.iso}`}
                x={x(i)}
                y={altura - 8}
                textAnchor="middle"
                fontSize={13}
                fill="var(--text-2)"
              >
                {p.rotulo}
              </text>
            ),
        )}
      </svg>
    </div>
  );
}

export type PontoBarra = { iso: string; rotulo: string; valor: number | null };

export function GraficoBarras({
  pontos,
  max,
  cor = "var(--accent)",
  descricao,
}: {
  pontos: PontoBarra[];
  max: number;
  cor?: string;
  descricao: string;
}) {
  const { ref, largura } = useLargura();
  const altura = 150;
  const m = { l: 30, r: 8, t: 10, b: 30 };
  const iw = largura - m.l - m.r;
  const ih = altura - m.t - m.b;
  const n = pontos.length;
  const banda = iw / n;
  const larguraBarra = Math.max(4, Math.min(28, banda * 0.62));
  const y = (v: number) => m.t + ih * (1 - v / max);

  return (
    <div ref={ref} className="w-full">
      <svg width={largura} height={altura} role="img" aria-label={descricao}>
        {[0, max / 2, max].map((v) => (
          <g key={v}>
            <line
              x1={m.l}
              x2={largura - m.r}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border-glass)"
              strokeWidth={1}
            />
            <text x={m.l - 6} y={y(v) + 4} textAnchor="end" fontSize={13} fill="var(--text-2)">
              {Number.isInteger(v) ? v : v.toFixed(1)}
            </text>
          </g>
        ))}
        {pontos.map((p, i) => {
          const cx = m.l + (i + 0.5) * banda;
          const h = p.valor === null ? 0 : ih * (p.valor / max);
          return (
            <g key={p.iso}>
              {p.valor !== null && (
                <motion.rect
                  x={cx - larguraBarra / 2}
                  width={larguraBarra}
                  rx={Math.min(6, larguraBarra / 2)}
                  fill={cor}
                  initial={{ y: m.t + ih, height: 0 }}
                  animate={{ y: m.t + ih - h, height: h }}
                  transition={{ delay: i * 0.04, duration: 0.5, ease: movimento.easing }}
                />
              )}
              {mostrarRotulo(i, n) && (
                <text x={cx} y={altura - 8} textAnchor="middle" fontSize={13} fill="var(--text-2)">
                  {p.rotulo}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export type SerieLinha = {
  chave: string;
  rotulo: string;
  cor: string;
  pontos: { iso: string; valor: number }[];
};

const CORES_LINHA = ["var(--accent)", "var(--success)", "var(--warning)", "var(--primary-hover)"];
export const corDaSerie = (i: number) => CORES_LINHA[i % CORES_LINHA.length];

/** Linhas simples por data (testes de campo, tendências do diário). Cada ponto vira um círculo. */
export function GraficoLinha({
  series,
  descricao,
  unidade,
}: {
  series: SerieLinha[];
  descricao: string;
  unidade?: string;
}) {
  const { ref, largura } = useLargura();
  const altura = 170;
  const m = { l: 40, r: 10, t: 12, b: 30 };
  const iw = largura - m.l - m.r;
  const ih = altura - m.t - m.b;
  const datas = [...new Set(series.flatMap((s) => s.pontos.map((p) => p.iso)))].sort();
  const valores = series.flatMap((s) => s.pontos.map((p) => p.valor));
  if (!valores.length) return null;
  const vmin = Math.min(...valores);
  const vmax = Math.max(...valores);
  const folga = vmax === vmin ? Math.max(1, Math.abs(vmax) * 0.1) : (vmax - vmin) * 0.15;
  const lo = vmin - folga;
  const hi = vmax + folga;
  const x = (iso: string) =>
    datas.length === 1 ? m.l + iw / 2 : m.l + (datas.indexOf(iso) / (datas.length - 1)) * iw;
  const y = (v: number) => m.t + ih * (1 - (v - lo) / (hi - lo));
  const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)).replace(".", ",");
  const rotuloData = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

  return (
    <div ref={ref} className="w-full">
      <svg width={largura} height={altura} role="img" aria-label={descricao}>
        {[lo + folga, (lo + hi) / 2, hi - folga].map((v) => (
          <g key={v}>
            <line
              x1={m.l}
              x2={largura - m.r}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border-glass)"
              strokeWidth={1}
            />
            <text x={m.l - 6} y={y(v) + 4} textAnchor="end" fontSize={13} fill="var(--text-2)">
              {fmt(v)}
            </text>
          </g>
        ))}
        {series.map((s) => (
          <g key={s.chave}>
            {s.pontos.length > 1 && (
              <polyline
                fill="none"
                stroke={s.cor}
                strokeWidth={2.5}
                points={s.pontos.map((p) => `${x(p.iso)},${y(p.valor)}`).join(" ")}
              />
            )}
            {s.pontos.map((p) => (
              <circle key={p.iso} cx={x(p.iso)} cy={y(p.valor)} r={4.5} fill={s.cor} />
            ))}
          </g>
        ))}
        {datas.map((iso, i) =>
          datas.length <= 6 || i === 0 || i === datas.length - 1 ? (
            <text key={iso} x={x(iso)} y={altura - 8} textAnchor="middle" fontSize={13} fill="var(--text-2)">
              {rotuloData(iso)}
            </text>
          ) : null,
        )}
      </svg>
      {unidade && <p className="t-pq text-texto2">Em {unidade}</p>}
    </div>
  );
}
