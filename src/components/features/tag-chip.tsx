import { Dumbbell, Footprints, Heart, Moon, PersonStanding, Timer, Users, Zap } from "lucide-react";
import { IconeBola } from "@/components/ui/icone-bola";
import { cn } from "@/lib/cn";
import type { Tag } from "@/lib/seed/plano";

const cores: Record<Tag, string> = {
  Tornozelo: "border-realce-t/60 text-realce-t",
  Força: "border-primario/70 text-texto",
  Velocidade: "border-aviso-t/70 text-aviso-t",
  Arranque: "border-aviso-t/70 text-aviso-t",
  Funcional: "border-borda text-texto2",
  Jogo: "border-aviso-t/70 text-aviso-t",
  Recuperação: "border-ok-t/70 text-ok-t",
  Folga: "border-borda text-texto2",
  Mobilidade: "border-realce-t/40 text-texto2",
};

function Icone({ tag }: { tag: Tag }) {
  const c = "size-4";
  switch (tag) {
    case "Tornozelo":
      return <Footprints className={c} aria-hidden="true" />;
    case "Força":
      return <Dumbbell className={c} aria-hidden="true" />;
    case "Velocidade":
      return <Zap className={c} aria-hidden="true" />;
    case "Arranque":
      return <Timer className={c} aria-hidden="true" />;
    case "Funcional":
      return <Users className={c} aria-hidden="true" />;
    case "Jogo":
      return <IconeBola className={c} />;
    case "Recuperação":
      return <Heart className={c} aria-hidden="true" />;
    case "Folga":
      return <Moon className={c} aria-hidden="true" />;
    case "Mobilidade":
      return <PersonStanding className={c} aria-hidden="true" />;
  }
}

export function TagChip({ tag }: { tag: Tag }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full border bg-vidro px-3 text-[0.8125rem] leading-none font-medium",
        cores[tag],
      )}
    >
      <Icone tag={tag} />
      {tag}
    </span>
  );
}
