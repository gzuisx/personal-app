"use client";

import { Check, Minus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Sessao } from "@/lib/tipos";

/** Botão de status do bloco: Fazer / Feito / Parcial (ou Não fiz). Toque abre o registro. */
export function StatusBloco({
  sessao,
  onClick,
  nome,
}: {
  sessao: Sessao | null;
  onClick: () => void;
  nome: string;
}) {
  const r = sessao?.resultado;
  const rotulo =
    r === "feito" ? "Feito" : r === "parcial" ? "Parcial" : r === "nao_fiz" ? "Não fiz" : "Fazer";
  const Icone = r === "feito" ? Check : r === "parcial" ? Minus : r === "nao_fiz" ? X : null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${nome}: ${rotulo}. Toque para registrar.`}
      className={cn(
        "inline-flex h-11 min-w-[88px] shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 text-[15px] font-semibold transition-transform duration-100 active:scale-[0.97]",
        !r && "border-primario bg-primario text-white",
        r === "feito" && "border-ok bg-ok text-sobre",
        r === "parcial" && "border-aviso bg-aviso text-sobre",
        r === "nao_fiz" && "border-borda bg-vidro-forte text-texto2",
      )}
    >
      {Icone && <Icone className="size-5" aria-hidden="true" />}
      {rotulo}
    </button>
  );
}
