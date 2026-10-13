"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type OpcaoSegmentada<T extends string | number | boolean> = {
  valor: T;
  rotulo: string;
  icone?: React.ReactNode;
};

/** Controle segmentado (Feito / Parcial / Não fiz, Sim / Não): a opção ativa fica azul, com check. */
export function Segmentado<T extends string | number | boolean>({
  opcoes,
  valor,
  onChange,
  rotuloAria,
  className,
}: {
  opcoes: OpcaoSegmentada<T>[];
  valor: T | null;
  onChange: (v: T) => void;
  rotuloAria?: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={rotuloAria}
      className={cn("flex gap-1 rounded-full border border-borda bg-vidro-forte p-1", className)}
    >
      {opcoes.map((o) => {
        const ativo = valor === o.valor;
        return (
          <button
            key={String(o.valor)}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(o.valor)}
            className={cn(
              "flex h-12 min-w-0 flex-1 select-none items-center justify-center gap-1.5 rounded-full px-3 text-[0.9375rem] font-semibold transition-[transform,background-color] duration-100 ease-out active:scale-[0.97]",
              ativo ? "bg-primario text-white shadow-brilho" : "text-texto2",
            )}
          >
            {ativo ? <Check className="size-5 shrink-0" aria-hidden="true" /> : o.icone}
            <span className="truncate">{o.rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
