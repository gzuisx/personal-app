"use client";

import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { GraficoLinha, corDaSerie } from "@/components/features/graficos";
import { MetasCard } from "@/components/features/metas-card";
import { RegistrarTeste } from "@/components/features/registrar-teste";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { SkeletonTela } from "@/components/ui/skeleton";
import { avaliarSeguranca } from "@/lib/safety";
import {
  AVISO_PARE,
  TESTES,
  resumirTestes,
  seriesDoTeste,
  simetriaRecente,
  variacaoDoTeste,
  type DefTeste,
} from "@/lib/testes";
import { dataISO } from "@/lib/tempo";
import { useAgora } from "@/lib/use-agora";

const fmt = (v: number) => String(Math.round(v * 100) / 100).replace(".", ",");
const dataBR = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

export default function TestesPage() {
  const agora = useAgora();
  const { status, erro, recarregar, dados } = useDados();
  const [aberto, setAberto] = useState<DefTeste | null>(null);
  const resumos = useMemo(() => resumirTestes(dados.testes), [dados.testes]);

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
  const seg = avaliarSeguranca({
    checkins: dados.checkins,
    jogos: dados.jogos,
    hoje,
    agora,
    config: dados.seguranca,
  });
  const fase = dados.faseTornozelo.fase;

  function bloqueio(def: DefTeste): string | null {
    if (!def.exigeFase3) return null;
    if (fase < 3) return "Disponível a partir da fase 3 do tornozelo.";
    if (seg.nivel !== "liberado") return "Disponível quando a segurança estiver liberada (semáforo verde).";
    return null;
  }

  return (
    <main className="pagina space-y-4">
      <Header titulo="Testes de campo" sobretitulo="1 vez por mês" voltarPara="/evolucao" />
      <p className="t-corpo text-texto2">
        Faça no primeiro mês (linha de base) e depois uma vez por mês. {AVISO_PARE}
      </p>

      {TESTES.map((def, i) => {
        const trava = bloqueio(def);
        const series = seriesDoTeste(resumos, def.tipo);
        const doTipo = resumos.filter((r) => r.tipo === def.tipo);
        const ultimo = [...doTipo].sort((a, b) => b.data.localeCompare(a.data))[0];
        const simetria = def.porPe ? simetriaRecente(resumos, def.tipo) : null;
        const variacao = !def.porPe && !def.subtipos ? variacaoDoTeste(doTipo) : null;
        return (
          <GlassCard key={def.tipo} indice={i} titulo={`${def.tipo} · ${def.nome}`}>
            <p className="t-corpo text-texto2">{def.resumo}</p>
            {ultimo ? (
              <p className="t-corpo mt-2">
                Último: {fmt(ultimo.valor)} {ultimo.unidade} em {dataBR(ultimo.data)}
                {variacao !== null
                  ? ` · ${variacao >= 0 ? "melhorou" : "piorou"} ${fmt(Math.abs(variacao))}%`
                  : ""}
              </p>
            ) : (
              <p className="t-corpo mt-2 text-texto2">Ainda sem registro.</p>
            )}
            {simetria && (
              <p className="t-corpo mt-1">
                Simetria entre os pés: {Math.round(simetria.percentual)}%
                {simetria.percentual < 90
                  ? ` (pé ${simetria.maisFraco} mais fraco; meta 90% ou mais)`
                  : " (dentro da meta de 90%)"}
              </p>
            )}
            {series.some((s) => s.pontos.length >= 2) && (
              <div className="mt-3">
                <GraficoLinha
                  descricao={`Evolução do teste ${def.nome}`}
                  unidade={def.unidade}
                  series={series.map((s, k) => ({
                    chave: s.chave,
                    rotulo: s.rotulo,
                    cor: corDaSerie(k),
                    pontos: s.pontos.map((p) => ({ iso: p.data, valor: p.valor })),
                  }))}
                />
                {series.length > 1 && (
                  <ul className="t-pq mt-1 flex flex-wrap gap-x-3 text-texto2">
                    {series.map((s, k) => (
                      <li key={s.chave} className="flex items-center gap-1">
                        <span
                          aria-hidden="true"
                          className="inline-block size-2.5 rounded-full"
                          style={{ background: corDaSerie(k) }}
                        />
                        {s.rotulo}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {trava ? (
              <p className="t-pq mt-3 flex items-center gap-2 text-texto2">
                <Lock className="size-4" aria-hidden="true" /> {trava}
              </p>
            ) : (
              <Button className="mt-3" variante="secundario" onClick={() => setAberto(def)}>
                Fazer o teste {def.tipo}
              </Button>
            )}
          </GlassCard>
        );
      })}

      <MetasCard hoje={hoje} indice={TESTES.length} />

      <RegistrarTeste def={aberto} data={hoje} aberto={!!aberto} onFechar={() => setAberto(null)} />
    </main>
  );
}
