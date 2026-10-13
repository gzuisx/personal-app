"use client";

import { useState } from "react";
import { GitCompare } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { GraficoLinha, corDaSerie } from "@/components/features/graficos";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import {
  emPlato,
  exerciciosRegistrados,
  fraseDaComparacao,
  parSugerido,
  recordes,
  sessoesDoExercicio,
  statusDaComparacao,
  statusDoGrafico,
  type SessaoDeExercicio,
} from "@/lib/evolucao/exercicios";
import { CATALOGO_POR_ID } from "@/lib/seed/catalogo";

const fmt = (v: number | null, un = "") =>
  v === null ? "sem registro" : `${String(v).replace(".", ",")}${un}`;
const dataBR = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;
const nome = (slug: string) => CATALOGO_POR_ID[slug]?.nome ?? slug;

const LINHAS = [
  { chave: "carga", rotulo: "Carga (kg)", campo: "cargaMaxKg" },
  { chave: "reps", rotulo: "Repetições", campo: "repsMax" },
  { chave: "tempo", rotulo: "Tempo (s)", campo: "duracaoMaxS" },
] as const;

function Coluna({ s }: { s: SessaoDeExercicio }) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl border border-borda bg-vidro p-3">
      <p className="t-h3">{dataBR(s.data)}</p>
      <ul className="t-pq mt-1 space-y-0.5 text-texto2">
        <li>Séries: {s.series}</li>
        <li>Repetições: {fmt(s.repsMax)}</li>
        <li>Carga: {fmt(s.cargaMaxKg, " kg")}</li>
        <li>Tempo: {fmt(s.duracaoMaxS, " s")}</li>
        <li>
          Esforço:{" "}
          {s.esforcoMedio === null
            ? "sem registro"
            : s.esforcoMedio < 1.6
              ? "fácil"
              : s.esforcoMedio < 2.4
                ? "ok"
                : "duro"}
        </li>
        <li>Dor durante: {fmt(s.dorMax)}</li>
      </ul>
    </div>
  );
}

export function AbaForca({ hoje }: { hoje: string }) {
  const { dados } = useDados();
  const lista = exerciciosRegistrados(dados.series);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [comparar, setComparar] = useState(false);
  const [indices, setIndices] = useState<[number, number] | null>(null);

  if (!lista.length) {
    return (
      <GlassCard indice={1}>
        <EmptyState
          titulo="Ainda sem séries registradas"
          texto="Faça um treino guiado e cada série entra aqui, com carga, repetições e esforço."
        />
      </GlassCard>
    );
  }

  const slug = escolhido ?? lista[0].slug;
  const sessoes = sessoesDoExercicio(dados.series, slug);
  const rec = recordes(sessoes);
  const grafico = statusDoGrafico(sessoes);
  const comp = statusDaComparacao(sessoes);
  const linhas = LINHAS.filter((l) => sessoes.some((s) => s[l.campo] !== null));
  const par = indices ? ([sessoes[indices[0]], sessoes[indices[1]]] as const) : parSugerido(sessoes);

  return (
    <>
      <GlassCard indice={1} titulo="Exercício">
        <label className="block">
          <span className="sr-only">Escolher exercício</span>
          <select
            value={slug}
            onChange={(e) => {
              setEscolhido(e.target.value);
              setIndices(null);
            }}
            className="block h-12 w-full rounded-2xl border border-borda bg-vidro-forte px-3 text-texto"
          >
            {lista.map((e) => (
              <option key={e.slug} value={e.slug}>
                {nome(e.slug)} ({e.sessoes} {e.sessoes === 1 ? "sessão" : "sessões"})
              </option>
            ))}
          </select>
        </label>
        <p className="t-pq mt-2 text-texto2">
          Só séries registradas no treino guiado. Nada é inferido do plano.
        </p>
      </GlassCard>

      <GlassCard indice={2} titulo={nome(slug)}>
        {grafico.pode ? (
          <GraficoLinha
            descricao={`Evolução de ${nome(slug)} por sessão`}
            series={linhas.slice(0, 2).map((l, k) => ({
              chave: l.chave,
              rotulo: l.rotulo,
              cor: corDaSerie(k),
              pontos: sessoes
                .filter((s) => s[l.campo] !== null)
                .map((s) => ({ iso: s.data, valor: s[l.campo] as number })),
            }))}
          />
        ) : (
          <p className="t-corpo text-texto2">{grafico.texto}</p>
        )}
        {grafico.pode && (
          <ul className="t-pq mt-1 flex gap-3 text-texto2">
            {linhas.slice(0, 2).map((l, k) => (
              <li key={l.chave} className="flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className="inline-block size-2.5 rounded-full"
                  style={{ background: corDaSerie(k) }}
                />
                {l.rotulo}
              </li>
            ))}
          </ul>
        )}
        <h3 className="t-rotulo mt-4 mb-1 text-texto2">Recordes pessoais</h3>
        <ul className="t-corpo">
          <li>Maior carga: {fmt(rec.cargaKg, " kg")}</li>
          <li>Mais repetições: {fmt(rec.reps)}</li>
          {rec.duracaoS !== null && <li>Maior tempo: {fmt(rec.duracaoS, " s")}</li>}
          {rec.volume !== null && <li>Maior volume: {fmt(Math.round(rec.volume), " kg")}</li>}
        </ul>
        {emPlato(sessoes, hoje) && (
          <p className="t-corpo mt-2 text-aviso-t">
            Parece que a carga parou há 4 semanas ou mais. Veja a progressão sugerida no treino.
          </p>
        )}
        <Button className="mt-3" variante="secundario" onClick={() => setComparar(true)}>
          <GitCompare className="size-4" aria-hidden="true" /> Comparar sessões
        </Button>
      </GlassCard>

      <BottomSheet aberto={comparar} onFechar={() => setComparar(false)} titulo="Comparar sessões">
        {!comp.pode || !par ? (
          <p className="t-corpo">{comp.pode ? "Sem sessões para comparar." : comp.texto}</p>
        ) : (
          <div className="space-y-4">
            <p className="t-corpo text-texto2">
              {nome(slug)}. Escolha duas sessões ou use a sugestão (a última e a de cerca de 4 semanas antes).
            </p>
            <section>
              <p className="t-rotulo mb-2 text-texto2">Antes</p>
              <ChipGroup
                rotuloAria="Sessão anterior"
                opcoes={sessoes.map((s, i) => ({ valor: i, rotulo: dataBR(s.data) }))}
                valor={sessoes.indexOf(par[0])}
                onChange={(i) => setIndices([i, indices?.[1] ?? sessoes.indexOf(par[1])])}
              />
            </section>
            <section>
              <p className="t-rotulo mb-2 text-texto2">Depois</p>
              <ChipGroup
                rotuloAria="Sessão posterior"
                opcoes={sessoes.map((s, i) => ({ valor: i, rotulo: dataBR(s.data) }))}
                valor={sessoes.indexOf(par[1])}
                onChange={(i) => setIndices([indices?.[0] ?? sessoes.indexOf(par[0]), i])}
              />
            </section>
            <div className="flex gap-2">
              <Coluna s={par[0]} />
              <Coluna s={par[1]} />
            </div>
            <p className="t-h3" data-testid="frase-comparacao">
              {par[0].data <= par[1].data
                ? fraseDaComparacao(par[0], par[1])
                : fraseDaComparacao(par[1], par[0])}
            </p>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
