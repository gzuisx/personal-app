"use client";

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

function corDor(v: number) {
  if (v <= 3) return { borda: "border-ok", ativo: "bg-ok border-ok text-sobre" };
  if (v <= 5) return { borda: "border-aviso", ativo: "bg-aviso border-aviso text-sobre" };
  return { borda: "border-perigo", ativo: "bg-perigo border-perigo text-sobre" };
}

export function EscalaDor({ valor, onChange, variante = "dor", rotuloAria }: Props) {
  const valores = Array.from({ length: 11 }, (_, i) => i);
  return (
    <div>
      <div role="group" aria-label={rotuloAria} className="grid grid-cols-6 gap-2">
        {valores.map((v) => {
          const ativo = valor === v;
          const cor =
            variante === "dor"
              ? corDor(v)
              : { borda: "border-borda", ativo: "bg-primario border-primario text-white" };
          return (
            <button
              key={v}
              type="button"
              aria-pressed={ativo}
              aria-label={`${variante === "dor" ? "Dor" : "Esforço"} ${v} de 10`}
              onClick={() => onChange(v)}
              className={cn(
                "num h-12 select-none rounded-full border-2 bg-vidro-forte text-[17px] font-semibold transition-[transform,background-color] duration-100 ease-out active:scale-[0.95]",
                ativo ? cor.ativo : cn(cor.borda, "text-texto"),
              )}
            >
              {v}
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
