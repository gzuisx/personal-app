"use client";

import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Clock, Trophy } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { SessaoSheet } from "@/components/features/sessao-sheet";
import { StatusBloco } from "@/components/features/status-bloco";
import { TagChip } from "@/components/features/tag-chip";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { MidiaPlaceholder } from "@/components/ui/midia-placeholder";
import { SkeletonTela } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { rotuloCarga } from "@/lib/carga";
import { sessaoDoBloco } from "@/lib/derivados";
import { avaliarSeguranca } from "@/lib/safety";
import {
  ROTULO_PERIODO,
  blocoTreinavel,
  diaDoPlano,
  type Bloco,
  type ExercicioNoBloco,
} from "@/lib/seed/plano";
import { dataExtensoISO, dataISO, horaTexto } from "@/lib/tempo";
import { useAgora } from "@/lib/use-agora";

function Exercicio({ e }: { e: ExercicioNoBloco }) {
  const [aberto, setAberto] = useState(false);
  const carga = e.series ? `${e.series} x ${e.repeticoes}` : e.repeticoes;
  const dica = e.observacao ?? e.observacoes;

  return (
    <li className="rounded-2xl border border-borda bg-vidro">
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="t-h3 block leading-snug">{e.nome}</span>
          <span className="t-corpo num text-realce-t">{carga}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-texto2 transition-transform duration-200",
            aberto && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-4 pb-4">
              {dica && <p className="t-corpo text-texto2">{dica}</p>}
              <MidiaPlaceholder mediaUrl={e.mediaUrl} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function DetalheDiaPage() {
  const { dia: iso } = useParams<{ dia: string }>();
  const agora = useAgora();
  const { status, dados } = useDados();
  const [sheetAberto, setSheetAberto] = useState(false);
  const [blocoSheet, setBlocoSheet] = useState<Bloco | null>(null);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(Date.parse(iso))) notFound();

  if (!agora || status === "carregando") {
    return (
      <main className="pagina">
        <SkeletonTela />
      </main>
    );
  }

  const hoje = dataISO(agora);
  const dia = diaDoPlano(iso);
  const seg = avaliarSeguranca({
    checkins: dados.checkins,
    jogos: dados.jogos,
    hoje,
    agora,
    config: dados.seguranca,
  });

  function abrir(b: Bloco) {
    setBlocoSheet(b);
    setSheetAberto(true);
  }

  return (
    <main className="pagina space-y-4">
      <Header voltarPara="/semana" titulo={dia.titulo} sobretitulo={dataExtensoISO(iso)} />
      <p className="t-rotulo inline-flex rounded-full border border-borda bg-vidro-forte px-4 py-2 text-texto2">
        Carga: {rotuloCarga(iso)}
      </p>
      {!seg.podeProgredir && seg.nivel !== "sem_dados" && iso >= hoje && (
        <p className="t-corpo rounded-2xl border border-aviso/60 bg-vidro-forte p-3 text-aviso-t">
          Não aumente a carga hoje. Mantenha séries e repetições iguais às últimas sessões.
        </p>
      )}

      {dia.blocos.map((b, i) => {
        const sessao = sessaoDoBloco(dados.sessoes, iso, b.id);
        return (
          <GlassCard key={b.id} indice={i}>
            <p className="t-rotulo text-texto2">
              {ROTULO_PERIODO[b.periodo]}
              {b.horario ? ` · ${b.horario}` : ""}
            </p>
            <h2 className="t-h2 mt-0.5">{b.instrutor ? "Sessão do instrutor" : b.titulo}</h2>
            {b.instrutor && <p className="t-corpo text-texto2">{b.titulo}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {b.duracaoMin > 0 && (
                <span className="t-pq inline-flex items-center gap-1 text-texto2">
                  <Clock className="size-4" aria-hidden="true" />
                  {b.duracaoMin} min
                </span>
              )}
              {b.tags.map((t) => (
                <TagChip key={t} tag={t} />
              ))}
            </div>
            {b.observacao && <p className="t-corpo mt-3 text-texto2">{b.observacao}</p>}

            {b.tags.includes("Jogo") && dia.jogo && (
              <p className="t-h3 mt-3 flex items-center gap-2 text-aviso-t">
                <Trophy className="size-5" aria-hidden="true" />
                Jogo às {horaTexto(dia.jogo.hora, dia.jogo.min)}
              </p>
            )}

            {b.exercicios.length > 0 && (
              <ul className="mt-4 space-y-2">
                {b.exercicios.map((e) => (
                  <Exercicio key={`${b.id}-${e.slug}`} e={e} />
                ))}
              </ul>
            )}

            {blocoTreinavel(b) && (
              <div className="mt-4 flex items-center gap-3">
                {sessao ? (
                  <StatusBloco sessao={sessao} nome={b.titulo} onClick={() => abrir(b)} />
                ) : (
                  <Button className="w-full" onClick={() => abrir(b)}>
                    Marcar bloco como feito
                  </Button>
                )}
                {sessao?.notas && <p className="t-pq min-w-0 flex-1 text-texto2">{sessao.notas}</p>}
              </div>
            )}
          </GlassCard>
        );
      })}

      {blocoSheet && (
        <SessaoSheet
          aberto={sheetAberto}
          onFechar={() => setSheetAberto(false)}
          data={iso}
          bloco={blocoSheet}
          inicial={sessaoDoBloco(dados.sessoes, iso, blocoSheet.id)}
          resultadoPadrao="feito"
        />
      )}
    </main>
  );
}
