"use client";

import { useEffect, useState } from "react";

/**
 * Hora atual, atualizada a cada `intervaloMs`. Começa `null` (no servidor e na primeira
 * renderização) para a tela não exibir horário velho do build e não quebrar a hidratação.
 */
export function useAgora(intervaloMs = 30_000) {
  const [agora, setAgora] = useState<Date | null>(null);
  useEffect(() => {
    setAgora(new Date());
    const id = setInterval(() => setAgora(new Date()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return agora;
}
