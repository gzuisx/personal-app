"use client";

import { Header } from "@/components/ui/header";
import { GlassCard } from "@/components/ui/glass-card";
import { ChipGroup } from "@/components/ui/chip";
import { ToggleSimNao } from "@/components/ui/toggle-sim-nao";
import { usePreferencias, type Tema } from "@/components/providers";

export default function PerfilPage() {
  const { tema, setTema, reduzirAnimacoes, setReduzirAnimacoes } = usePreferencias();
  return (
    <main className="pagina space-y-4">
      <Header titulo="Perfil" />
      <GlassCard titulo="Aparência" indice={0}>
        <div className="space-y-4">
          <div>
            <p className="t-rotulo mb-2 text-texto2">Tema</p>
            <ChipGroup<Tema>
              rotuloAria="Tema"
              valor={tema}
              onChange={setTema}
              opcoes={[
                { valor: "escuro", rotulo: "Escuro" },
                { valor: "claro", rotulo: "Claro" },
                { valor: "auto", rotulo: "Automático" },
              ]}
            />
          </div>
          <div>
            <p className="t-rotulo mb-2 text-texto2">Reduzir animações</p>
            <ToggleSimNao rotuloAria="Reduzir animações" valor={reduzirAnimacoes} onChange={setReduzirAnimacoes} />
          </div>
        </div>
      </GlassCard>
    </main>
  );
}
