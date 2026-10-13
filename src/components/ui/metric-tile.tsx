"use client";

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";
import { cn } from "@/lib/cn";

type Props = {
  icone: React.ReactNode;
  rotulo: string;
  /** número com count-up; null mostra "—" */
  valor: number | null;
  unidade?: string;
  casas?: number;
  /** quando informado, aparece no lugar do número (ex.: faixa de sono) */
  texto?: string;
  tendencia?: "sobe" | "desce" | "estavel" | null;
  legenda?: string;
  className?: string;
};

export function MetricTile({
  icone,
  rotulo,
  valor,
  unidade,
  casas = 0,
  texto,
  tendencia,
  legenda,
  className,
}: Props) {
  const vazio = valor === null && !texto;
  const Seta = tendencia === "sobe" ? ArrowUp : tendencia === "desce" ? ArrowDown : ArrowRight;

  return (
    <div
      className={cn(
        "flex min-h-[132px] flex-1 flex-col justify-between rounded-cartao border border-borda bg-vidro-forte p-3",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-texto2">
        <span className="text-realce-t" aria-hidden="true">
          {icone}
        </span>
        <span className="t-rotulo">{rotulo}</span>
      </div>
      <div className="mt-2">
        <p className="flex items-baseline gap-1 leading-none">
          {vazio ? (
            <span className="text-[32px] font-bold text-texto3">—</span>
          ) : texto ? (
            <span className="text-[22px] leading-7 font-bold">{texto}</span>
          ) : (
            <>
              <span className="text-[32px] leading-10 font-bold">
                <CountUp valor={valor ?? 0} casas={casas} />
              </span>
              {unidade && <span className="t-pq text-texto2">{unidade}</span>}
            </>
          )}
          {!vazio && tendencia && (
            <Seta className="ml-1 size-4 self-center text-realce-t" aria-label={`tendência: ${tendencia}`} />
          )}
        </p>
        <p className="t-pq mt-1 text-texto2">{vazio ? "sem registro" : legenda}</p>
      </div>
    </div>
  );
}
