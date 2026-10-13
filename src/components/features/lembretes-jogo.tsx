"use client";

import { X } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { useDispensados } from "@/lib/dispensados";
import {
  lembretesPreJogo,
  posJogoDisponivel,
  proximoJogo,
  ultimoJogo,
  dataISO,
  type Lembrete,
} from "@/lib/tempo";

/** Gatilhos de pré e pós-jogo da seção 11: aparecem por horário e podem ser dispensados no dia. */
export function LembretesJogo({ agora, indice }: { agora: Date; indice?: number }) {
  const hoje = dataISO(agora);
  const { dispensar, dispensado } = useDispensados(hoje);

  const itens: Lembrete[] = [];
  const prox = proximoJogo(agora);
  if (prox.data === hoje) itens.push(...lembretesPreJogo(agora, prox));
  const ult = ultimoJogo(agora);
  if (ult && posJogoDisponivel(agora, ult)) {
    itens.push({
      id: `pos-${ult.data}`,
      hora: "",
      titulo: "Depois do jogo",
      texto: "Coma proteína e carboidrato em até 1 a 2 horas.",
    });
  }

  const visiveis = itens.filter((i) => !dispensado(i.id));
  if (!visiveis.length) return null;

  return (
    <GlassCard indice={indice} variante="leve" titulo="Lembretes do jogo">
      <ul className="space-y-3">
        {visiveis.map((i) => (
          <li key={i.id} className="flex items-start gap-3 rounded-2xl bg-vidro-forte p-3">
            <div className="min-w-0 flex-1">
              <p className="t-h3">
                {i.hora && <span className="num mr-2 text-realce-t">{i.hora}</span>}
                {i.titulo}
              </p>
              <p className="t-corpo text-texto2">{i.texto}</p>
            </div>
            <button
              type="button"
              onClick={() => dispensar(i.id)}
              aria-label={`Dispensar lembrete: ${i.titulo}`}
              className="-m-1 flex size-11 shrink-0 items-center justify-center rounded-full text-texto2"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
