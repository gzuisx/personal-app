"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Props = {
  titulo: string;
  /** linha pequena acima do título (ex.: data por extenso) */
  sobretitulo?: string;
  voltarPara?: string;
  acao?: React.ReactNode;
  destaque?: boolean;
};

export function Header({ titulo, sobretitulo, voltarPara, acao, destaque }: Props) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {voltarPara && (
          <Link
            href={voltarPara}
            className="-ml-2 mb-1 inline-flex h-11 items-center gap-1 rounded-full px-2 text-[15px] text-texto2"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
            Voltar
          </Link>
        )}
        {sobretitulo && <p className="t-pq text-texto2 first-letter:uppercase">{sobretitulo}</p>}
        <h1 className={destaque ? "t-display" : "t-h1"}>{titulo}</h1>
      </div>
      {acao}
    </header>
  );
}
