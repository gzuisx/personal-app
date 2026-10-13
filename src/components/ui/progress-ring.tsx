"use client";

import { motion } from "motion/react";
import { movimento } from "@/lib/design/tokens";

type Props = {
  /** de 0 a 1 */
  valor: number;
  tamanho?: number;
  espessura?: number;
  centro?: React.ReactNode;
  rotulo?: string;
  cor?: string;
  descricao?: string;
};

export function ProgressRing({
  valor,
  tamanho = 96,
  espessura = 10,
  centro,
  rotulo,
  cor = "var(--accent)",
  descricao,
}: Props) {
  const v = Math.max(0, Math.min(1, valor));
  const raio = (tamanho - espessura) / 2;
  const c = tamanho / 2;

  return (
    <figure className="flex flex-col items-center gap-2" aria-label={descricao}>
      <div className="relative" style={{ width: tamanho, height: tamanho }}>
        <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} className="-rotate-90">
          <circle cx={c} cy={c} r={raio} fill="none" stroke="var(--border-glass)" strokeWidth={espessura} />
          <motion.circle
            cx={c}
            cy={c}
            r={raio}
            fill="none"
            stroke={cor}
            strokeWidth={espessura}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: v }}
            transition={{ duration: 0.8, ease: movimento.easing }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-center">{centro}</div>
      </div>
      {rotulo && <figcaption className="t-rotulo text-center text-texto2">{rotulo}</figcaption>}
    </figure>
  );
}
