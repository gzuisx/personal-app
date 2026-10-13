import { cn } from "@/lib/cn";
import type { Tag } from "@/lib/seed/plano";

const cores: Record<Tag, string> = {
  Tornozelo: "border-realce/60 text-realce-t",
  Força: "border-primario/70 text-texto",
  Velocidade: "border-aviso/70 text-aviso-t",
  Funcional: "border-borda text-texto2",
  Jogo: "border-aviso/70 text-aviso-t",
  Recuperação: "border-ok/70 text-ok-t",
  Folga: "border-borda text-texto2",
  Mobilidade: "border-realce/40 text-texto2",
};

export function TagChip({ tag }: { tag: Tag }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border bg-vidro px-3 text-[13px] leading-none font-medium",
        cores[tag],
      )}
    >
      {tag}
    </span>
  );
}
