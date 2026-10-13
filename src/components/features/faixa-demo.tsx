"use client";

import { FlaskConical } from "lucide-react";
import { useDados } from "@/components/dados-provider";

/** Faixa fixa no topo de todas as telas enquanto a demonstração (dados fictícios) estiver ligada. */
export function FaixaDemo() {
  const { demo, apagarDemo } = useDados();
  if (!demo) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-aviso px-3 pb-1.5 text-center text-[0.8125rem] leading-4 font-semibold text-sobre"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 6px)" }}
    >
      <FlaskConical className="size-4 shrink-0" aria-hidden="true" />
      <span>DEMONSTRAÇÃO · dados fictícios, só neste aparelho</span>
      <button
        type="button"
        onClick={apagarDemo}
        className="min-h-11 rounded-full px-3 underline underline-offset-2"
      >
        Apagar
      </button>
    </div>
  );
}
