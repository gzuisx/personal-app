"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type VarianteBotao = "primario" | "secundario" | "fantasma" | "perigo";
export type TamanhoBotao = "m" | "g";

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold transition-[transform,background-color,opacity] duration-100 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

const variantes: Record<VarianteBotao, string> = {
  primario: "bg-primario text-white shadow-brilho hover:bg-primario-hover active:bg-primario-press",
  secundario: "border border-borda bg-vidro-forte text-texto hover:bg-solido",
  fantasma: "text-texto2 hover:text-texto",
  perigo: "bg-perigo text-sobre",
};

const tamanhos: Record<TamanhoBotao, string> = {
  m: "h-12 min-w-12 px-6 text-[0.9375rem]",
  g: "h-14 min-w-14 px-8 text-[1.0625rem]",
};

export function botaoClasses(
  variante: VarianteBotao = "primario",
  tamanho: TamanhoBotao = "m",
  extra?: string,
) {
  return cn(base, variantes[variante], tamanhos[tamanho], extra);
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  carregando?: boolean;
  icone?: React.ReactNode;
};

export function Button({
  variante = "primario",
  tamanho = "m",
  carregando,
  icone,
  className,
  children,
  disabled,
  type = "button",
  ...resto
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={botaoClasses(variante, tamanho, className)}
      {...resto}
    >
      {carregando ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : icone}
      {children}
    </button>
  );
}

type LinkProps = {
  href: string;
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  className?: string;
  children: React.ReactNode;
};

export function ButtonLink({ href, variante = "primario", tamanho = "m", className, children }: LinkProps) {
  return (
    <Link href={href} className={botaoClasses(variante, tamanho, className)}>
      {children}
    </Link>
  );
}
