"use client";

import { Segmentado } from "@/components/ui/segmentado";

/** Sim / Não: dois botões grandes, a opção ativa em azul com check. */
export function ToggleSimNao({
  valor,
  onChange,
  rotuloAria,
}: {
  valor: boolean;
  onChange: (v: boolean) => void;
  rotuloAria?: string;
}) {
  return (
    <Segmentado
      rotuloAria={rotuloAria}
      valor={valor}
      onChange={onChange}
      opcoes={[
        { valor: false, rotulo: "Não" },
        { valor: true, rotulo: "Sim" },
      ]}
    />
  );
}
