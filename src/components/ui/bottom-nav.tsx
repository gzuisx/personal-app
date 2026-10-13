"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { BarChart3, CalendarDays, Home, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/cn";

const abas = [
  { href: "/hoje", rotulo: "Hoje", Icone: Home },
  { href: "/semana", rotulo: "Semana", Icone: CalendarDays },
  { href: "/personal", rotulo: "Personal", Icone: Sparkles },
  { href: "/evolucao", rotulo: "Evolução", Icone: BarChart3 },
  { href: "/perfil", rotulo: "Perfil", Icone: User },
] as const;

// Telas de fluxo escondem a barra (secao 8.1 da especificação).
const rotasSemBarra = ["/jogo/pre", "/login"];

export function BottomNav() {
  const pathname = usePathname();
  if (rotasSemBarra.some((r) => pathname.startsWith(r))) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 z-40 flex justify-center px-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <ul className="vidro-blur flex h-16 w-full max-w-[420px] items-center justify-between rounded-full border border-borda px-2 shadow-cartao">
        {abas.map(({ href, rotulo, Icone }) => {
          const ativa = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={rotulo}
                aria-current={ativa ? "page" : undefined}
                className="flex h-12 items-center rounded-full"
              >
                <span className="relative flex size-11 items-center justify-center">
                  {ativa && (
                    <motion.span
                      layoutId="nav-ativo"
                      className="absolute inset-0 rounded-full bg-white"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icone
                    className={cn("relative size-6", ativa ? "text-primario" : "text-texto2")}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </span>
                <AnimatePresence initial={false}>
                  {ativa && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap pr-3 pl-1 text-[13px] font-semibold text-texto"
                    >
                      {rotulo}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
