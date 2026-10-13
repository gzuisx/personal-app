"use client";

import { useEffect, useState } from "react";
import { BellOff, Check, ChevronRight, ClipboardCheck, Lightbulb, Play, Smartphone } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { AneisDoDia } from "@/components/features/aneis-do-dia";
import { CheckinSheet } from "@/components/features/checkin-sheet";
import { GameCard } from "@/components/features/game-card";
import { LembretesJogo } from "@/components/features/lembretes-jogo";
import { MetricasHoje } from "@/components/features/metricas-hoje";
import { SemanaEncerrada } from "@/components/features/semana-encerrada";
import { TreinoHojeCard } from "@/components/features/treino-hoje-card";
import { Banner } from "@/components/ui/banner";
import { BotaoAcao } from "@/components/ui/botao-acao";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { IconeBola } from "@/components/ui/icone-bola";
import { SemaforoCard } from "@/components/ui/semaforo-card";
import { SkeletonTela } from "@/components/ui/skeleton";
import { rotuloCarga } from "@/lib/carga";
import { checkinDoDia } from "@/lib/derivados";
import { proximaMelhorAcao, proximoBlocoPendente } from "@/lib/hoje";
import { jogoEmFoco } from "@/lib/jogo";
import { hrefDoBloco } from "@/lib/rotas";
import { sequenciaPendente } from "@/lib/treino/apoio";
import { ALERTA_SEGURANCA, avaliarSeguranca } from "@/lib/safety";
import { dicaDoDia, diaDoPlano, type Bloco } from "@/lib/seed/plano";
import { avaliarSemaforo } from "@/lib/semaforo";
import { dataExtensoISO, dataISO, diasDaSemana, partesSP, saudacao } from "@/lib/tempo";
import { useAgora } from "@/lib/use-agora";

export default function HojePage() {
  const agora = useAgora();
  const { status, erro, recarregar, dados, modo, demo } = useDados();
  const [checkinAberto, setCheckinAberto] = useState(false);
  const [dicaAberta, setDicaAberta] = useState(false);
  const [editar, setEditar] = useState<Bloco | null>(null);

  // Atalho: /hoje?acao=checkin abre o check-in (usado ao terminar um treino com dor e pelos Atalhos do iPhone).
  useEffect(() => {
    if (status !== "pronto") return;
    if (new URLSearchParams(window.location.search).get("acao") === "checkin") setCheckinAberto(true);
  }, [status]);

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
  const fase = dados.faseTornozelo.fase;
  const dia = diaDoPlano(hoje, { fase });
  const semana = diasDaSemana(hoje).map((d) => diaDoPlano(d, { fase }));
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

  const jogo = jogoEmFoco(agora, dados);
  const acao = proximaMelhorAcao({ agora, dia, checkins: dados.checkins, sessoes: dados.sessoes, jogo });
  const proximoBloco = proximoBlocoPendente(dia, dados.sessoes, hora);
  const dica = dicaDoDia(hoje);

  function executarAcao() {
    if (!acao) return;
    if (acao.id === "checkin" || acao.id === "checkin_jogo") setCheckinAberto(true);
  }

  const acaoHref =
    acao?.id === "aquecer"
      ? `/jogo/pre?jogo=${acao.jogoData}`
      : acao?.id === "registrar_jogo"
        ? `/jogo/pos?jogo=${acao.jogoData}`
        : acao?.id === "treino" && acao.blocoId
          ? hrefDoBloco(
              hoje,
              dia.blocos.find((b) => b.id === acao.blocoId) ?? { id: acao.blocoId, exercicios: [] },
            )
          : undefined;

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

      {modo === "local" && !demo && (
        <Banner variante="info">
          <span className="flex items-center gap-2">
            <Smartphone className="size-4 shrink-0" aria-hidden="true" />
            Modo local: seus dados ficam só neste aparelho.
          </span>
        </Banner>
      )}

      {seg.nivel === "bloqueio" && (
        <Banner variante="alerta">
          <strong>{ALERTA_SEGURANCA.split(". ")[0]}.</strong>{" "}
          {ALERTA_SEGURANCA.split(". ").slice(1).join(". ")}
        </Banner>
      )}
      {seg.dorPersistente && seg.nivel !== "bloqueio" && (
        <Banner variante="aviso">
          A dor está persistindo em 3 check-ins seguidos. Procure ortopedista ou fisioterapeuta.
        </Banner>
      )}
      {seg.restricaoAtiva && seg.nivel !== "bloqueio" && seg.falta.length > 0 && (
        <Banner variante="info">
          <strong>Progressão ainda travada.</strong> {seg.falta[0]}
        </Banner>
      )}

      {checkinHoje ? (
        <SemaforoCard indice={0} cor={semaforo.cor} motivo={semaforo.motivo}>
          <div className="flex items-center gap-3">
            <span className="t-h3 flex flex-1 items-center gap-2 text-ok-t">
              <Check className="size-5" aria-hidden="true" />
              Check-in feito
            </span>
            <Button variante="secundario" onClick={() => setCheckinAberto(true)}>
              Editar
            </Button>
          </div>
        </SemaforoCard>
      ) : (
        <GlassCard indice={0} variante="destaque">
          <h2 className="t-h2">Como está seu tornozelo?</h2>
          <p className="t-corpo mt-1 text-texto2">Registre como você está hoje. Leva 30 segundos.</p>
          {semaforo.cor !== "neutro" && (
            <p className="t-pq mt-2 text-texto2">
              Último registro: {semaforo.motivo.replace(/\.$/, "").toLowerCase()}.
            </p>
          )}
          <BotaoAcao
            className="mt-4"
            rotulo="Fazer check-in"
            icone={<ClipboardCheck className="size-5" />}
            onClick={() => setCheckinAberto(true)}
          />
        </GlassCard>
      )}

      {checkinHoje && acao && (
        <GlassCard indice={1} variante="leve">
          <p className="t-rotulo mb-2 text-texto2">Próxima melhor ação</p>
          <BotaoAcao
            rotulo={acao.rotulo}
            href={acaoHref}
            onClick={acaoHref ? undefined : executarAcao}
            icone={
              acao.id === "treino" ? (
                <Play className="size-5" />
              ) : acao.id === "checkin_jogo" ? (
                <ClipboardCheck className="size-5" />
              ) : (
                <IconeBola className="size-5" />
              )
            }
          />
        </GlassCard>
      )}

      <AneisDoDia
        indice={2}
        dia={dia}
        semana={semana}
        sessoes={dados.sessoes}
        checkins={dados.checkins}
        onCheckin={() => setCheckinAberto(true)}
        hrefBloco={(b) => hrefDoBloco(hoje, b)}
        onEditarSessao={setEditar}
      />

      <LembretesJogo agora={agora} indice={3} />

      {diaSemana === 0 && hora >= 18 && (
        <SemanaEncerrada hoje={hoje} checkins={dados.checkins} sessoes={dados.sessoes} indice={3} />
      )}

      <TreinoHojeCard
        indice={4}
        dia={dia}
        rotuloCarga={rotuloCarga(hoje)}
        sessoes={dados.sessoes}
        semProgressao={!seg.podeProgredir && seg.nivel !== "sem_dados"}
        proximoBloco={proximoBloco}
        hrefIniciar={proximoBloco ? hrefDoBloco(hoje, proximoBloco) : undefined}
        sequencia={sequenciaPendente(dia, dados.sessoes)}
        execucao={dados.execucao}
        blocoParaEditar={editar}
        onFecharEdicao={() => setEditar(null)}
      />

      <GameCard indice={5} estado={jogo} agora={agora} onCheckinSeguinte={() => setCheckinAberto(true)} />

      <MetricasHoje checkins={dados.checkins} sessoes={dados.sessoes} hoje={hoje} />

      <GlassCard
        variante="leve"
        indice={6}
        onClick={() => setDicaAberta(true)}
        aria-label="Dica do dia. Toque para ler inteira."
      >
        <p className="t-corpo flex gap-3">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-aviso-t" aria-hidden="true" />
          <span className="line-clamp-2 flex-1">{dica}</span>
          <ChevronRight className="mt-0.5 size-5 shrink-0 text-texto3" aria-hidden="true" />
        </p>
        <p className="t-pq mt-1 pl-8 text-realce-t">Ver mais</p>
      </GlassCard>

      <BottomSheet aberto={dicaAberta} onFechar={() => setDicaAberta(false)} titulo="Dica do dia">
        <p className="t-h3 flex gap-3 font-normal leading-relaxed">
          <Lightbulb className="mt-1 size-5 shrink-0 text-aviso-t" aria-hidden="true" />
          {dica}
        </p>
      </BottomSheet>

      <CheckinSheet
        aberto={checkinAberto}
        onFechar={() => setCheckinAberto(false)}
        data={hoje}
        existente={checkinHoje}
        contexto={
          jogo.passos[2].estado === "ativo" && jogo.registro?.dor != null
            ? `Dor depois do jogo: ${jogo.registro.dor}`
            : undefined
        }
      />
    </main>
  );
}
