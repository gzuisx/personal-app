"use client";

import { Activity, Dumbbell, Moon } from "lucide-react";
import { MetricTile } from "@/components/ui/metric-tile";
import { cargaSemanal, tendenciaDor, ultimoCheckin } from "@/lib/derivados";
import { diffDias } from "@/lib/tempo";
import { SONO_ROTULO, type Checkin, type Sessao } from "@/lib/tipos";

function quando(dias: number) {
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

export function MetricasHoje({ checkins, sessoes, hoje }: { checkins: Checkin[]; sessoes: Sessao[]; hoje: string }) {
  const ultimo = ultimoCheckin(checkins, hoje);
  const comSono = [...checkins]
    .filter((c) => c.data <= hoje && c.sonoFaixa)
    .sort((a, b) => b.data.localeCompare(a.data))[0];
  const carga = cargaSemanal(sessoes, hoje);

  return (
    <div className="flex gap-3">
      <MetricTile
        icone={<Activity className="size-5" />}
        rotulo="Dor"
        valor={ultimo ? ultimo.dor : null}
        unidade="/10"
        tendencia={tendenciaDor(checkins, hoje)}
        legenda={ultimo ? quando(diffDias(ultimo.data, hoje)) : undefined}
      />
      <MetricTile
        icone={<Moon className="size-5" />}
        rotulo="Sono"
        valor={null}
        texto={comSono?.sonoFaixa ? SONO_ROTULO[comSono.sonoFaixa] : undefined}
        legenda={comSono ? quando(diffDias(comSono.data, hoje)) : undefined}
      />
      <MetricTile
        icone={<Dumbbell className="size-5" />}
        rotulo="Carga"
        valor={carga}
        casas={1}
        unidade="/10"
        legenda="média 7 dias"
      />
    </div>
  );
}
