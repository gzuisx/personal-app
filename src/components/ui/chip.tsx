"use client";

import { cn } from "@/lib/cn";

type ChipProps = {
  selecionado?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Chip({ selecionado, onClick, disabled, className, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selecionado}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 min-w-11 select-none items-center justify-center gap-2 rounded-full border px-4 text-[15px] font-medium transition-[transform,background-color,border-color] duration-100 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        selecionado
          ? "border-primario bg-primario text-white"
          : "border-borda bg-vidro-forte text-texto2",
        className,
      )}
    >
      {children}
    </button>
  );
}

export type Opcao<T extends string | number> = {
  valor: T;
  rotulo: string;
  icone?: React.ReactNode;
};

export function ChipGroup<T extends string | number>({
  opcoes,
  valor,
  onChange,
  rotuloAria,
  className,
}: {
  opcoes: Opcao<T>[];
  valor: T | null;
  onChange: (v: T) => void;
  rotuloAria?: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={rotuloAria} className={cn("flex flex-wrap gap-2", className)}>
      {opcoes.map((o) => (
        <Chip key={String(o.valor)} selecionado={valor === o.valor} onClick={() => onChange(o.valor)}>
          {o.icone}
          {o.rotulo}
        </Chip>
      ))}
    </div>
  );
}

export function ChipGroupMulti<T extends string | number>({
  opcoes,
  valores,
  onChange,
  rotuloAria,
  className,
}: {
  opcoes: Opcao<T>[];
  valores: T[];
  onChange: (v: T[]) => void;
  rotuloAria?: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={rotuloAria} className={cn("flex flex-wrap gap-2", className)}>
      {opcoes.map((o) => {
        const ativo = valores.includes(o.valor);
        return (
          <Chip
            key={String(o.valor)}
            selecionado={ativo}
            onClick={() =>
              onChange(ativo ? valores.filter((v) => v !== o.valor) : [...valores, o.valor])
            }
          >
            {o.icone}
            {o.rotulo}
          </Chip>
        );
      })}
    </div>
  );
}
