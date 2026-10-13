"use client";

import { X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { dorMedia, sessoesNoPeriodo } from "@/lib/derivados";
import { useDispensados } from "@/lib/dispensados";
import { addDias, diasDaSemana } from "@/lib/tempo";
import type { Checkin, Sessao } from "@/lib/tipos";

/** Domingo à noite: resumo curto da semana que acabou. */
export function SemanaEncerrada({
  hoje,
  checkins,
  sessoes,
  indice,
}: {
  hoje: string;
  checkins: Checkin[];
  sessoes: Sessao[];
  indice?: number;
}) {
  const { dispensar, dispensado } = useDispensados(hoje);
  if (dispensado("semana-encerrada")) return null;

  const dias = diasDaSemana(addDias(hoje, -1));
  const feitos = sessoesNoPeriodo(sessoes, dias[0], dias[6]).length;
  const dor = dorMedia(checkins, dias[0], dias[6]);

  return (
    <GlassCard
      indice={indice}
      titulo="Semana encerrada"
      acao={
        <button
          type="button"
          onClick={() => dispensar("semana-encerrada")}
          aria-label="Dispensar resumo da semana"
          className="-m-2 flex size-11 items-center justify-center rounded-full text-texto2"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      }
    >
      <p className="t-corpo text-texto2">
        {feitos} {feitos === 1 ? "treino feito" : "treinos feitos"}
        {dor !== null ? ` · dor média ${dor.toFixed(1).replace(".", ",")} de 10` : " · sem check-ins"}
      </p>
      <ButtonLink href="/evolucao" variante="secundario" className="mt-3 w-full">
        Ver evolução
      </ButtonLink>
    </GlassCard>
  );
}
