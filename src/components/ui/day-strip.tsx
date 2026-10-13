"use client";

import { cn } from "@/lib/cn";

export type DiaFaixa = {
  iso: string;
  letra: string;
  numero: number;
  rotuloAria: string;
  hoje?: boolean;
  selecionado?: boolean;
  jogo?: boolean;
  feito?: boolean;
};

export function DayStrip({ dias, onSelect }: { dias: DiaFaixa[]; onSelect?: (iso: string) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Dias da semana">
      {dias.map((d) => (
        <button
          key={d.iso}
          type="button"
          onClick={() => onSelect?.(d.iso)}
          aria-label={d.rotuloAria}
          aria-pressed={d.selecionado}
          className={cn(
            "flex h-[72px] flex-col items-center justify-center gap-0.5 rounded-full border transition-[transform,background-color] duration-100 ease-out active:scale-[0.97]",
            d.selecionado
              ? "border-primario bg-primario text-white shadow-brilho"
              : "border-borda bg-vidro-forte text-texto2",
            d.hoje && !d.selecionado && "border-realce text-texto",
          )}
        >
          <span className="t-rotulo">{d.letra}</span>
          <span className="num text-[1.0625rem] leading-6 font-semibold">{d.numero}</span>
          <span className="flex h-2 items-center gap-1" aria-hidden="true">
            {d.jogo && <span className="size-1.5 rounded-full bg-aviso" />}
            {d.feito && <span className="size-1.5 rounded-full bg-ok" />}
          </span>
        </button>
      ))}
    </div>
  );
}
