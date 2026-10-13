"use client";

import Link from "next/link";
import { ChevronRight, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

type Variante = "primario" | "secundario" | "ciano";

const estilos: Record<Variante, string> = {
  primario: "bg-primario text-white shadow-brilho hover:bg-primario-hover active:bg-primario-press",
  secundario: "border border-borda bg-vidro-forte text-texto",
  ciano: "border-2 border-realce-t bg-transparent text-texto",
};

type Props = {
  rotulo: string;
  icone?: React.ReactNode;
  variante?: Variante;
  href?: string;
  onClick?: () => void;
  carregando?: boolean;
  /** quando presente, o botão fica desabilitado, com cadeado e este texto (ex.: "Em breve") */
  emBreve?: string;
  className?: string;
  /** esconde a seta da direita */
  semSeta?: boolean;
};

/** Pílula larga (56 px) com ícone à esquerda e seta à direita: ação principal dos cartões. */
export function BotaoAcao({
  rotulo,
  icone,
  variante = "primario",
  href,
  onClick,
  carregando,
  emBreve,
  className,
  semSeta,
}: Props) {
  const classes = cn(
    "flex h-14 w-full select-none items-center gap-2 rounded-full px-3 text-[1.0625rem] font-semibold transition-[transform,background-color,opacity] duration-100 ease-out active:scale-[0.98]",
    estilos[variante],
    emBreve && "pointer-events-none border border-borda bg-vidro text-texto3 opacity-80 shadow-none",
    className,
  );

  const conteudo = (
    <>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          variante === "primario" ? "bg-white/20" : "bg-vidro",
        )}
      >
        {carregando ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : emBreve ? (
          <Lock className="size-5" aria-hidden="true" />
        ) : (
          icone
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-left">
        {carregando ? "Salvando..." : emBreve ? `${rotulo} · ${emBreve}` : rotulo}
      </span>
      {!semSeta && !emBreve && !carregando && <ChevronRight className="size-6 shrink-0" aria-hidden="true" />}
    </>
  );

  if (href && !emBreve) {
    return (
      <Link href={href} className={classes}>
        {conteudo}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!!emBreve || carregando}
      aria-busy={carregando || undefined}
      className={classes}
    >
      {conteudo}
    </button>
  );
}
