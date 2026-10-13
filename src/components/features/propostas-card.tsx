"use client";

import { useEffect, useState } from "react";
import { Check, Circle } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/toast";
import { propostaDePlano, visivel } from "@/lib/coach/propostas";
import type { CoachContext, Decisao } from "@/lib/coach/tipos";

type Props = { indice?: number; hoje: string; ctx: CoachContext; decisao: Decisao };

/** Propostas do coach (progressão, descarga, fase). Nada muda sem o Gabriel aceitar. */
export function PropostasCard({ indice = 2, hoje, ctx, decisao }: Props) {
  const { dados, status, sincronizarPropostas, decidirProposta } = useDados();
  const toast = useToast();
  const [ocupado, setOcupado] = useState<string | null>(null);

  // Cria no banco as propostas novas sugeridas pelas regras (sem repetir a mesma).
  useEffect(() => {
    const plano = decisao.sugestaoDePlano
      ? propostaDePlano(decisao.sugestaoDePlano, "Sugestão do app pelos seus registros de hoje.")
      : null;
    const sugeridas = plano ? [...decisao.propostas, plano] : decisao.propostas;
    if (status !== "pronto" || sugeridas.length === 0) return;
    sincronizarPropostas(sugeridas).catch(() => undefined);
  }, [status, decisao.propostas, decisao.sugestaoDePlano, sincronizarPropostas]);

  const lista = dados.propostas.filter((p) => visivel(p, hoje));
  if (!lista.length) return null;

  async function decidir(id: string, acao: "aceitar" | "adiar" | "recusar") {
    setOcupado(id);
    try {
      const r = await decidirProposta(id, acao, {
        decisao,
        podeProgredirSeguranca: ctx.seguranca.podeProgredir,
        dorHoje: ctx.checkins.find((c) => c.data === hoje)?.dor ?? null,
      });
      if (!r.ok) toast.mostrar(r.motivo, "aviso");
      else
        toast.mostrar(
          acao === "aceitar"
            ? "Proposta aceita"
            : acao === "adiar"
              ? "Adiada por 7 dias"
              : "Proposta recusada",
        );
    } catch {
      toast.mostrar("Não consegui salvar. Confira a internet.", "erro");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="space-y-4" data-testid="propostas">
      {lista.map((p, i) => (
        <GlassCard key={p.id} indice={indice + i} variante="forte" titulo="Sugestão do treinador">
          <h3 className="t-h3">{p.titulo}</h3>
          <p className="t-corpo mt-1 text-texto2">{p.resumo}</p>
          {p.criterios.length > 0 && (
            <ul className="mt-3 space-y-1" aria-label="Critérios">
              {p.criterios.map((c) => (
                <li key={c.texto} className="t-corpo flex items-start gap-2">
                  {c.ok ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-ok-t" aria-label="Atendido" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-texto3" aria-label="Falta" />
                  )}
                  <span>
                    {c.texto}
                    {c.progresso ? <span className="text-texto2"> · {c.progresso}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={ocupado === p.id} onClick={() => decidir(p.id, "aceitar")}>
              Aceitar
            </Button>
            {p.status !== "adiada" && (
              <Button
                variante="secundario"
                disabled={ocupado === p.id}
                onClick={() => decidir(p.id, "adiar")}
              >
                Adiar
              </Button>
            )}
            <Button variante="fantasma" disabled={ocupado === p.id} onClick={() => decidir(p.id, "recusar")}>
              Recusar
            </Button>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
