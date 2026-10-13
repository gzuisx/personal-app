"use client";

import { motion } from "motion/react";
import { AlertTriangle, Check, Footprints } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/cn";

export type CorSemaforo = "verde" | "amarelo" | "vermelho" | "neutro";

const visual: Record<CorSemaforo, { fundo: string; titulo: string }> = {
  verde: { fundo: "bg-ok", titulo: "verde" },
  amarelo: { fundo: "bg-aviso", titulo: "amarelo" },
  vermelho: { fundo: "bg-perigo", titulo: "vermelho" },
  neutro: { fundo: "bg-primario", titulo: "sem dados" },
};

type Props = {
  cor: CorSemaforo;
  motivo: string;
  aviso?: string;
  children?: React.ReactNode;
  indice?: number;
};

export function SemaforoCard({ cor, motivo, aviso, children, indice }: Props) {
  const v = visual[cor];
  const Icone = cor === "verde" ? Check : cor === "neutro" ? Footprints : AlertTriangle;
  const forca = cor === "vermelho" ? 1.1 : 1.06;

  return (
    <GlassCard variante="destaque" indice={indice}>
      <div className="flex items-center gap-4">
        <div className="relative flex size-20 shrink-0 items-center justify-center">
          <motion.span
            aria-hidden="true"
            className={cn("absolute inset-0 rounded-full opacity-35", v.fundo)}
            animate={{ scale: [1, forca + 0.12, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className={cn("relative flex size-16 items-center justify-center rounded-full text-sobre", v.fundo)}
            animate={{ scale: [1, forca, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icone className="size-8" strokeWidth={2.5} aria-hidden="true" />
          </motion.span>
        </div>
        <div className="min-w-0">
          <h2 className="t-h2">Tornozelo: {v.titulo}</h2>
          <p className="t-corpo text-texto2">{motivo}</p>
          {aviso && <p className="t-pq mt-1 text-aviso-t">{aviso}</p>}
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </GlassCard>
  );
}
