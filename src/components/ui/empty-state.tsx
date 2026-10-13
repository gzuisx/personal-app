"use client";

import { motion } from "motion/react";

export function IlustracaoVazia() {
  return (
    <svg viewBox="0 0 160 120" width="160" height="120" aria-hidden="true">
      <defs>
        <linearGradient id="ev-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#4DB8FF" />
          <stop offset="1" stopColor="#1F6BFF" />
        </linearGradient>
      </defs>
      <rect x="14" y="62" width="14" height="38" rx="5" fill="var(--border-glass)" />
      <rect x="36" y="46" width="14" height="54" rx="5" fill="var(--border-glass)" />
      <rect x="58" y="70" width="14" height="30" rx="5" fill="var(--border-glass)" />
      <path
        d="M16 78 C 44 70, 64 44, 96 40"
        fill="none"
        stroke="url(#ev-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 7"
      />
      <circle cx="112" cy="58" r="30" fill="url(#ev-grad)" opacity="0.18" />
      <circle cx="112" cy="58" r="22" fill="none" stroke="url(#ev-grad)" strokeWidth="3" />
      <polygon points="112,46 122,53 118,65 106,65 102,53" fill="url(#ev-grad)" />
      <line x1="10" y1="104" x2="150" y2="104" stroke="var(--border-glass)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  titulo: string;
  texto?: string;
  acao?: React.ReactNode;
  compacto?: boolean;
};

export function EmptyState({ titulo, texto, acao, compacto }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center text-center ${compacto ? "gap-2 py-4" : "gap-3 py-8"}`}
    >
      {!compacto && <IlustracaoVazia />}
      <h2 className="t-h3">{titulo}</h2>
      {texto && <p className="t-corpo max-w-[300px] text-texto2">{texto}</p>}
      {acao}
    </motion.div>
  );
}
