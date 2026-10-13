"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { movimento } from "@/lib/design/tokens";

type Props = {
  variante?: "leve" | "forte" | "destaque";
  titulo?: string;
  acao?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  /** posição na lista: atrasa a entrada em 60 ms por item */
  indice?: number;
  className?: string;
  children?: React.ReactNode;
  "aria-label"?: string;
};

const variantes = {
  leve: "bg-vidro border-borda",
  forte: "bg-vidro-forte border-borda shadow-cartao",
  destaque: "bg-vidro-forte border-realce/40 shadow-brilho",
} as const;

export function GlassCard({
  variante = "forte",
  titulo,
  acao,
  onClick,
  href,
  indice = 0,
  className,
  children,
  ...resto
}: Props) {
  const interativo = !!onClick;
  const cartao = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: indice * 0.06, ease: movimento.easing }}
      className={cn(
        "rounded-cartao border p-4",
        variantes[variante],
        (interativo || href) && "cursor-pointer transition-transform duration-100 active:scale-[0.99]",
        className,
      )}
      onClick={onClick}
      role={interativo ? "button" : undefined}
      tabIndex={interativo ? 0 : undefined}
      onKeyDown={
        interativo
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-label={resto["aria-label"]}
    >
      {(titulo || acao) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {titulo && <h2 className="t-h3">{titulo}</h2>}
          {acao}
        </div>
      )}
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-cartao" aria-label={resto["aria-label"]}>
        {cartao}
      </Link>
    );
  }
  return cartao;
}
