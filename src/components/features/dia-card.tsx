"use client";

import { Check, ChevronRight, Trophy } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { TagChip } from "@/components/features/tag-chip";
import type { RotuloCarga } from "@/lib/carga";
import { sessaoDoBloco } from "@/lib/derivados";
import { ROTULO_PERIODO, blocoTreinavel, type DiaPlano } from "@/lib/seed/plano";
import { horaTexto } from "@/lib/tempo";
import type { Sessao } from "@/lib/tipos";

export function diaConcluido(dia: DiaPlano, sessoes: Sessao[], hoje: string) {
  if (dia.iso > hoje) return false;
  const treinaveis = dia.blocos.filter(blocoTreinavel);
  if (!treinaveis.length) return false;
  return treinaveis.every((b) => {
    const s = sessaoDoBloco(sessoes, dia.iso, b.id);
    return s?.resultado === "feito" || s?.resultado === "parcial";
  });
}

type Props = {
  dia: DiaPlano;
  hoje: string;
  rotuloCarga: RotuloCarga;
  sessoes: Sessao[];
  indice?: number;
};

export function DiaCard({ dia, hoje, rotuloCarga, sessoes, indice }: Props) {
  const ehHoje = dia.iso === hoje;
  const concluido = diaConcluido(dia, sessoes, hoje);
  const folga = dia.blocos.every((b) => b.tags.includes("Folga"));
  const numero = Number(dia.iso.slice(8));

  return (
    <div id={`dia-${dia.iso}`}>
      <GlassCard
        href={`/semana/${dia.iso}`}
        indice={indice}
        variante={dia.jogo ? "destaque" : "forte"}
        aria-label={`${dia.nome}, ${numero}: ${dia.titulo}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="t-rotulo flex items-center gap-2 text-texto2">
              {dia.nome}, {numero}
              {ehHoje && <span className="rounded-full bg-primario px-2.5 py-1 text-[13px] leading-none font-semibold text-white">Hoje</span>}
              {concluido && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ok px-2.5 py-1 text-[13px] leading-none font-semibold text-sobre">
                  <Check className="size-3.5" aria-hidden="true" />
                  Concluído
                </span>
              )}
              {folga && <span className="rounded-full border border-borda px-2.5 py-1 text-[13px] leading-none">Folga</span>}
            </p>
            <h2 className="t-h3 mt-1">{dia.titulo}</h2>
          </div>
          <ChevronRight className="mt-1 size-5 shrink-0 text-texto3" aria-hidden="true" />
        </div>

        <ul className="mt-3 space-y-2">
          {dia.blocos.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-2">
              <span className="t-pq w-[84px] shrink-0 text-texto2">
                {b.periodo === "jogo" ? (
                  <span className="inline-flex items-center gap-1 text-aviso-t">
                    <Trophy className="size-4" aria-hidden="true" />
                    {dia.jogo ? horaTexto(dia.jogo.hora, dia.jogo.min) : "Jogo"}
                  </span>
                ) : (
                  <>
                    {ROTULO_PERIODO[b.periodo]}
                    {b.duracaoMin > 0 ? ` · ${b.duracaoMin} min` : ""}
                  </>
                )}
              </span>
              {b.tags.map((t) => (
                <TagChip key={t} tag={t} />
              ))}
            </li>
          ))}
        </ul>

        <p className="t-pq mt-3 text-texto2">Carga: {rotuloCarga}</p>
      </GlassCard>
    </div>
  );
}
