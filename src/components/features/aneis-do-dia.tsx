"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Footprints, Moon, Pencil, Dumbbell, ClipboardCheck } from "lucide-react";
import { BotaoAcao } from "@/components/ui/botao-acao";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { IconeBola } from "@/components/ui/icone-bola";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Segmentado } from "@/components/ui/segmentado";
import { cn } from "@/lib/cn";
import {
  computeAneis,
  computeAneisSemana,
  type Anel,
  type AnelId,
  type ModoDiaAnel,
} from "@/lib/coach/aneis";
import { sessaoDoBloco } from "@/lib/derivados";
import { blocoPrincipal, blocoTornozeloTag, type Bloco, type DiaPlano } from "@/lib/seed/plano";
import type { Checkin, Sessao } from "@/lib/tipos";

type Props = {
  dia: DiaPlano;
  semana: DiaPlano[];
  sessoes: Sessao[];
  checkins: Checkin[];
  modo?: ModoDiaAnel;
  blocosRemovidos?: string[];
  indice?: number;
  /** abre o check-in (feito ou por fazer) */
  onCheckin: () => void;
  /** endereço que abre um bloco pendente (detalhe do dia ou treino guiado) */
  hrefBloco: (blocoId: string) => string;
  /** abre o registro/edição de um bloco já feito */
  onEditarSessao: (bloco: Bloco) => void;
};

const rotuloAnel: Record<AnelId, string> = {
  treinos: "Treinos",
  tornozelo: "Tornozelo",
  checkin: "Check-in",
};

function Centro({ anel }: { anel: Anel }) {
  if (anel.estado === "descanso") return <Moon className="size-7 text-texto2" aria-hidden="true" />;
  if (anel.estado === "jogo") return <IconeBola className="size-8 text-aviso-t" />;
  return <span className="t-h3 num leading-tight">{anel.centro}</span>;
}

function IconeDoAnel({ id }: { id: AnelId }) {
  const c = "size-4";
  if (id === "treinos") return <Dumbbell className={c} aria-hidden="true" />;
  if (id === "tornozelo") return <Footprints className={c} aria-hidden="true" />;
  return <ClipboardCheck className={c} aria-hidden="true" />;
}

/** Anéis do plano (24.1): cada anel é um botão que abre o que falta, ou o resumo do que foi registrado. */
export function AneisDoDia({
  dia,
  semana,
  sessoes,
  checkins,
  modo,
  blocosRemovidos,
  indice,
  onCheckin,
  hrefBloco,
  onEditarSessao,
}: Props) {
  const router = useRouter();
  const [escopo, setEscopo] = useState<"dia" | "semana">("dia");
  const [resumo, setResumo] = useState<AnelId | null>(null);

  const { aneis, proxima } = computeAneis({ dia, sessoes, checkins, modo, blocosRemovidos });
  const aneisSemana = computeAneisSemana(semana, sessoes, checkins, dia.iso);
  const lista = escopo === "dia" ? aneis : aneisSemana;

  function abrir(anel: Anel) {
    if (escopo === "semana") return router.push("/semana");
    if (anel.estado === "descanso") return;
    if (anel.estado === "jogo") return router.push(`/jogo/${dia.iso}`);
    if (anel.estado === "completo") return setResumo(anel.id);
    // pendente: abre exatamente o que falta
    if (anel.id === "checkin") return onCheckin();
    const proximo = anel.pendentes[0];
    if (proximo) router.push(hrefBloco(proximo.id));
  }

  const blocosDoResumo =
    resumo === "tornozelo"
      ? dia.blocos.filter(blocoTornozeloTag)
      : resumo === "treinos"
        ? dia.blocos.filter(blocoPrincipal)
        : [];

  const checkinHoje = checkins.find((c) => c.data === dia.iso);

  return (
    <GlassCard indice={indice} titulo="Seu dia">
      <Segmentado
        rotuloAria="Período dos anéis"
        valor={escopo}
        onChange={setEscopo}
        opcoes={[
          { valor: "dia", rotulo: "Dia" },
          { valor: "semana", rotulo: "Semana" },
        ]}
        className="mb-4"
      />

      <div className="grid grid-cols-3 gap-2">
        {lista.map((anel) => {
          const interativo = !(escopo === "dia" && anel.estado === "descanso");
          return (
            <button
              key={anel.id}
              type="button"
              disabled={!interativo}
              onClick={() => abrir(anel)}
              aria-label={`${rotuloAnel[anel.id]}: ${anel.centro}${anel.estado === "pendente" ? ", falta registrar" : ""}`}
              className={cn(
                "flex min-h-[8.5rem] flex-col items-center justify-start gap-1.5 rounded-2xl px-1 py-2 transition-transform duration-100",
                interativo && "active:scale-[0.97]",
              )}
            >
              <ProgressRing
                valor={anel.estado === "descanso" ? 0 : anel.valor}
                tamanho={84}
                espessura={9}
                cor={
                  anel.id === "checkin"
                    ? "var(--success)"
                    : anel.id === "tornozelo"
                      ? "var(--accent)"
                      : "var(--primary-hover)"
                }
                centro={<Centro anel={anel} />}
              />
              <span className="t-rotulo flex items-center gap-1 text-texto2">
                <IconeDoAnel id={anel.id} />
                {rotuloAnel[anel.id]}
              </span>
            </button>
          );
        })}
      </div>

      {escopo === "dia" && (
        <div className="mt-3">
          {proxima ? (
            <>
              <p className="t-corpo mb-2 text-texto2">{proxima.texto}</p>
              <BotaoAcao
                rotulo={
                  proxima.anel === "checkin"
                    ? "Fazer check-in"
                    : proxima.anel === "tornozelo"
                      ? "Fazer o tornozelo"
                      : "Fazer o treino"
                }
                icone={
                  proxima.anel === "checkin" ? (
                    <ClipboardCheck className="size-5" />
                  ) : (
                    <Dumbbell className="size-5" />
                  )
                }
                onClick={
                  proxima.anel === "checkin" ? onCheckin : () => router.push(hrefBloco(proxima.blocoId!))
                }
              />
            </>
          ) : aneis[0].estado === "descanso" ? (
            <p className="t-corpo text-texto2">Hoje é descanso. Sem meta extra: recupere e durma bem.</p>
          ) : (
            <p className="t-corpo flex items-center gap-2 text-ok-t">
              <Check className="size-5" aria-hidden="true" />
              Plano de hoje completo.
            </p>
          )}
        </div>
      )}

      <BottomSheet
        aberto={resumo !== null}
        onFechar={() => setResumo(null)}
        titulo={
          resumo === "checkin"
            ? "Seu check-in de hoje"
            : `Resumo: ${resumo ? rotuloAnel[resumo].toLowerCase() : ""}`
        }
      >
        {resumo === "checkin" && checkinHoje ? (
          <div className="space-y-2">
            <p className="t-h2">Dor {checkinHoje.dor} de 10</p>
            <p className="t-corpo text-texto2">
              {checkinHoje.inchaco ? "Com inchaço. " : "Sem inchaço. "}
              {checkinHoje.falhou ? "O tornozelo cedeu." : "Sem falha."}
            </p>
            <Button
              className="mt-2 w-full"
              icone={<Pencil className="size-5" />}
              onClick={() => {
                setResumo(null);
                onCheckin();
              }}
            >
              Editar check-in
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {blocosDoResumo.map((b) => {
              const s = sessaoDoBloco(sessoes, dia.iso, b.id);
              if (!s) return null;
              return (
                <li key={b.id} className="rounded-2xl border border-borda bg-vidro p-3">
                  <p className="t-h3">{b.titulo}</p>
                  <p className="t-corpo text-texto2">
                    {s.resultado === "feito" ? "Feito" : s.resultado === "parcial" ? "Parcial" : "Não fiz"}
                    {s.esforco !== null ? ` · esforço ${s.esforco}` : ""}
                    {s.duracaoMin !== null ? ` · ${s.duracaoMin} min` : ""}
                  </p>
                  {s.notas && <p className="t-pq mt-1 text-texto2">{s.notas}</p>}
                  <Button
                    variante="secundario"
                    className="mt-2"
                    icone={<Pencil className="size-5" />}
                    onClick={() => {
                      setResumo(null);
                      onEditarSessao(b);
                    }}
                  >
                    Editar
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </BottomSheet>
    </GlassCard>
  );
}
