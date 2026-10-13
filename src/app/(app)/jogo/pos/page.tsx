"use client";

import { excecoesParaJogos } from "@/lib/coach/agenda";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus, Utensils } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { EscalaDor } from "@/components/ui/escala-dor";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { SkeletonTela } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ocorrenciaDaData } from "@/lib/jogo";
import { dataExtensoISO, horaTexto, ultimoJogo } from "@/lib/tempo";
import { GATILHO_ROTULO, type Gatilho } from "@/lib/tipos";
import { useAgora } from "@/lib/use-agora";

const gatilhos = (Object.keys(GATILHO_ROTULO) as Gatilho[]).map((k) => ({
  valor: k,
  rotulo: GATILHO_ROTULO[k],
}));

function PosJogo() {
  const router = useRouter();
  const params = useSearchParams();
  const agora = useAgora();
  const { status, dados, salvarJogo } = useDados();
  const toast = useToast();

  const [minutos, setMinutos] = useState(80);
  const [esforco, setEsforco] = useState<number | null>(null);
  const [dor, setDor] = useState<number | null>(null);
  const [gatilho, setGatilho] = useState<Gatilho | null>(null);
  const [notas, setNotas] = useState("");
  const [salvando, setSalvando] = useState(false);

  const jogoParam = params.get("jogo");
  const jogo =
    jogoParam && /^\d{4}-\d{2}-\d{2}$/.test(jogoParam)
      ? ocorrenciaDaData(jogoParam, dados.jogos, excecoesParaJogos(dados.excecoes))
      : agora
        ? ultimoJogo(agora)
        : null;
  const inicioISO = jogo?.inicio.toISOString() ?? null;
  const existente = inicioISO ? dados.jogos.find((j) => j.inicio === inicioISO) : undefined;
  const pronto = status === "pronto" && !!agora;

  useEffect(() => {
    if (!pronto) return;
    setMinutos(existente?.minutosJogados ?? 80);
    setEsforco(existente?.esforco ?? null);
    setDor(existente?.dor ?? null);
    setGatilho(existente?.gatilho ?? null);
    setNotas(existente?.notas ?? "");
    // só ao entrar na tela ou trocar de jogo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, inicioISO]);

  if (!pronto) {
    return (
      <main className="pagina-fluxo">
        <SkeletonTela />
      </main>
    );
  }

  if (!jogo || !inicioISO) {
    return (
      <main className="pagina-fluxo">
        <Header voltarPara="/hoje" titulo="Como foi o jogo?" />
        <EmptyState titulo="Nenhum jogo recente" texto="Quando houver um jogo, registre aqui como foi." />
      </main>
    );
  }

  async function salvar() {
    if (dor === null || esforco === null) {
      toast.mostrar("Informe o esforço e a dor, de 0 a 10.", "aviso");
      return;
    }
    setSalvando(true);
    try {
      await salvarJogo({
        id: existente?.id,
        inicio: inicioISO!,
        minutosJogados: minutos,
        esforco,
        dor,
        gatilho: dor >= 1 ? gatilho : null,
        notas: notas.trim() || null,
        status: "jogado",
      });
      toast.mostrar("Jogo registrado");
      router.replace(`/jogo/${jogo!.data}`);
    } catch {
      toast.mostrar("Não foi possível salvar. Tente de novo.", "erro");
      setSalvando(false);
    }
  }

  return (
    <main className="pagina-fluxo space-y-4">
      <Header
        voltarPara="/hoje"
        titulo="Como foi o jogo?"
        sobretitulo={`${dataExtensoISO(jogo.data)} · ${horaTexto(jogo.slot.hora, jogo.slot.min)}`}
      />

      <Banner variante="info">
        <span className="flex items-center gap-2">
          <Utensils className="size-4 shrink-0" aria-hidden="true" />
          Coma proteína e carboidrato em até 1 a 2 horas.
        </span>
      </Banner>

      <GlassCard titulo="Minutos jogados">
        <div className="flex items-center justify-center gap-3">
          <Button
            variante="secundario"
            aria-label="Menos 5 minutos"
            onClick={() => setMinutos((m) => Math.max(0, m - 5))}
          >
            <Minus className="size-5" aria-hidden="true" />5
          </Button>
          <p className="t-h1 num min-w-28 text-center">{minutos} min</p>
          <Button
            variante="secundario"
            aria-label="Mais 5 minutos"
            onClick={() => setMinutos((m) => Math.min(120, m + 5))}
          >
            <Plus className="size-5" aria-hidden="true" />5
          </Button>
        </div>
      </GlassCard>

      <GlassCard titulo="Esforço do jogo">
        <EscalaDor
          variante="esforco"
          valor={esforco}
          onChange={setEsforco}
          rotuloAria="Esforço percebido do jogo"
        />
      </GlassCard>

      <GlassCard titulo="Dor no tornozelo agora">
        <EscalaDor valor={dor} onChange={setDor} rotuloAria="Dor no tornozelo depois do jogo" />
      </GlassCard>

      {dor !== null && dor >= 1 && (
        <GlassCard titulo="O que causou?">
          <ChipGroup rotuloAria="Gatilho da dor" opcoes={gatilhos} valor={gatilho} onChange={setGatilho} />
        </GlassCard>
      )}

      <GlassCard titulo="Notas (opcional)">
        <textarea
          value={notas}
          maxLength={300}
          rows={3}
          aria-label="Notas do jogo"
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Duas decisões boas e duas que poderiam melhorar"
          className="w-full rounded-[16px] border border-borda bg-vidro-forte p-3 text-[0.9375rem] text-texto outline-none placeholder:text-texto3 focus:border-realce-t"
        />
      </GlassCard>

      <Button tamanho="g" className="w-full" carregando={salvando} onClick={salvar}>
        Salvar jogo
      </Button>
    </main>
  );
}

export default function PosJogoPage() {
  return (
    <Suspense fallback={null}>
      <PosJogo />
    </Suspense>
  );
}
