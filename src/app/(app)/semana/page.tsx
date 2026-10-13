"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { DiaCard, diaConcluido } from "@/components/features/dia-card";
import { Button } from "@/components/ui/button";
import { DayStrip, type DiaFaixa } from "@/components/ui/day-strip";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { SkeletonTela } from "@/components/ui/skeleton";
import { rotuloCarga } from "@/lib/carga";
import { faseDoPlano } from "@/lib/seed/fase";
import { diaDoPlano } from "@/lib/seed/plano";
import { DIAS_SEMANA, addDias, dataISO, diasDaSemana } from "@/lib/tempo";
import { useAgora } from "@/lib/use-agora";

const LETRAS = ["S", "T", "Q", "Q", "S", "S", "D"];

export default function SemanaPage() {
  const agora = useAgora();
  const { status, erro, recarregar, dados } = useDados();
  const [offset, setOffset] = useState(0);
  const [selecionado, setSelecionado] = useState<string | null>(null);

  if (!agora || status === "carregando") {
    return (
      <main className="pagina">
        <SkeletonTela />
      </main>
    );
  }
  if (status === "erro") {
    return (
      <main className="pagina">
        <EmptyState
          titulo="Não deu para carregar"
          texto={erro ?? undefined}
          acao={<Button onClick={recarregar}>Tentar de novo</Button>}
        />
      </main>
    );
  }

  const hoje = dataISO(agora);
  const dias = diasDaSemana(addDias(hoje, offset * 7));
  const planos = dias.map(diaDoPlano);
  const fase = faseDoPlano(dias[0] > hoje ? dias[0] : dias[6] < hoje ? dias[6] : hoje);
  const titulo = offset === 0 ? "Esta semana" : offset === -1 ? "Semana passada" : offset === 1 ? "Próxima semana" : `${dias[0].slice(8)}/${dias[0].slice(5, 7)} a ${dias[6].slice(8)}/${dias[6].slice(5, 7)}`;

  const faixa: DiaFaixa[] = planos.map((p, i) => ({
    iso: p.iso,
    letra: LETRAS[i],
    numero: Number(p.iso.slice(8)),
    rotuloAria: `${DIAS_SEMANA[p.diaSemana]}, ${Number(p.iso.slice(8))}`,
    hoje: p.iso === hoje,
    selecionado: p.iso === (selecionado ?? (offset === 0 ? hoje : dias[0])),
    jogo: !!p.jogo,
    feito: diaConcluido(p, dados.sessoes, hoje),
  }));

  function selecionar(iso: string) {
    setSelecionado(iso);
    document.getElementById(`dia-${iso}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <main className="pagina space-y-4">
      <Header
        titulo="Semana"
        sobretitulo={titulo}
        acao={
          <div className="flex gap-1">
            <Button
              variante="secundario"
              className="size-11 !min-w-11 !px-0"
              aria-label="Semana anterior"
              onClick={() => {
                setOffset((o) => o - 1);
                setSelecionado(null);
              }}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </Button>
            <Button
              variante="secundario"
              className="size-11 !min-w-11 !px-0"
              aria-label="Próxima semana"
              onClick={() => {
                setOffset((o) => o + 1);
                setSelecionado(null);
              }}
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </Button>
          </div>
        }
      />

      <DayStrip dias={faixa} onSelect={selecionar} />

      <p className="t-rotulo inline-flex rounded-full border border-borda bg-vidro-forte px-4 py-2 text-texto2">
        Tornozelo: fase {fase.fase} ·{" "}
        {fase.semanasNaFase ? `semana ${fase.semanaNaFase} de ${fase.semanasNaFase}` : `semana ${fase.semanaNaFase}`}
      </p>

      <div className="space-y-3">
        {planos.map((p, i) => (
          <DiaCard
            key={p.iso}
            dia={p}
            hoje={hoje}
            rotuloCarga={rotuloCarga(p.iso)}
            sessoes={dados.sessoes}
            indice={i}
          />
        ))}
      </div>

      <GlassCard variante="leve" titulo="Condução de bola e visão de jogo">
        <p className="t-corpo text-texto2">
          A condução de bola treina no funcional com bola, de segunda e sexta. A visão de jogo vem do scan
          antes de receber a bola e do estudo de movimento sem bola.
        </p>
      </GlassCard>
    </main>
  );
}
