"use client";

import { useState } from "react";
import { BellOff, Check, ClipboardCheck, Lightbulb, Smartphone } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { CheckinSheet } from "@/components/features/checkin-sheet";
import { LembretesJogo } from "@/components/features/lembretes-jogo";
import { MetricasHoje } from "@/components/features/metricas-hoje";
import { ProximoJogoCard } from "@/components/features/proximo-jogo-card";
import { SemanaEncerrada } from "@/components/features/semana-encerrada";
import { TreinoHojeCard } from "@/components/features/treino-hoje-card";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { SemaforoCard } from "@/components/ui/semaforo-card";
import { SkeletonTela } from "@/components/ui/skeleton";
import { rotuloCarga } from "@/lib/carga";
import { checkinDoDia } from "@/lib/derivados";
import { avaliarSeguranca } from "@/lib/safety";
import { dicaDoDia, diaDoPlano } from "@/lib/seed/plano";
import { avaliarSemaforo } from "@/lib/semaforo";
import { dataExtensoISO, dataISO, partesSP, saudacao } from "@/lib/tempo";
import { useAgora } from "@/lib/use-agora";

export default function HojePage() {
  const agora = useAgora();
  const { status, erro, recarregar, dados, modo } = useDados();
  const [checkinAberto, setCheckinAberto] = useState(false);

  if (!agora || status === "carregando") {
    return (
      <main className="pagina">
        <SkeletonTela />
      </main>
    );
  }

  if (status === "erro") {
    return (
      <main className="pagina">
        <EmptyState
          titulo="Não deu para carregar"
          texto={erro ?? "Verifique a conexão e tente de novo."}
          acao={<Button onClick={recarregar}>Tentar de novo</Button>}
        />
      </main>
    );
  }

  const hoje = dataISO(agora);
  const { hora, diaSemana } = partesSP(agora);
  const dia = diaDoPlano(hoje);
  const checkinHoje = checkinDoDia(dados.checkins, hoje);

  const seg = avaliarSeguranca({
    checkins: dados.checkins,
    jogos: dados.jogos,
    hoje,
    agora,
    config: dados.seguranca,
  });
  const semaforo = avaliarSemaforo({
    checkins: dados.checkins,
    jogos: dados.jogos,
    hoje,
    agora,
    config: dados.seguranca,
  });

  const mostrarPendente = hora >= 6 && !checkinHoje;

  return (
    <main className="pagina space-y-4">
      <Header
        destaque
        titulo={saudacao(agora, dados.perfil.nome)}
        sobretitulo={dataExtensoISO(hoje)}
        acao={
          <button
            type="button"
            disabled
            aria-label="Notificações (em breve)"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-borda bg-vidro-forte text-texto3"
          >
            <BellOff className="size-5" aria-hidden="true" />
          </button>
        }
      />

      {modo === "local" && (
        <Banner variante="info">
          <span className="flex items-center gap-2">
            <Smartphone className="size-4 shrink-0" aria-hidden="true" />
            Modo local: seus dados ficam só neste aparelho.
          </span>
        </Banner>
      )}

      {seg.nivel === "bloqueio" && (
        <Banner variante="alerta">
          <strong>Hoje não aumente a carga.</strong> Se a dor persistir, procure ortopedista ou fisioterapeuta.
        </Banner>
      )}
      {seg.dorPersistente && seg.nivel !== "bloqueio" && (
        <Banner variante="aviso">
          A dor está persistindo em 3 check-ins seguidos. Procure ortopedista ou fisioterapeuta.
        </Banner>
      )}

      <SemaforoCard
        indice={0}
        cor={semaforo.cor}
        motivo={semaforo.motivo}
        aviso={mostrarPendente ? (semaforo.avisoCheckin ?? undefined) : undefined}
      >
        {checkinHoje ? (
          <div className="flex items-center gap-3">
            <span className="t-h3 flex flex-1 items-center gap-2 text-ok-t">
              <Check className="size-5" aria-hidden="true" />
              Check-in feito
            </span>
            <Button variante="secundario" onClick={() => setCheckinAberto(true)}>
              Editar
            </Button>
          </div>
        ) : (
          <Button tamanho="g" className="w-full" icone={<ClipboardCheck className="size-5" />} onClick={() => setCheckinAberto(true)}>
            Fazer check-in
          </Button>
        )}
      </SemaforoCard>

      <LembretesJogo agora={agora} indice={1} />

      <ProximoJogoCard agora={agora} jogos={dados.jogos} indice={2} />

      {diaSemana === 0 && hora >= 18 && (
        <SemanaEncerrada hoje={hoje} checkins={dados.checkins} sessoes={dados.sessoes} indice={3} />
      )}

      <TreinoHojeCard
        indice={3}
        dia={dia}
        rotuloCarga={rotuloCarga(hoje)}
        sessoes={dados.sessoes}
        semProgressao={!seg.podeProgredir && seg.nivel !== "sem_dados"}
      />

      <MetricasHoje checkins={dados.checkins} sessoes={dados.sessoes} hoje={hoje} />

      <GlassCard variante="leve" indice={4}>
        <p className="t-corpo flex gap-3">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-aviso-t" aria-hidden="true" />
          <span className="line-clamp-2">{dicaDoDia(hoje)}</span>
        </p>
      </GlassCard>

      <CheckinSheet aberto={checkinAberto} onFechar={() => setCheckinAberto(false)} data={hoje} existente={checkinHoje} />
    </main>
  );
}
