"use client";

import { useState } from "react";
import { NotebookPen } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { DiarioSheet } from "@/components/features/diario-sheet";
import { GraficoLinha } from "@/components/features/graficos";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import {
  JANELA_MEDIA_MOVEL,
  ROTULO_CAMPO,
  sentido,
  tendencia,
  temConteudo,
  type CampoDiario,
} from "@/lib/diario";
import { DIAS_SEMANA, dataISO, diaSemanaISO } from "@/lib/tempo";
import { GATILHO_ROTULO } from "@/lib/tipos";

const CAMPOS = Object.keys(ROTULO_CAMPO) as CampoDiario[];
const dataBR = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;
const SENTIDO = { sobe: "subindo", desce: "descendo", estavel: "estável" } as const;

export function AbaJogos() {
  const { dados } = useDados();
  const [campo, setCampo] = useState<CampoDiario>("condicao");
  const [diario, setDiario] = useState<string | null>(null);

  const jogos = [...dados.jogos]
    .filter((j) => j.dor !== null && j.status !== "cancelado")
    .sort((a, b) => b.inicio.localeCompare(a.inicio));
  const t = tendencia(dados.diarios, campo);
  const direcao = sentido(t);

  return (
    <>
      <GlassCard indice={1} titulo="Jogos registrados">
        {jogos.length === 0 ? (
          <EmptyState
            compacto
            titulo="Nenhum jogo registrado"
            texto="Depois do jogo, registre a dor e o diário aparece aqui."
          />
        ) : (
          <ul className="space-y-2">
            {jogos.map((j) => {
              const iso = dataISO(new Date(j.inicio));
              const d = dados.diarios.find((x) => x.jogoData === iso);
              return (
                <li key={j.inicio} className="rounded-2xl border border-borda bg-vidro p-3">
                  <p className="t-corpo">
                    {dataBR(iso)} · {DIAS_SEMANA[diaSemanaISO(iso)]}
                  </p>
                  <p className="t-pq text-texto2">
                    {j.minutosJogados ?? "—"} min · esforço {j.esforco ?? "—"} · dor depois {j.dor}
                    {j.gatilho ? ` · gatilho: ${GATILHO_ROTULO[j.gatilho].toLowerCase()}` : ""}
                  </p>
                  {d && temConteudo(d) && (
                    <p className="t-pq text-texto2">
                      Diário: {d.gols ?? 0} gols · {d.assistencias ?? 0} assistências · {d.finalizacoes ?? 0}{" "}
                      finalizações
                      {d.condicao !== null ? ` · condição ${d.condicao}/5` : ""}
                    </p>
                  )}
                  <Button className="mt-2" variante="secundario" onClick={() => setDiario(iso)}>
                    <NotebookPen className="size-4" aria-hidden="true" />{" "}
                    {d && temConteudo(d) ? "Editar diário" : "Preencher diário"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>

      <GlassCard indice={2} titulo="Tendência do diário">
        <ChipGroup
          rotuloAria="Indicador"
          opcoes={CAMPOS.map((c) => ({ valor: c, rotulo: ROTULO_CAMPO[c].replace(" (1 a 5)", "") }))}
          valor={campo}
          onChange={setCampo}
        />
        {t.length < 2 ? (
          <p className="t-corpo mt-3 text-texto2">
            Faltam {2 - t.length} {2 - t.length === 1 ? "jogo" : "jogos"} com diário para mostrar a tendência.
            Média móvel de {JANELA_MEDIA_MOVEL} jogos.
          </p>
        ) : (
          <div className="mt-3">
            <GraficoLinha
              descricao={`Tendência de ${ROTULO_CAMPO[campo]}`}
              series={[
                {
                  chave: "valor",
                  rotulo: "Cada jogo",
                  cor: "var(--text-3)",
                  pontos: t.map((p) => ({ iso: p.jogoData, valor: p.valor })),
                },
                {
                  chave: "media",
                  rotulo: `Média de ${JANELA_MEDIA_MOVEL} jogos`,
                  cor: "var(--accent)",
                  pontos: t.map((p) => ({ iso: p.jogoData, valor: p.mediaMovel })),
                },
              ]}
            />
            <p className="t-pq mt-1 text-texto2">
              Cinza = cada jogo · azul = média dos últimos {JANELA_MEDIA_MOVEL} jogos · com base em {t.length}{" "}
              jogos
              {direcao ? ` · parece ${SENTIDO[direcao]}` : ""}
            </p>
          </div>
        )}
      </GlassCard>

      <DiarioSheet jogoData={diario} aberto={!!diario} onFechar={() => setDiario(null)} />
    </>
  );
}
