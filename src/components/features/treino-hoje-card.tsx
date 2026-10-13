"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, Trophy } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { SessaoSheet } from "@/components/features/sessao-sheet";
import { StatusBloco } from "@/components/features/status-bloco";
import { TagChip } from "@/components/features/tag-chip";
import { sessaoDoBloco } from "@/lib/derivados";
import { ROTULO_PERIODO, blocoTreinavel, type Bloco, type DiaPlano } from "@/lib/seed/plano";
import type { RotuloCarga } from "@/lib/carga";
import type { Sessao } from "@/lib/tipos";

type Props = {
  dia: DiaPlano;
  rotuloCarga: RotuloCarga;
  sessoes: Sessao[];
  indice?: number;
  /** aviso de segurança: não aumentar a carga */
  semProgressao?: boolean;
};

export function TreinoHojeCard({ dia, rotuloCarga, sessoes, indice, semProgressao }: Props) {
  const [sheetAberto, setSheetAberto] = useState(false);
  const [blocoSheet, setBlocoSheet] = useState<Bloco>(dia.blocos[0]);

  function abrir(b: Bloco) {
    setBlocoSheet(b);
    setSheetAberto(true);
  }

  return (
    <GlassCard
      indice={indice}
      titulo="Treino de hoje"
      acao={
        <span className="t-rotulo rounded-full border border-borda bg-vidro px-3 py-1.5 text-texto2">
          {rotuloCarga}
        </span>
      }
    >
      <p className="t-h2">{dia.titulo}</p>
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
                <Trophy className="mr-2 size-6 shrink-0 text-aviso-t" aria-label="Jogo" />
              ) : (
                <ChevronRight className="size-5 shrink-0 text-texto3" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ul>

      <SessaoSheet
        aberto={sheetAberto}
        onFechar={() => setSheetAberto(false)}
        data={dia.iso}
        bloco={blocoSheet}
        inicial={sessaoDoBloco(sessoes, dia.iso, blocoSheet.id)}
        resultadoPadrao="feito"
      />
    </GlassCard>
  );
}
