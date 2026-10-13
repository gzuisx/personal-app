"use client";

import { motion } from "motion/react";

/** Ícone de check que "se desenha", com brilho verde. */
export function CheckAnimado({ tamanho = 96 }: { tamanho?: number }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex items-center justify-center rounded-full"
      style={{
        width: tamanho,
        height: tamanho,
        background: "color-mix(in srgb, var(--success) 22%, transparent)",
        boxShadow: "0 0 32px color-mix(in srgb, var(--success) 55%, transparent)",
      }}
      role="img"
      aria-label="Salvo"
    >
      <svg width={tamanho * 0.5} height={tamanho * 0.5} viewBox="0 0 24 24" fill="none">
        <motion.path
          d="M4 12.5 L10 18 L20 6.5"
          stroke="var(--success)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
        />
      </svg>
    </motion.div>
  );
}
