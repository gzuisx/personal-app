"use client";

import { useEffect, useMemo, useState } from "react";
import type { DadosApp } from "../tipos";
import { buildCoachContext } from "./contexto";
import { lerEscolhaDoDia, type EscolhaDoDia } from "./ajuste-dia";
import { definirModoDoDia } from "./modo";
import type { CoachContext, Decisao } from "./tipos";

/** Contexto e decisão do dia, recalculados quando os dados mudam. */
export function useCoach(
  agora: Date | null,
  dados: DadosApp,
): { ctx: CoachContext; decisao: Decisao } | null {
  return useMemo(() => {
    if (!agora) return null;
    const ctx = buildCoachContext(agora, dados);
    return { ctx, decisao: definirModoDoDia(ctx) };
  }, [agora, dados]);
}

/** Escolha de ajuste do dia (localStorage), atualizada quando outra tela muda. */
export function useEscolhaDoDia(data: string): EscolhaDoDia | null {
  const [v, setV] = useState<EscolhaDoDia | null>(null);
  useEffect(() => {
    const ler = () => setV(lerEscolhaDoDia(data));
    ler();
    window.addEventListener("meu-personal:ajuste", ler);
    return () => window.removeEventListener("meu-personal:ajuste", ler);
  }, [data]);
  return v;
}
