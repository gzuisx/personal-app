"use client";

import { Trophy } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/toast";

/** Marcos que o app detectou nos dados; só entram na lista depois que o Gabriel confirma (R14). */
export function MarcosDetectados({ chaves, indice }: { chaves: string[]; indice?: number }) {
  const { dados, alternarMarco } = useDados();
  const toast = useToast();
  const pendentes = chaves
    .map((c) => dados.marcosDefs.find((d) => d.chave === c))
    .filter((d): d is NonNullable<typeof d> => !!d);
  if (!pendentes.length) return null;

  return (
    <div className="space-y-3" data-testid="marcos-detectados">
      {pendentes.map((m, i) => (
        <GlassCard key={m.chave} indice={(indice ?? 0) + i} variante="destaque" titulo="Marco atingido?">
          <p className="t-h3 flex items-center gap-2">
            <Trophy className="size-5 text-aviso-t" aria-hidden="true" /> {m.titulo}
          </p>
          <p className="t-corpo mt-1 text-texto2">O app viu nos seus registros: {m.criterio}. Confirma?</p>
          <Button
            className="mt-3"
            onClick={() =>
              alternarMarco(m.chave)
                .then(() => toast.mostrar("Marco registrado"))
                .catch(() => toast.mostrar("Não consegui salvar. Confira a internet.", "erro"))
            }
          >
            Confirmar marco
          </Button>
        </GlassCard>
      ))}
    </div>
  );
}
