"use client";

import { Check, ChevronRight, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { IconeBola } from "@/components/ui/icone-bola";
import { cn } from "@/lib/cn";
import { estadoDoJogo, ocorrenciaDaData, type DadosDoJogo, type EstadoPasso } from "@/lib/jogo";
import { hrefDoJogo } from "@/lib/rotas";
import { dataISO } from "@/lib/tempo";
import { horaTexto } from "@/lib/tempo";

const rotuloEstado: Record<EstadoPasso, string> = {
  bloqueado: "em breve",
  pendente: "em breve",
  ativo: "agora",
  concluido: "feito",
  expirado: "sem registro",
};

/** Cartão próprio do jogo na Semana: horário, aquecimento e refeição previstos, e as 3 etapas. */
export function JogoDiaCard({
  data,
  agora,
  dados,
  indice,
}: {
  data: string;
  agora: Date;
  dados: DadosDoJogo;
  indice?: number;
}) {
  const ocorrencia = ocorrenciaDaData(data, dados.jogos);
  if (!ocorrencia) return null;
  const estado = estadoDoJogo(agora, ocorrencia, dados);
  const l = ocorrencia.slot.lembretes;
  const hoje = dataISO(agora);
  const passou = data < hoje;

  return (
    <GlassCard
      href={hrefDoJogo(data)}
      indice={indice}
      variante="destaque"
      aria-label={`Jogo de ${ocorrencia.slot.nome.toLowerCase()} às ${horaTexto(ocorrencia.slot.hora, ocorrencia.slot.min)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="t-rotulo flex items-center gap-2 text-aviso-t">
            <IconeBola className="size-5" />
            Jogo · {ocorrencia.slot.nome}
          </p>
          <p className="t-h2 mt-1 flex items-center gap-2">
            <Clock className="size-5 text-texto2" aria-hidden="true" />
            {horaTexto(ocorrencia.slot.hora, ocorrencia.slot.min)}
          </p>
        </div>
        <ChevronRight className="mt-1 size-5 shrink-0 text-texto3" aria-hidden="true" />
      </div>
      <p className="t-corpo mt-2 text-texto2">
        Refeição às {l.refeicao} · aquecimento em campo às {l.aquecimento}
      </p>
      {(passou || data === hoje) && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {estado.passos.map((p, i) => (
            <li
              key={p.id}
              className={cn(
                "t-pq inline-flex items-center gap-1 rounded-full border px-3 py-1",
                p.estado === "concluido" ? "border-ok-t/60 text-ok-t" : "border-borda text-texto2",
              )}
            >
              {p.estado === "concluido" && <Check className="size-3.5" aria-hidden="true" />}
              {i + 1}. {["Antes", "Depois", "Dia seguinte"][i]}: {rotuloEstado[p.estado]}
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
