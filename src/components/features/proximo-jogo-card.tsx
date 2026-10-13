"use client";

import { CalendarCheck, CheckCircle2, Play, Trophy } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import {
  addDias,
  contagemRegressiva,
  dataISO,
  horaTexto,
  posJogoDisponivel,
  preJogoAtivo,
  proximoJogo,
  ultimoJogo,
} from "@/lib/tempo";
import type { Jogo } from "@/lib/tipos";

export function ProximoJogoCard({ agora, jogos, indice }: { agora: Date; jogos: Jogo[]; indice?: number }) {
  const prox = proximoJogo(agora);
  const ult = ultimoJogo(agora);
  const hoje = dataISO(agora);

  const dia = prox.data === hoje ? "Hoje" : prox.data === addDias(hoje, 1) ? "Amanhã" : prox.slot.nome;
  const emAndamento = prox.ms <= 0;
  const pre = preJogoAtivo(agora, prox);
  const pos = ult ? posJogoDisponivel(agora, ult) : false;
  const registrado = ult ? jogos.some((j) => j.inicio === ult.inicio.toISOString() && j.dor !== null) : false;

  return (
    <GlassCard
      indice={indice}
      titulo="Próximo jogo"
      acao={<Trophy className="size-6 text-aviso-t" aria-hidden="true" />}
    >
      <p className="t-h2">
        {dia}, {horaTexto(prox.slot.hora, prox.slot.min)}
      </p>
      <p className="t-corpo mt-0.5 text-texto2">
        {emAndamento ? "Jogo em andamento" : contagemRegressiva(prox.ms)}
      </p>

      <div className="mt-4 space-y-2">
        {pre && (
          <ButtonLink href="/jogo/pre" variante="secundario" className="w-full border-realce">
            <Play className="size-5" aria-hidden="true" />
            Modo pré-jogo
          </ButtonLink>
        )}
        {!pre && !emAndamento && (
          <p className="t-pq text-texto2">O modo pré-jogo libera 4 h antes da partida.</p>
        )}
        {pos && !registrado && (
          <ButtonLink href="/jogo/pos" className="w-full">
            <CalendarCheck className="size-5" aria-hidden="true" />
            Como foi o jogo?
          </ButtonLink>
        )}
        {pos && registrado && (
          <p className="t-corpo flex items-center gap-2 text-ok-t">
            <CheckCircle2 className="size-5" aria-hidden="true" />
            Jogo registrado
          </p>
        )}
      </div>
    </GlassCard>
  );
}
