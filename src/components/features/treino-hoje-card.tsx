"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, ListOrdered, Play, RotateCcw } from "lucide-react";
import { SessaoSheet } from "@/components/features/sessao-sheet";
import { StatusBloco } from "@/components/features/status-bloco";
import { TagChip } from "@/components/features/tag-chip";
import { BotaoAcao } from "@/components/ui/botao-acao";
import { GlassCard } from "@/components/ui/glass-card";
import { IconeBola } from "@/components/ui/icone-bola";
import type { RotuloCarga } from "@/lib/carga";
import { sessaoDoBloco } from "@/lib/derivados";
import { ROTULO_PERIODO, blocoTreinavel, type Bloco, type DiaPlano } from "@/lib/seed/plano";
import { hrefSequencia } from "@/lib/rotas";
import type { SequenciaDoDia } from "@/lib/treino/apoio";
import type { Execucao, Sessao } from "@/lib/tipos";

type Props = {
  dia: DiaPlano;
  rotuloCarga: RotuloCarga;
  sessoes: Sessao[];
  indice?: number;
  /** aviso de segurança: não aumentar a carga */
  semProgressao?: boolean;
  /** próximo bloco pendente e para onde "Iniciar treino" leva */
  proximoBloco?: Bloco | null;
  hrefIniciar?: string;
  /** bloco aberto de fora (ex.: anel TREINOS completo pedindo para editar) */
  blocoParaEditar?: Bloco | null;
  onFecharEdicao?: () => void;
  /** blocos pendentes do mesmo período, encadeáveis (24.6) */
  sequencia?: SequenciaDoDia | null;
  /** treino em andamento, para continuar */
  execucao?: Execucao | null;
};

export function TreinoHojeCard({
  dia,
  rotuloCarga,
  sessoes,
  indice,
  semProgressao,
  proximoBloco,
  hrefIniciar,
  blocoParaEditar,
  onFecharEdicao,
  sequencia,
  execucao,
}: Props) {
  const [sheetAberto, setSheetAberto] = useState(false);
  const [blocoSheet, setBlocoSheet] = useState<Bloco>(dia.blocos[0]);

  function abrir(b: Bloco) {
    setBlocoSheet(b);
    setSheetAberto(true);
  }

  const editando = blocoParaEditar ?? blocoSheet;
  const aberto = sheetAberto || !!blocoParaEditar;

  return (
    <GlassCard indice={indice} titulo="Treino de hoje">
      <p className="t-h2">{dia.titulo}</p>
      <p className="t-pq mt-1 text-texto2">Carga: {rotuloCarga}</p>
      {semProgressao && (
        <p className="t-pq mt-1 text-aviso-t">Hoje não aumente a carga. Mantenha o que você já faz.</p>
      )}

      <ul className="mt-4 divide-y divide-borda">
        {dia.blocos.map((b) => {
          const sessao = sessaoDoBloco(sessoes, dia.iso, b.id);
          const treinavel = blocoTreinavel(b);
          return (
            <li key={b.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Link href={`/semana/${dia.iso}`} className="min-w-0 flex-1 rounded-2xl">
                <p className="t-rotulo text-texto2">
                  {ROTULO_PERIODO[b.periodo]}
                  {b.horario ? ` · ${b.horario}` : ""}
                </p>
                <p className="t-h3 mt-0.5 leading-snug">{b.titulo}</p>
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
              </Link>
              {treinavel ? (
                <StatusBloco sessao={sessao} nome={b.titulo} onClick={() => abrir(b)} />
              ) : b.tags.includes("Jogo") ? (
                <IconeBola className="mr-2 size-7 shrink-0 text-aviso-t" />
              ) : (
                <ChevronRight className="size-5 shrink-0 text-texto3" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ul>

      {execucao && execucao.data === dia.iso && execucao.estado.fase !== "resumo" && (
        <BotaoAcao
          className="mt-4"
          rotulo="Continuar treino de hoje"
          icone={<RotateCcw className="size-5" />}
          href={`/treino/${execucao.estado.blocos[0].id}?data=${dia.iso}${execucao.estado.sequencia ? "&sequencia=1" : ""}`}
        />
      )}

      {sequencia && !(execucao && execucao.data === dia.iso && execucao.estado.fase !== "resumo") && (
        <div className="mt-4 rounded-2xl border border-borda bg-vidro p-3">
          <p className="t-h3">Sequência do dia · {sequencia.totalMin} min</p>
          <ol className="mt-2 space-y-1">
            {sequencia.blocos.map((b, i) => (
              <li key={b.id} className="t-corpo flex items-center gap-2 text-texto2">
                <span className="num flex size-6 shrink-0 items-center justify-center rounded-full bg-primario text-[0.8125rem] font-semibold text-white">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{b.titulo}</span>
                <span className="num">{b.duracaoMin} min</span>
              </li>
            ))}
          </ol>
          <BotaoAcao
            className="mt-3"
            rotulo="Iniciar sequência"
            icone={<ListOrdered className="size-5" />}
            href={hrefSequencia(dia.iso, sequencia.blocos[0].id)}
          />
        </div>
      )}

      {proximoBloco &&
        hrefIniciar &&
        !(execucao && execucao.data === dia.iso && execucao.estado.fase !== "resumo") && (
          <BotaoAcao
            className="mt-4"
            rotulo="Iniciar treino"
            icone={<Play className="size-5" />}
            href={hrefIniciar}
          />
        )}

      <SessaoSheet
        aberto={aberto}
        onFechar={() => {
          setSheetAberto(false);
          onFecharEdicao?.();
        }}
        data={dia.iso}
        bloco={editando}
        inicial={sessaoDoBloco(sessoes, dia.iso, editando.id)}
        resultadoPadrao="feito"
      />
    </GlassCard>
  );
}
