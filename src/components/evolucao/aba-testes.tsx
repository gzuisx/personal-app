"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { MetasCard } from "@/components/features/metas-card";
import { GlassCard } from "@/components/ui/glass-card";
import { TESTES, resumirTestes, simetriaRecente } from "@/lib/testes";

const fmt = (v: number) => String(Math.round(v * 100) / 100).replace(".", ",");
const dataBR = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

export function AbaTestes({ hoje }: { hoje: string }) {
  const { dados } = useDados();
  const resumos = useMemo(() => resumirTestes(dados.testes), [dados.testes]);

  return (
    <>
      <GlassCard indice={1} titulo="Testes de campo">
        <ul className="space-y-2">
          {TESTES.map((def) => {
            const ultimo = resumos
              .filter((r) => r.tipo === def.tipo)
              .sort((a, b) => b.data.localeCompare(a.data))[0];
            const sim = def.porPe ? simetriaRecente(resumos, def.tipo) : null;
            return (
              <li key={def.tipo} className="rounded-2xl border border-borda bg-vidro p-3">
                <p className="t-corpo">
                  {def.tipo} · {def.nome}
                </p>
                <p className="t-pq text-texto2">
                  {ultimo
                    ? `Último: ${fmt(ultimo.valor)} ${ultimo.unidade} em ${dataBR(ultimo.data)}`
                    : "Ainda sem registro"}
                  {sim ? ` · simetria ${Math.round(sim.percentual)}%` : ""}
                </p>
              </li>
            );
          })}
        </ul>
        <Link
          href="/evolucao/testes"
          className="mt-3 flex min-h-12 items-center justify-between rounded-full border border-borda bg-vidro-forte px-5 font-semibold text-texto"
        >
          Fazer ou ver os testes <ChevronRight className="size-5" aria-hidden="true" />
        </Link>
      </GlassCard>
      <MetasCard hoje={hoje} indice={2} />
    </>
  );
}
