"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { BarChart3, CalendarDays, Home, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/cn";

const abas = [
  { href: "/hoje", rotulo: "Hoje", Icone: Home },
  { href: "/semana", rotulo: "Semana", Icone: CalendarDays },
  { href: "/personal", rotulo: "Personal", Icone: Sparkles },
  { href: "/evolucao", rotulo: "Evolução", Icone: BarChart3 },
  { href: "/perfil", rotulo: "Perfil", Icone: User },
] as const;

// Telas de fluxo escondem a barra (seção 8.1 da especificação).
const rotasSemBarra = ["/jogo/pre", "/login", "/treino"];

/** Barra flutuante em pílula: rótulo visível em todas as abas; a ativa leva o círculo branco. */
export function BottomNav() {
  const pathname = usePathname();
  if (rotasSemBarra.some((r) => pathname.startsWith(r))) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 z-40 flex justify-center px-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <ul className="vidro-blur grid h-[4.5rem] w-full max-w-[420px] grid-cols-5 items-center rounded-full border border-borda px-1.5 shadow-cartao">
        {abas.map(({ href, rotulo, Icone }) => {
          const ativa = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativa ? "page" : undefined}
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full"
              >
                <span className="relative flex size-9 items-center justify-center">
                  {ativa && (
                    <motion.span
                      layoutId="nav-ativo"
                      className="absolute inset-0 rounded-full"
                      style={{ background: "var(--nav-circle)" }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icone
                    className={cn("relative size-6", !ativa && "text-texto2")}
                    strokeWidth={2}
                    style={ativa ? { color: "var(--nav-icon)" } : undefined}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className={cn(
                    "text-[0.8125rem] leading-4 font-medium",
                    ativa ? "text-texto" : "text-texto2",
                  )}
                >
                  {rotulo}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
