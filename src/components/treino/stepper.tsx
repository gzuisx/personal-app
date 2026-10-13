"use client";

import { Minus, Plus } from "lucide-react";

/** Contador com botões grandes (56 px) para repetições, carga e tempo: valor em cima, − e + embaixo. */
export function Stepper({
  rotulo,
  valor,
  unidade,
  onMenos,
  onMais,
  legendaVazio,
}: {
  rotulo: string;
  valor: number | null;
  unidade?: string;
  onMenos: () => void;
  onMais: () => void;
  /** texto pequeno quando não há valor (ex.: "peso do corpo") */
  legendaVazio?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 rounded-cartao border border-borda bg-vidro-forte p-3">
      <span className="t-rotulo text-texto2">{rotulo}</span>
      <div className="flex min-h-[3.75rem] flex-col items-center justify-center" aria-live="polite">
        <span className="num text-[2rem] leading-10 font-bold">
          {valor === null ? "—" : String(valor).replace(".", ",")}
          {unidade && valor !== null && <span className="t-pq ml-1 font-normal text-texto2">{unidade}</span>}
        </span>
        {valor === null && legendaVazio && <span className="t-pq text-texto2">{legendaVazio}</span>}
      </div>
      <div className="grid w-full grid-cols-2 gap-2">
        <button
          type="button"
          aria-label={`Diminuir ${rotulo.toLowerCase()}`}
          onClick={onMenos}
          className="flex h-14 items-center justify-center rounded-full border border-borda bg-vidro text-texto transition-transform duration-100 active:scale-[0.94]"
        >
          <Minus className="size-6" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Aumentar ${rotulo.toLowerCase()}`}
          onClick={onMais}
          className="flex h-14 items-center justify-center rounded-full border border-borda bg-vidro text-texto transition-transform duration-100 active:scale-[0.94]"
        >
          <Plus className="size-6" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
