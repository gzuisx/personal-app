"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  valor: number | null;
  onChange: (v: number) => void;
  /** "dor" usa verde/amarelo/vermelho; "esforco" usa azul neutro */
  variante?: "dor" | "esforco";
  rotuloAria?: string;
};

export function rotuloDor(v: number) {
  if (v === 0) return "sem dor";
  if (v <= 3) return "dor leve";
  if (v <= 5) return "dor moderada";
  if (v <= 7) return "dor forte";
  return "dor muito forte";
}

export function rotuloEsforco(v: number) {
  if (v <= 1) return "repouso";
  if (v <= 3) return "leve";
  if (v <= 6) return "moderado";
  if (v <= 8) return "pesado";
  return "máximo";
}

function zona(v: number) {
  if (v <= 3) return "border-ok bg-ok/10";
  if (v <= 5) return "border-aviso bg-aviso/10";
  return "border-perigo bg-perigo/10";
}

/** Escala de 0 a 10: borda verde (0-3), amarela (4-5) e vermelha (6-10); o selecionado ganha anel ciano e check. */
export function EscalaDor({ valor, onChange, variante = "dor", rotuloAria }: Props) {
  const valores = Array.from({ length: 11 }, (_, i) => i);
  return (
    <div>
      <div role="group" aria-label={rotuloAria} className="grid grid-cols-6 gap-2">
        {valores.map((v) => {
          const ativo = valor === v;
          return (
            <button
              key={v}
              type="button"
              aria-pressed={ativo}
              aria-label={`${variante === "dor" ? "Dor" : "Esforço"} ${v} de 10`}
              onClick={() => onChange(v)}
              className={cn(
                "num relative h-12 select-none rounded-full border-2 text-[1.0625rem] font-semibold text-texto transition-[transform,background-color] duration-100 ease-out active:scale-[0.95]",
                variante === "dor" ? zona(v) : "border-borda bg-vidro-forte",
                ativo && "ring-2 ring-realce-t ring-offset-2 ring-offset-bg1",
              )}
            >
              {v}
              {ativo && (
                <span
                  className="absolute -top-1.5 -right-1 flex size-5 items-center justify-center rounded-full bg-realce-t text-sobre"
                  aria-hidden="true"
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="t-pq mt-2 text-texto2" aria-live="polite">
        {valor === null
          ? variante === "dor"
            ? "0 = sem dor · 10 = dor forte"
            : "0 = repouso · 10 = esforço máximo"
          : `${valor} de 10 · ${variante === "dor" ? rotuloDor(valor) : rotuloEsforco(valor)}`}
      </p>
    </div>
  );
}
