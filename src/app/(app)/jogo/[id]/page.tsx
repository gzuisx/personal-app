"use client";

import { excecoesParaJogos } from "@/lib/coach/agenda";
import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { Check, Circle, Minus } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { CheckinSheet } from "@/components/features/checkin-sheet";
import { GameCard } from "@/components/features/game-card";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { SkeletonTela } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { estadoDoJogo, ocorrenciaDaData } from "@/lib/jogo";
import { addDias, dataExtensoISO, dataISO, horaTexto } from "@/lib/tempo";
import { GATILHO_ROTULO, SONO_ROTULO } from "@/lib/tipos";
import { useAgora } from "@/lib/use-agora";

type Item = { titulo: string; texto: string; estado: "feito" | "falta" | "nada" };

export default function JogoPage() {
  const { id } = useParams<{ id: string }>();
  const agora = useAgora();
  const { status, dados } = useDados();
  const [checkinAberto, setCheckinAberto] = useState(false);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(id)) notFound();

  if (!agora || status === "carregando") {
    return (
      <main className="pagina">
        <SkeletonTela />
      </main>
    );
  }

  const ocorrencia = ocorrenciaDaData(id, dados.jogos, excecoesParaJogos(dados.excecoes));
  if (!ocorrencia) {
    return (
      <main className="pagina">
        <Header voltarPara="/semana" titulo="Jogo" />
        <EmptyState titulo="Sem jogo nessa data" texto="Não há jogo previsto para este dia." />
      </main>
    );
  }

  const estado = estadoDoJogo(agora, ocorrencia, dados);
  const hoje = dataISO(agora);
  const { registro, preLog, checkinSeguinte } = estado;
  const seguinte = addDias(estado.data, 1);
  const checkinPendente = estado.passos[2].estado === "ativo";

  const itens: Item[] = [
    preLog
      ? {
          titulo: "Aquecimento",
          texto: `${preLog.concluido ? "Completo" : `Parcial (${preLog.fasesConcluidas} de 5 fases)`} · ${Math.round(preLog.duracaoS / 60)} min`,
          estado: preLog.concluido ? "feito" : "falta",
        }
      : { titulo: "Aquecimento", texto: "Sem registro", estado: "nada" },
    {
      titulo: "Tornozeleira",
      texto:
        preLog?.tornozeleira === true ? "Usou" : preLog?.tornozeleira === false ? "Não usou" : "Sem registro",
      estado: preLog?.tornozeleira == null ? "nada" : "feito",
    },
    registro && registro.dor !== null
      ? {
          titulo: "Resultado do jogo",
          texto: `${registro.minutosJogados ?? "—"} min · esforço ${registro.esforco ?? "—"} de 10 · dor depois ${registro.dor} de 10${registro.gatilho ? ` · gatilho: ${GATILHO_ROTULO[registro.gatilho].toLowerCase()}` : ""}`,
          estado: "feito",
        }
      : { titulo: "Resultado do jogo", texto: "Ainda não registrado", estado: "falta" },
    checkinSeguinte
      ? {
          titulo: "Dia seguinte",
          texto: `Dor ${registro?.dor ?? "—"} → ${checkinSeguinte.dor}${checkinSeguinte.inchaco ? " · com inchaço" : ""}`,
          estado: "feito",
        }
      : { titulo: "Dia seguinte", texto: "Check-in ainda não feito", estado: "falta" },
    {
      titulo: "Sono da noite do jogo",
      texto: checkinSeguinte?.sonoFaixa ? SONO_ROTULO[checkinSeguinte.sonoFaixa] : "Sem registro",
      estado: checkinSeguinte?.sonoFaixa ? "feito" : "nada",
    },
    {
      titulo: "Nota",
      texto: registro?.notas ?? "Sem nota",
      estado: registro?.notas ? "feito" : "nada",
    },
  ];

  return (
    <main className="pagina space-y-4">
      <Header
        voltarPara="/hoje"
        titulo={`Jogo de ${ocorrencia.slot.nome.toLowerCase()}`}
        sobretitulo={`${dataExtensoISO(estado.data)} · ${horaTexto(ocorrencia.slot.hora, ocorrencia.slot.min)}`}
      />

      <GameCard estado={estado} agora={agora} naPagina onCheckinSeguinte={() => setCheckinAberto(true)} />

      <GlassCard titulo="Linha do tempo" indice={1}>
        <ol className="space-y-3">
          {itens.map((i) => (
            <li key={i.titulo} className="flex gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                  i.estado === "feito" && "border-ok bg-ok text-sobre",
                  i.estado === "falta" && "border-aviso-t text-aviso-t",
                  i.estado === "nada" && "border-borda text-texto3",
                )}
                aria-hidden="true"
              >
                {i.estado === "feito" ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : i.estado === "falta" ? (
                  <Circle className="size-3" />
                ) : (
                  <Minus className="size-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="t-h3">{i.titulo}</p>
                <p className="t-corpo text-texto2">{i.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </GlassCard>

      <CheckinSheet
        aberto={checkinAberto}
        onFechar={() => setCheckinAberto(false)}
        data={checkinPendente ? seguinte : hoje}
        existente={checkinSeguinte}
        contexto={registro?.dor != null ? `Dor depois do jogo: ${registro.dor}` : undefined}
      />
    </main>
  );
}
