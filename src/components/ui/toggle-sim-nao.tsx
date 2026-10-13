"use client";

import { cn } from "@/lib/cn";

export function ToggleSimNao({
  valor,
  onChange,
  rotuloAria,
}: {
  valor: boolean;
  onChange: (v: boolean) => void;
  rotuloAria?: string;
}) {
  const item = (v: boolean, rotulo: string) => (
    <button
      type="button"
      aria-pressed={valor === v}
      onClick={() => onChange(v)}
      className={cn(
        "h-14 flex-1 select-none rounded-full border text-[17px] font-semibold transition-[transform,background-color] duration-100 ease-out active:scale-[0.97]",
        valor === v ? "border-primario bg-primario text-white" : "border-borda bg-vidro-forte text-texto2",
      )}
    >
      {rotulo}
    </button>
  );

  return (
    <div role="group" aria-label={rotuloAria} className="flex gap-3">
      {item(false, "Não")}
      {item(true, "Sim")}
    </div>
  );
}
