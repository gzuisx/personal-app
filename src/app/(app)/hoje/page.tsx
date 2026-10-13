"use client";

import { Activity, Dumbbell, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { MetricTile } from "@/components/ui/metric-tile";
import { SemaforoCard } from "@/components/ui/semaforo-card";

// Conteúdo de exemplo da etapa 1. A etapa 2 troca por dados reais.
export default function HojePage() {
  return (
    <main className="pagina space-y-4">
      <Header titulo="Bom dia, Gabriel" sobretitulo="terça, 13 de outubro" destaque />
      <SemaforoCard cor="neutro" motivo="Faça o check-in de hoje." indice={0}>
        <Button tamanho="g" className="w-full">
          Fazer check-in
        </Button>
      </SemaforoCard>
      <GlassCard indice={1} titulo="Treino de hoje">
        <p className="t-corpo text-texto2">Exemplo de cartão.</p>
      </GlassCard>
      <div className="flex gap-3">
        <MetricTile icone={<Activity className="size-5" />} rotulo="Dor" valor={null} />
        <MetricTile icone={<Moon className="size-5" />} rotulo="Sono" valor={null} />
        <MetricTile icone={<Dumbbell className="size-5" />} rotulo="Carga" valor={null} />
      </div>
    </main>
  );
}
