"use client";

import { useEffect, useState } from "react";
import { animate } from "motion/react";
import { usePreferencias } from "@/components/providers";

export function CountUp({
  valor,
  casas = 0,
  duracao = 0.6,
}: {
  valor: number;
  casas?: number;
  duracao?: number;
}) {
  const { semMovimento } = usePreferencias();
  const [atual, setAtual] = useState(semMovimento ? valor : 0);

  useEffect(() => {
    if (semMovimento) {
      setAtual(valor);
      return;
    }
    const controle = animate(0, valor, {
      duration: duracao,
      ease: "easeOut",
      onUpdate: setAtual,
    });
    return () => controle.stop();
  }, [valor, duracao, semMovimento]);

  return <span className="num">{atual.toFixed(casas).replace(".", ",")}</span>;
}
