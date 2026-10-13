"use client";

import { useEffect, useState } from "react";
import { useDados } from "@/components/dados-provider";
import { Button } from "@/components/ui/button";
import { ChipGroupMulti } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/toast";
import { ROTINA_PADRAO, type Rotina } from "@/lib/tipos";

const DIAS = [
  { valor: 1, rotulo: "Seg" },
  { valor: 2, rotulo: "Ter" },
  { valor: 3, rotulo: "Qua" },
  { valor: 4, rotulo: "Qui" },
  { valor: 5, rotulo: "Sex" },
];

const CAMPOS: {
  chave: "acordar" | "dormir" | "saidaPresencial" | "funcionalInicio" | "funcionalFim";
  rotulo: string;
}[] = [
  { chave: "acordar", rotulo: "Acordo" },
  { chave: "dormir", rotulo: "Vou dormir" },
  { chave: "saidaPresencial", rotulo: "Saio nos dias presenciais" },
  { chave: "funcionalInicio", rotulo: "Funcional começa" },
  { chave: "funcionalFim", rotulo: "Funcional termina" },
];

/** Perfil > Rotina: horários e dias presenciais. Alimenta a agenda e os lembretes (etapa 10). */
export function RotinaCard({ indice }: { indice?: number }) {
  const { dados, salvarRotina } = useDados();
  const toast = useToast();
  const [r, setR] = useState<Rotina>(dados.rotina ?? ROTINA_PADRAO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setR(dados.rotina ?? ROTINA_PADRAO);
  }, [dados.rotina]);

  async function salvar() {
    setSalvando(true);
    try {
      await salvarRotina(r);
      toast.mostrar("Rotina salva");
    } catch {
      toast.mostrar("Não consegui salvar. Confira a internet.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <GlassCard indice={indice} titulo="Rotina">
      <div className="grid grid-cols-2 gap-3">
        {CAMPOS.map((c) => (
          <label key={c.chave} className="block">
            <span className="t-rotulo text-texto2">{c.rotulo}</span>
            <input
              type="time"
              value={r[c.chave]}
              onChange={(e) => setR({ ...r, [c.chave]: e.target.value })}
              className="mt-1 block h-12 w-full rounded-2xl border border-borda bg-vidro-forte px-3 text-texto"
            />
          </label>
        ))}
      </div>
      <p className="t-rotulo mt-4 mb-2 text-texto2">Dias presenciais</p>
      <ChipGroupMulti
        rotuloAria="Dias presenciais"
        opcoes={DIAS}
        valores={r.presencial}
        onChange={(v) =>
          setR({ ...r, presencial: v, homeOffice: DIAS.map((d) => d.valor).filter((d) => !v.includes(d)) })
        }
      />
      <Button className="mt-4" disabled={salvando} onClick={salvar}>
        Salvar rotina
      </Button>
    </GlassCard>
  );
}
