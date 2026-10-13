"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Pause, Play, SkipForward } from "lucide-react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { CheckAnimado } from "@/components/ui/check-animado";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { Timer, formatarTempo } from "@/components/ui/timer";
import { cn } from "@/lib/cn";
import { AQUECIMENTO_PRE_JOGO } from "@/lib/seed/plano";

type Etapa = "intro" | "rodando" | "fim";

const total = AQUECIMENTO_PRE_JOGO.reduce((s, f) => s + f.segundos, 0);

export default function PreJogoPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("intro");
  const [fase, setFase] = useState(0);
  const [rodando, setRodando] = useState(false);

  const atual = AQUECIMENTO_PRE_JOGO[fase];

  function proxima() {
    if (fase + 1 >= AQUECIMENTO_PRE_JOGO.length) {
      setRodando(false);
      setEtapa("fim");
    } else {
      setFase((f) => f + 1);
    }
  }

  return (
    <main className="pagina-fluxo space-y-4">
      <Header voltarPara="/hoje" titulo="Modo pré-jogo" />

      <AnimatePresence mode="wait" initial={false}>
        {etapa === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <Banner variante="aviso">Use a tornozeleira com estabilizador nas primeiras semanas.</Banner>
            <GlassCard titulo={`Aquecimento guiado · ${Math.round(total / 60)} min`}>
              <ol className="space-y-3">
                {AQUECIMENTO_PRE_JOGO.map((f, i) => (
                  <li key={f.id} className="flex gap-3">
                    <span className="num flex size-8 shrink-0 items-center justify-center rounded-full bg-primario text-[15px] font-semibold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="t-h3">
                        {f.titulo}{" "}
                        <span className="num t-corpo text-texto2">· {formatarTempo(f.segundos * 1000)}</span>
                      </p>
                      <p className="t-corpo text-texto2">{f.instrucao}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </GlassCard>
            <Button
              tamanho="g"
              className="w-full"
              icone={<Play className="size-5" />}
              onClick={() => {
                setFase(0);
                setEtapa("rodando");
                setRodando(true);
              }}
            >
              Começar aquecimento
            </Button>
          </motion.div>
        )}

        {etapa === "rodando" && (
          <motion.div
            key="rodando"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-6"
          >
            <p className="t-rotulo text-texto2">
              Fase {fase + 1} de {AQUECIMENTO_PRE_JOGO.length}
            </p>
            <div className="flex gap-2" aria-hidden="true">
              {AQUECIMENTO_PRE_JOGO.map((f, i) => (
                <span
                  key={f.id}
                  className={cn(
                    "h-2 w-9 rounded-full",
                    i < fase ? "bg-ok" : i === fase ? "bg-realce" : "bg-borda",
                  )}
                />
              ))}
            </div>
            <h2 className="t-h1 text-center">{atual.titulo}</h2>
            <Timer key={atual.id} duracao={atual.segundos} rodando={rodando} onFim={proxima} tamanho={240} />
            <p className="t-corpo max-w-[320px] text-center text-texto2">{atual.instrucao}</p>
            <div className="flex w-full gap-3">
              <Button
                variante="secundario"
                className="flex-1"
                icone={rodando ? <Pause className="size-5" /> : <Play className="size-5" />}
                onClick={() => setRodando((r) => !r)}
              >
                {rodando ? "Pausar" : "Continuar"}
              </Button>
              <Button
                variante="secundario"
                className="flex-1"
                icone={<SkipForward className="size-5" />}
                onClick={proxima}
              >
                Pular fase
              </Button>
            </div>
          </motion.div>
        )}

        {etapa === "fim" && (
          <motion.div
            key="fim"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-5 py-6 text-center"
          >
            <CheckAnimado />
            <h2 className="t-h1">Pronto para o jogo</h2>
            <p className="t-corpo max-w-[320px] text-texto2">
              Aquecimento completo. Vá para o campo e, se sentir o tornozelo, avise e pare.
            </p>
            <Button tamanho="g" className="w-full" onClick={() => router.replace("/hoje")}>
              Voltar para a Hoje
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
