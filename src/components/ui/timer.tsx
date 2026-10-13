"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** segundos; troque a `key` do componente para reiniciar em outra duração */
  duracao: number;
  rodando: boolean;
  onFim?: () => void;
  rotulo?: string;
  tamanho?: number;
};

export function formatarTempo(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function Timer({ duracao, rodando, onFim, rotulo, tamanho = 200 }: Props) {
  const total = duracao * 1000;
  const [restante, setRestante] = useState(total);
  const restanteRef = useRef(total);
  const onFimRef = useRef(onFim);
  useEffect(() => {
    onFimRef.current = onFim;
  });

  useEffect(() => {
    if (!rodando || restanteRef.current <= 0) return;
    const fim = Date.now() + restanteRef.current;
    const id = setInterval(() => {
      const r = Math.max(0, fim - Date.now());
      restanteRef.current = r;
      setRestante(r);
      if (r <= 0) {
        clearInterval(id);
        onFimRef.current?.();
      }
    }, 200);
    return () => clearInterval(id);
  }, [rodando]);

  const espessura = 12;
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const fracao = total > 0 ? restante / total : 0;

  return (
    <div
      className="relative"
      style={{ width: tamanho, height: tamanho }}
      role="timer"
      aria-label={`${rotulo ?? "Tempo restante"}: ${formatarTempo(restante)}`}
    >
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} className="-rotate-90">
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke="var(--border-glass)"
          strokeWidth={espessura}
        />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - fracao)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="t-num">{formatarTempo(restante)}</span>
        {rotulo && <span className="t-pq max-w-[70%] text-center text-texto2">{rotulo}</span>}
      </div>
    </div>
  );
}
