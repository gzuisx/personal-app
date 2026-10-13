"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ChipGroupMulti } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
import {
  CATEGORIAS_CARGA,
  itensDeCarga,
  janelasDeCarga,
  somaCarga,
  variacaoDeCarga,
  type CategoriaCarga,
} from "@/lib/coach/carga";
import { getDiaResumo } from "@/lib/evolucao/dia";
import { DIAS_SEMANA, addDias, dataExtensoISO, inicioSemana } from "@/lib/tempo";
import { SONO_ROTULO } from "@/lib/tipos";

const COR: Record<CategoriaCarga, string> = {
  Funcional: "var(--accent)",
  Força: "var(--primary-hover)",
  Velocidade: "var(--warning)",
  Tornozelo: "var(--success)",
  Mobilidade: "var(--text-3)",
  Jogo: "var(--danger)",
  Outros: "var(--text-3)",
};
const dataBR = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;
const num = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function AbaCarga({ hoje }: { hoje: string }) {
  const { dados } = useDados();
  const [offset, setOffset] = useState(0);
  const [filtros, setFiltros] = useState<CategoriaCarga[]>([...CATEGORIAS_CARGA]);
  const [dia, setDia] = useState<string | null>(null);
  const [formula, setFormula] = useState(false);

  const segunda = addDias(inicioSemana(hoje), offset * 7);
  const dias = Array.from({ length: 7 }, (_, i) => addDias(segunda, i));
  const itens = itensDeCarga(dados.sessoes, dados.jogos, dias[0], dias[6]);
  const porDia = dias.map((d) => {
    const doDia = itens.filter((i) => i.data === d);
    const partes = CATEGORIAS_CARGA.filter((c) => filtros.includes(c)).map((c) => ({
      categoria: c,
      valor: doDia.filter((i) => i.categoria === c).reduce((s, i) => s + (i.carga ?? 0), 0),
    }));
    return { d, partes, total: partes.reduce((s, p) => s + p.valor, 0), registros: doDia.length };
  });
  const maximo = Math.max(1, ...porDia.map((p) => p.total));
  const v = variacaoDeCarga(dados.sessoes, dados.jogos, hoje);
  const resumoDia = dia ? getDiaResumo(dia, dados, hoje) : null;

  return (
    <>
      <GlassCard
        indice={1}
        titulo="Carga da semana"
        acao={
          <div className="flex gap-1">
            <Button
              variante="secundario"
              className="size-11 !min-w-11 !px-0"
              aria-label="Semana anterior"
              onClick={() => setOffset((o) => o - 1)}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </Button>
            <Button
              variante="secundario"
              className="size-11 !min-w-11 !px-0"
              aria-label="Próxima semana"
              disabled={offset >= 0}
              onClick={() => setOffset((o) => o + 1)}
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </Button>
          </div>
        }
      >
        <p className="t-pq mb-2 text-texto2">
          {dataBR(dias[0])} a {dataBR(dias[6])} · carga = esforço x minutos
        </p>
        <ChipGroupMulti
          rotuloAria="Tipos de carga"
          opcoes={CATEGORIAS_CARGA.map((c) => ({ valor: c, rotulo: c }))}
          valores={filtros}
          onChange={setFiltros}
        />
        <div className="mt-4 flex h-44 items-end gap-2" role="group" aria-label="Carga por dia">
          {porDia.map((p, i) => (
            <button
              key={p.d}
              type="button"
              onClick={() => setDia(p.d)}
              aria-label={`${DIAS_SEMANA[(i + 1) % 7]}, ${dataBR(p.d)}: ${p.registros ? `carga ${num(p.total)}` : "sem registro"}. Toque para ver o que compôs o dia.`}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              <span className="t-pq num text-texto2">{p.registros ? num(p.total) : "—"}</span>
              <span
                className="flex w-full flex-col-reverse overflow-hidden rounded-lg bg-vidro"
                style={{ height: `${(p.total / maximo) * 100}%`, minHeight: p.total ? 6 : 2 }}
              >
                {p.partes
                  .filter((x) => x.valor > 0)
                  .map((x) => (
                    <span
                      key={x.categoria}
                      style={{ height: `${(x.valor / p.total) * 100}%`, background: COR[x.categoria] }}
                    />
                  ))}
              </span>
              <span className="t-pq text-texto2">{DIAS_SEMANA[(i + 1) % 7].slice(0, 3)}</span>
            </button>
          ))}
        </div>
        <ul className="t-pq mt-3 flex flex-wrap gap-x-3 gap-y-1 text-texto2">
          {CATEGORIAS_CARGA.map((c) => (
            <li key={c} className="flex items-center gap-1">
              <span
                aria-hidden="true"
                className="inline-block size-2.5 rounded-full"
                style={{ background: COR[c] }}
              />
              {c}
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard indice={2} titulo="Esta semana x as 4 anteriores">
        <p className="t-h2 num">{num(v.atual)}</p>
        <p className="t-corpo text-texto2">
          {v.referencia !== null
            ? `Média das semanas anteriores: ${num(v.referencia)}${v.variacao !== null ? ` · ${v.variacao >= 1 ? "+" : ""}${Math.round((v.variacao - 1) * 100)}%` : ""}`
            : "Sem semanas anteriores com registro."}
        </p>
        {!v.suficiente && (
          <p className="t-pq mt-1 text-texto2">
            Precisa de pelo menos 3 semanas de histórico para comparar e alertar (
            {v.semanasDeReferenciaComDados} de 3).
          </p>
        )}
        {v.alerta === "amarelo" && (
          <p className="t-corpo mt-2 text-aviso-t">
            A carga subiu mais de 30% sobre a média. Atenção ao descanso.
          </p>
        )}
        {v.alerta === "vermelho" && (
          <p className="t-corpo mt-2 text-perigo-t">
            A carga subiu mais de 50% sobre a média. Considere uma semana mais leve.
          </p>
        )}
        <Button className="mt-3" variante="secundario" onClick={() => setFormula(true)}>
          <Info className="size-4" aria-hidden="true" /> Como calculamos
        </Button>
      </GlassCard>

      <BottomSheet aberto={!!resumoDia} onFechar={() => setDia(null)} titulo="O que compôs o dia">
        {resumoDia && (
          <div className="space-y-4">
            <p className="t-h3">{dataExtensoISO(resumoDia.data)}</p>
            {resumoDia.carga.length === 0 ? (
              <p className="t-corpo text-texto2">Sem registro de treino ou jogo neste dia.</p>
            ) : (
              <ul className="space-y-2">
                {resumoDia.carga.map((i) => (
                  <li key={i.id} className="rounded-2xl border border-borda bg-vidro p-3">
                    <p className="t-corpo">
                      {i.titulo} <span className="t-pq text-texto2">({i.categoria})</span>
                    </p>
                    <p className="t-pq text-texto2">
                      {i.duracaoMin ?? "sem duração"} min · esforço {i.esforco ?? "sem registro"} ·{" "}
                      {i.carga !== null
                        ? `carga ${i.esforco} x ${i.duracaoMin} = ${num(i.carga)}`
                        : "sem carga (falta esforço ou duração)"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <p className="t-corpo">Total do dia: {num(resumoDia.cargaTotal)}</p>
            <section>
              <h3 className="t-rotulo mb-1 text-texto2">Sono e dor do dia</h3>
              <p className="t-corpo">
                Sono:{" "}
                {resumoDia.checkin?.sonoFaixa ? SONO_ROTULO[resumoDia.checkin.sonoFaixa] : "sem registro"}
              </p>
              <p className="t-corpo">
                Dor no check-in: {resumoDia.checkin ? `${resumoDia.checkin.dor} de 10` : "sem registro"}
              </p>
              {resumoDia.jogo && (
                <p className="t-corpo">Dor depois do jogo: {resumoDia.jogo.dor ?? "sem registro"}</p>
              )}
            </section>
          </div>
        )}
      </BottomSheet>

      <BottomSheet aberto={formula} onFechar={() => setFormula(false)} titulo="Como calculamos">
        <div className="space-y-3">
          <p className="t-corpo">
            Carga de uma sessão ou jogo = <strong>esforço (0 a 10) x minutos</strong>. A carga da semana é a
            soma dos 7 dias. É um cálculo próprio do Meu Personal, simples e aberto; não é diagnóstico.
          </p>
          <p className="t-corpo">
            Comparamos a semana atual com a <strong>média das 4 semanas anteriores</strong> que têm registro.
            Só alertamos com pelo menos 3 semanas de histórico: amarelo acima de 1,30 vezes a média e vermelho
            acima de 1,50.
          </p>
          <ul className="space-y-2">
            {janelasDeCarga(dados.sessoes, dados.jogos, hoje).map((j, k) => (
              <li key={j.de} className="rounded-2xl border border-borda bg-vidro p-3">
                <p className="t-corpo">
                  {k === 0 ? "Semana atual" : `${k} ${k === 1 ? "semana" : "semanas"} atrás`} ({dataBR(j.de)}{" "}
                  a {dataBR(j.ate)}): {num(somaCarga(j.itens))}
                </p>
                {j.itens.length === 0 ? (
                  <p className="t-pq text-texto2">Sem registro.</p>
                ) : (
                  <ul className="t-pq text-texto2">
                    {j.itens.map((i) => (
                      <li key={i.id}>
                        {dataBR(i.data)} · {i.titulo}:{" "}
                        {i.carga !== null ? `${i.esforco} x ${i.duracaoMin} = ${num(i.carga)}` : "sem carga"}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </BottomSheet>
    </>
  );
}
