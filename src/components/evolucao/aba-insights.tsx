"use client";

import { useMemo, useState } from "react";
import { HelpCircle } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { calcularInsights, MIN_OBSERVACOES, type Insight } from "@/lib/coach/insights";

function Barras({ i }: { i: Insight }) {
  if (!i.barras?.length) return null;
  const max = Math.max(...i.barras.map((b) => Math.abs(b.valor)), 1);
  return (
    <ul className="mt-3 space-y-1.5" aria-label={`Gráfico: ${i.titulo}`}>
      {i.barras.map((b) => (
        <li key={b.rotulo} className="flex items-center gap-2">
          <span className="t-pq w-24 shrink-0 truncate capitalize text-texto2">{b.rotulo}</span>
          <span className="h-3 flex-1 overflow-hidden rounded-full bg-vidro">
            <span
              className="block h-full rounded-full bg-primario"
              style={{ width: `${(Math.abs(b.valor) / max) * 100}%` }}
            />
          </span>
          <span className="t-pq num w-10 shrink-0 text-right">{String(b.valor).replace(".", ",")}</span>
        </li>
      ))}
      {i.unidadeBarras && <li className="t-pq text-texto2">{i.unidadeBarras}</li>}
    </ul>
  );
}

export function AbaInsights({ hoje }: { hoje: string }) {
  const { dados } = useDados();
  const [aberto, setAberto] = useState<Insight | null>(null);
  const insights = useMemo(() => calcularInsights(dados, hoje), [dados, hoje]);
  const prontos = insights.filter((i) => i.disponivel);
  const aguardando = insights.filter((i) => !i.disponivel);

  return (
    <>
      <GlassCard indice={1} variante="leve">
        <p className="t-corpo text-texto2">
          Os insights só aparecem com pelo menos {MIN_OBSERVACOES} registros (ou 4 semanas) e mostram quantos
          registros usaram. Dizem &ldquo;parece que&rdquo;, nunca &ldquo;causa&rdquo;.
        </p>
      </GlassCard>

      {prontos.map((i, k) => (
        <GlassCard key={i.id} indice={2 + k} titulo={`${i.id} · ${i.titulo}`}>
          <p className="t-corpo">{i.frase}</p>
          <p className="t-pq mt-1 text-texto2">Com base em {i.n} registros.</p>
          <Barras i={i} />
          <Button className="mt-3" variante="secundario" onClick={() => setAberto(i)}>
            <HelpCircle className="size-4" aria-hidden="true" /> Por que?
          </Button>
        </GlassCard>
      ))}

      {aguardando.length > 0 && (
        <GlassCard indice={2 + prontos.length} titulo="Ainda sem dados suficientes">
          <ul className="space-y-3">
            {aguardando.map((i) => (
              <li key={i.id}>
                <p className="t-corpo">
                  {i.id} · {i.titulo}
                </p>
                <p className="t-pq text-texto2">
                  {i.n} {i.n === 1 ? "registro" : "registros"}. {i.falta}
                </p>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <BottomSheet aberto={!!aberto} onFechar={() => setAberto(null)} titulo="Por que este insight?">
        {aberto && (
          <div className="space-y-3">
            <p className="t-h3">{aberto.titulo}</p>
            <p className="t-corpo">Com base em {aberto.n} registros.</p>
            <ul className="t-corpo list-inside list-disc text-texto2">
              {aberto.porque.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="t-pq text-texto2">Correlação não é causa: use como pista, não como regra.</p>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
