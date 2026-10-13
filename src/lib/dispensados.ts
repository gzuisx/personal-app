"use client";

import { useCallback, useEffect, useState } from "react";

const CHAVE = "mp:dispensados";

function ler(): string[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    const lista = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Gatilhos dispensados (botão X) valem só para o dia em que foram dispensados. */
export function useDispensados(hoje: string) {
  const [lista, setLista] = useState<string[]>([]);

  useEffect(() => {
    setLista(ler());
  }, []);

  const dispensar = useCallback(
    (id: string) => {
      const proximo = [...ler().filter((x) => x.startsWith(`${hoje}:`)), `${hoje}:${id}`];
      try {
        localStorage.setItem(CHAVE, JSON.stringify(proximo));
      } catch {
        // sem armazenamento: vale só nesta sessão
      }
      setLista(proximo);
    },
    [hoje],
  );

  const dispensado = useCallback((id: string) => lista.includes(`${hoje}:${id}`), [lista, hoje]);

  return { dispensar, dispensado };
}
