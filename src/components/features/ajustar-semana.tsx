"use client";

import { useState } from "react";
import { CalendarCog, Plus, Trash2 } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/toast";
import { rotuloExcecao } from "@/lib/coach/agenda";
import { recomendar, ROTULO_FOCO, type FocoRecomendacao } from "@/lib/coach/recomendacao";
import type { CoachContext, Decisao } from "@/lib/coach/tipos";
import { DIAS_SEMANA, diaSemanaISO } from "@/lib/tempo";
import { ROTULO_EXCECAO, type ExcecaoAgenda, type TipoExcecao } from "@/lib/tipos";

const TIPOS_DA_SEMANA: TipoExcecao[] = [
  "jogo_extra",
  "jogo_cancelado",
  "trabalho_presencial_extra",
  "viagem",
  "feriado",
  "funcional_cancelado",
  "sem_academia",
];

const rotuloDia = (iso: string) => `${DIAS_SEMANA[diaSemanaISO(iso)].slice(0, 3)} ${iso.slice(8)}`;

/** "Ajustar semana" (exceções do calendário) e "Sugestões para você" (recomendador). */
export function AjustarSemana({
  dias,
  hoje,
  ctx,
  decisao,
}: {
  dias: string[];
  hoje: string;
  ctx: CoachContext;
  decisao: Decisao;
}) {
  const { dados, salvarExcecao, removerExcecao } = useDados();
  const toast = useToast();
  const [aberto, setAberto] = useState(false);
  const [data, setData] = useState(dias.includes(hoje) ? hoje : dias[0]);
  const [tipo, setTipo] = useState<TipoExcecao>("jogo_extra");
  const [hora, setHora] = useState("20:30");
  const [foco, setFoco] = useState<FocoRecomendacao | null>(null);

  const daSemana = dados.excecoes.filter((e) => dias.includes(e.data));

  async function adicionar() {
    const e: ExcecaoAgenda = {
      id: crypto.randomUUID(),
      data,
      tipo,
      hora: tipo === "jogo_extra" ? hora : null,
    };
    try {
      await salvarExcecao(e);
      toast.mostrar("Calendário ajustado");
    } catch {
      toast.mostrar("Não consegui salvar. Confira a internet.", "erro");
    }
  }

  async function remover(id: string) {
    try {
      await removerExcecao(id);
    } catch {
      toast.mostrar("Não consegui remover. Confira a internet.", "erro");
    }
  }

  const dataSugestao = dias.includes(hoje) ? hoje : dias[0];
  const sugestoes = recomendar({
    hoje: dataSugestao,
    fase: ctx.fase.fase,
    modo: decisao.modo,
    semPliometria: decisao.semPliometria,
    semVelocidade: decisao.semVelocidade,
    dorHoje: ctx.checkins.find((c) => c.data === hoje)?.dor ?? null,
    series: dados.series,
    foco,
    jaNoPlano: dados.excecoes.filter((e) => e.tipo === "exercicio_extra").map((e) => e.slug ?? ""),
    limite: 4,
  });

  async function adicionarSugestao(slug: string) {
    try {
      await salvarExcecao({ id: crypto.randomUUID(), data: dataSugestao, tipo: "exercicio_extra", slug });
      toast.mostrar(`Adicionado em ${rotuloDia(dataSugestao)}`);
    } catch {
      toast.mostrar("Não consegui salvar. Confira a internet.", "erro");
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variante="secundario" onClick={() => setAberto(true)}>
          <CalendarCog className="size-4" aria-hidden="true" /> Ajustar semana
        </Button>
      </div>

      <GlassCard variante="leve" titulo="Sugestões para você">
        <p className="t-pq text-texto2">Escolha um foco ou deixe o app olhar as lacunas da semana.</p>
        <ChipGroup
          className="mt-2"
          rotuloAria="Foco das sugestões"
          opcoes={(Object.keys(ROTULO_FOCO) as FocoRecomendacao[]).map((f) => ({
            valor: f,
            rotulo: ROTULO_FOCO[f],
          }))}
          valor={foco}
          onChange={(f) => setFoco((atual) => (atual === f ? null : f))}
        />
        {sugestoes.length === 0 ? (
          <p className="t-corpo mt-3 text-texto2">Sem sugestões seguras para hoje com esse foco.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sugestoes.map((s) => (
              <li
                key={s.slug}
                className="flex items-center gap-3 rounded-2xl border border-borda bg-vidro p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="t-h3">{s.nome}</p>
                  <p className="t-pq text-texto2">{s.motivo}</p>
                </div>
                <Button
                  variante="secundario"
                  aria-label={`Adicionar ${s.nome}`}
                  onClick={() => adicionarSugestao(s.slug)}
                >
                  <Plus className="size-4" aria-hidden="true" /> Adicionar
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="t-pq mt-2 text-texto3">Entra em {rotuloDia(dataSugestao)}, no bloco de força.</p>
      </GlassCard>

      <BottomSheet aberto={aberto} onFechar={() => setAberto(false)} titulo="Ajustar semana">
        <div className="space-y-4">
          <section>
            <p className="t-rotulo mb-2 text-texto2">Dia</p>
            <ChipGroup
              rotuloAria="Dia"
              opcoes={dias.map((d) => ({ valor: d, rotulo: rotuloDia(d) }))}
              valor={data}
              onChange={setData}
            />
          </section>
          <section>
            <p className="t-rotulo mb-2 text-texto2">O que mudou</p>
            <ChipGroup
              rotuloAria="Tipo de ajuste"
              opcoes={TIPOS_DA_SEMANA.map((t) => ({ valor: t, rotulo: ROTULO_EXCECAO[t] }))}
              valor={tipo}
              onChange={setTipo}
            />
          </section>
          {tipo === "jogo_extra" && (
            <label className="block">
              <span className="t-rotulo text-texto2">Horário do jogo</span>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="mt-1 block h-12 w-full rounded-2xl border border-borda bg-vidro-forte px-4 text-texto"
              />
            </label>
          )}
          <Button className="w-full" onClick={adicionar}>
            Aplicar em {rotuloDia(data)}
          </Button>
          {daSemana.length > 0 && (
            <section>
              <p className="t-rotulo mb-2 text-texto2">Ajustes desta semana</p>
              <ul className="space-y-2">
                {daSemana.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 rounded-2xl border border-borda bg-vidro p-3"
                  >
                    <span className="t-corpo flex-1">
                      {rotuloDia(e.data)} · {rotuloExcecao(e)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remover ${rotuloExcecao(e)} de ${rotuloDia(e.data)}`}
                      onClick={() => remover(e.id)}
                      className="flex size-11 items-center justify-center rounded-full text-texto2"
                    >
                      <Trash2 className="size-5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
