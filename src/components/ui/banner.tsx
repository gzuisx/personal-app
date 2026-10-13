"use client";

import { AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  variante?: "info" | "aviso" | "alerta";
  children: React.ReactNode;
  onDispensar?: () => void;
  className?: string;
};

const estilos = {
  info: "border-realce/40 bg-vidro-forte",
  aviso: "border-aviso/60 bg-vidro-forte",
  alerta: "border-perigo/70 bg-vidro-forte",
} as const;

export function Banner({ variante = "info", children, onDispensar, className }: Props) {
  const Icone = variante === "info" ? Info : AlertTriangle;
  return (
    <div
      role={variante === "alerta" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-2xl border p-3", estilos[variante], className)}
    >
      <Icone
        className={cn(
          "mt-0.5 size-5 shrink-0",
          variante === "info" && "text-realce-t",
          variante === "aviso" && "text-aviso-t",
          variante === "alerta" && "text-perigo-t",
        )}
        aria-hidden="true"
      />
      <div className="t-corpo min-w-0 flex-1">{children}</div>
      {onDispensar && (
        <button
          type="button"
          onClick={onDispensar}
          aria-label="Dispensar aviso"
          className="-my-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-texto2"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
