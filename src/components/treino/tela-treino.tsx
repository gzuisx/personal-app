"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  ClipboardCheck,
  Flame,
  HelpCircle,
  Pause,
  Play,
  SkipForward,
  X,
} from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { DoeuSheet, PularSheet, TrocarSheet } from "@/components/treino/folhas";
import { Stepper } from "@/components/treino/stepper";
import { Banner } from "@/components/ui/banner";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { CheckAnimado } from "@/components/ui/check-animado";
import { ChipGroup } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { EscalaDor } from "@/components/ui/escala-dor";
import { GlassCard } from "@/components/ui/glass-card";
import { MidiaPlaceholder } from "@/components/ui/midia-placeholder";
import { Segmentado } from "@/components/ui/segmentado";
import { SkeletonTela } from "@/components/ui/skeleton";
import { formatarTempo, Timer } from "@/components/ui/timer";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { sugerirProgressao, type SerieHistorica } from "@/lib/coach/progressao";
import { ALERTA_SEGURANCA, avaliarSeguranca } from "@/lib/safety";
import { diaPlanejado } from "@/lib/coach/dia";
import { ajusteDoModo } from "@/lib/coach/modo";
import { cargasAceitas } from "@/lib/coach/propostas";
import { useCoach, useEscolhaDoDia } from "@/lib/coach/use-coach";
import type { Bloco } from "@/lib/seed/plano";
import { dataISO } from "@/lib/tempo";
import {
  AJUSTES,
  atualizarValores,
  avancar,
  ajustarDescanso,
  botaoPrincipal,
  concluirSerie,
  criarTreino,
  iniciarProximoBloco,
  itemAtual,
  pularExercicio,
  pularProximoBloco,
  progresso,
  registrarDor,
  resumoDoTreino,
  rotuloAlvo,
  segundosDeDescanso,
  terminarDescanso,
  trocarExercicio,
  type Ajuste,
  type EstadoTreino,
} from "@/lib/treino/motor";
import { opcoesDeTroca, sequenciaPendente, sugeridosDaUltimaSessao } from "@/lib/treino/apoio";
import { useAgora } from "@/lib/use-agora";
import { useWakeLock } from "@/lib/use-wake-lock";

const rotuloEsforco = [
  { valor: "facil" as const, rotulo: "Fácil" },
  { valor: "ok" as const, rotulo: "Ok" },
  { valor: "duro" as const, rotulo: "Duro" },
];

function novoId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `t-${Date.now()}`;
}

type Props = { blocoId: string; data: string; sequencia: boolean };

export function TelaTreino({ blocoId, data, sequencia }: Props) {
  const router = useRouter();
  const toast = useToast();
  const agora = useAgora();
  const { status, dados, salvarSerie, salvarExecucao, limparExecucao, salvarSessao } = useDados();

  const [estado, setEstado] = useState<EstadoTreino | null>(null);
  const [ajuste, setAjuste] = useState<Ajuste | null>(null);
  const [descartou, setDescartou] = useState(false);
  const [sair, setSair] = useState(false);
  const [doeu, setDoeu] = useState(false);
  const [pular, setPular] = useState(false);
  const [trocar, setTrocar] = useState(false);
  const [porque, setPorque] = useState(false);
  const [cronometro, setCronometro] = useState(false);
  const [agoraMs, setAgoraMs] = useState(0);
  const [finalizando, setFinalizando] = useState(false);
  const [esforcoGeral, setEsforcoGeral] = useState<number | null>(null);
  const [dorFinal, setDorFinal] = useState<number | null>(null);
  const [notaFinal, setNotaFinal] = useState("");
  const [concluido, setConcluido] = useState(false);
  const [idExecucao] = useState(novoId);

  useWakeLock(!!estado && estado.fase !== "resumo");

  const pronto = status === "pronto" && !!agora;
  const hojeISO = agora ? dataISO(agora) : data;
  const faseTornozelo = dados.faseTornozelo.fase;
  const planejado = useMemo(
    () =>
      diaPlanejado(data, {
        faseTornozelo: dados.faseTornozelo,
        excecoes: dados.excecoes,
        versoes: dados.versoes,
      }),
    [data, dados.faseTornozelo, dados.excecoes, dados.versoes],
  );
  const dia = planejado.dia;
  const coachTodo = useCoach(agora, dados);
  // Sem check-in de hoje a pontuação é só uma estimativa: não reduz o treino por conta dela.
  const coach = coachTodo && dados.checkins.some((c) => c.data === hojeISO) ? coachTodo : null;
  const escolha = useEscolhaDoDia(data);

  const seg = useMemo(
    () =>
      agora
        ? avaliarSeguranca({
            checkins: dados.checkins,
            jogos: dados.jogos,
            hoje: hojeISO,
            agora,
            config: dados.seguranca,
          })
        : null,
    [agora, dados.checkins, dados.jogos, dados.seguranca, hojeISO],
  );

  const execSalva = dados.execucao && dados.execucao.data === data ? dados.execucao : null;

  // ---- blocos escolhidos para esta tela
  const bloco = dia.blocos.find((b) => b.id === blocoId) ?? null;
  const blocosAlvo: Bloco[] = useMemo(() => {
    if (!bloco) return [];
    if (sequencia) {
      const seq = sequenciaPendente(dia, dados.sessoes);
      if (seq && seq.blocos.some((b) => b.id === bloco.id)) return seq.blocos;
    }
    return [bloco];
  }, [bloco, sequencia, dia, dados.sessoes]);

  // ---- modo do dia: escolha do Gabriel (Ajustar treino) > sugestão do coach > segurança
  const modoSugerido: Ajuste = coach
    ? coach.decisao.modo === "completo" || coach.decisao.modo === "reduzido"
      ? planejado.ajusteSugerido === "sem_academia"
        ? "sem_academia"
        : ajusteDoModo(coach.decisao.modo)
      : ajusteDoModo(coach.decisao.modo)
    : seg?.nivel === "bloqueio"
      ? "recuperacao"
      : seg?.nivel === "atencao"
        ? "reduzido"
        : "completo";
  const ajusteAtual = ajuste ?? escolha?.ajuste ?? modoSugerido;
  const minutos = ajuste ? undefined : escolha?.minutos;
  const podeProgredirHoje = coach ? coach.decisao.podeProgredir : !!seg?.podeProgredir;

  const sugeridos = useMemo(() => {
    const base = sugeridosDaUltimaSessao(
      dados.series,
      blocosAlvo.flatMap((b) => b.exercicios.map((e) => e.slug)),
      hojeISO,
      idExecucao,
    );
    // Progressão aceita (5.5): abre já com a carga nova, só se a segurança liberar hoje.
    if (!podeProgredirHoje) return base;
    const aceitas = cargasAceitas(dados.propostas, dados.series);
    for (const [slug, kg] of Object.entries(aceitas)) {
      if (base[slug]) base[slug] = base[slug].map((x) => ({ ...x, cargaKg: kg }));
    }
    return base;
  }, [dados.series, dados.propostas, blocosAlvo, hojeISO, idExecucao, podeProgredirHoje]);

  const previa = useMemo(
    () =>
      pronto && blocosAlvo.length
        ? criarTreino({
            id: idExecucao,
            data,
            blocos: blocosAlvo,
            ajuste: ajusteAtual,
            minutos,
            sequencia,
            agora: 0,
            sugeridos,
          })
        : null,
    [pronto, blocosAlvo, data, ajusteAtual, minutos, sequencia, sugeridos, idExecucao],
  );

  // ---- persistência
  const persistir = useCallback(
    (e: EstadoTreino) => {
      salvarExecucao({
        id: e.id,
        tipo: e.sequencia ? "sequencia" : "bloco",
        data: e.data,
        estado: e,
        atualizadoEm: new Date().toISOString(),
      }).catch(() => toast.mostrar("Não consegui salvar o andamento. Confira a internet.", "aviso"));
    },
    [salvarExecucao, toast],
  );

  const aplicar = useCallback(
    (e: EstadoTreino) => {
      setEstado(e);
      persistir(e);
    },
    [persistir],
  );

  // ---- relógio do descanso
  useEffect(() => {
    if (estado?.fase !== "descanso") return;
    setAgoraMs(Date.now());
    const id = setInterval(() => setAgoraMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [estado?.fase, estado?.descansoFimEm]);

  useEffect(() => {
    if (estado?.fase !== "descanso" || !agoraMs) return;
    if (segundosDeDescanso(estado, agoraMs) <= 0) aplicar(terminarDescanso(estado));
  }, [agoraMs, estado, aplicar]);

  useEffect(() => {
    if (estado?.fase === "resumo" || estado?.fase === "descanso") setAgoraMs(Date.now());
  }, [estado?.fase]);

  useEffect(() => {
    setCronometro(false);
  }, [estado?.idxItem, estado?.idxSerie, estado?.fase]);

  // ---- carregando
  if (!pronto) {
    return (
      <main className="pagina-fluxo">
        <SkeletonTela />
      </main>
    );
  }

  if (!bloco) {
    return (
      <main className="pagina-fluxo">
        <EmptyState
          titulo="Bloco não encontrado"
          texto="Esse bloco não existe no plano deste dia."
          acao={<Button onClick={() => router.replace("/hoje")}>Voltar para a Hoje</Button>}
        />
      </main>
    );
  }

  // ---- retomar treino interrompido
  if (!estado && execSalva && !descartou && execSalva.estado.fase !== "resumo") {
    const e = execSalva.estado;
    const p = progresso(e);
    return (
      <main className="pagina-fluxo space-y-4">
        <GlassCard titulo="Continuar treino de hoje?" variante="destaque">
          <p className="t-corpo text-texto2">
            Você parou no exercício {p.exercicio} de {p.totalExercicios}: {itemAtual(e).nome}.{" "}
            {e.feitas.length} {e.feitas.length === 1 ? "série já registrada" : "séries já registradas"}.
          </p>
          <div className="mt-4 space-y-2">
            <Button tamanho="g" className="w-full" onClick={() => setEstado(e)}>
              Continuar de onde parei
            </Button>
            <Button
              variante="secundario"
              className="w-full"
              onClick={() => {
                setDescartou(true);
                limparExecucao().catch(() => {});
              }}
            >
              Descartar e começar de novo
            </Button>
          </div>
        </GlassCard>
      </main>
    );
  }

  // ---- preparar
  if (!estado) {
    return (
      <main className="pagina-fluxo space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="t-h1">{blocosAlvo.length > 1 ? "Sequência do dia" : bloco.titulo}</h1>
          <Link
            href="/hoje"
            aria-label="Fechar"
            className="flex size-11 items-center justify-center rounded-full text-texto2"
          >
            <X className="size-6" aria-hidden="true" />
          </Link>
        </header>

        {seg?.nivel === "bloqueio" && <Banner variante="alerta">{ALERTA_SEGURANCA}</Banner>}

        <GlassCard variante="destaque" titulo="Modo do dia">
          <p className="t-h2">
            {minutos ? `Só ${minutos} min` : AJUSTES.find((a) => a.valor === ajusteAtual)?.rotulo}
          </p>
          <p className="t-corpo text-texto2">
            {minutos
              ? "O essencial do plano para esse tempo. Fica registrado como parcial."
              : AJUSTES.find((a) => a.valor === ajusteAtual)?.descricao}
          </p>
          <button
            type="button"
            onClick={() => setPorque(true)}
            className="mt-2 inline-flex min-h-11 items-center gap-1 text-[0.9375rem] text-realce-t underline underline-offset-2"
          >
            <HelpCircle className="size-4" aria-hidden="true" /> Por que?
          </button>
          <p className="t-rotulo mt-3 mb-2 text-texto2">Ajustar</p>
          <ChipGroup
            rotuloAria="Ajustar o treino"
            opcoes={AJUSTES.map((a) => ({ valor: a.valor, rotulo: a.rotulo }))}
            valor={ajusteAtual}
            onChange={setAjuste}
          />
          {previa && previa.avisosAjuste.length > 0 && (
            <ul className="t-corpo mt-3 list-inside list-disc text-aviso-t">
              {previa.avisosAjuste.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
        </GlassCard>

        {previa ? (
          <GlassCard
            titulo={`${previa.itens.length} ${previa.itens.length === 1 ? "exercício" : "exercícios"}`}
          >
            {previa.blocos.map((b, bi) => (
              <div key={b.id} className="mb-3 last:mb-0">
                {previa.blocos.length > 1 && (
                  <p className="t-rotulo mb-1 text-texto2">
                    {bi + 1}. {b.titulo} · {b.duracaoMin} min
                  </p>
                )}
                <ol className="space-y-2">
                  {previa.itens
                    .filter((i) => i.blocoIdx === bi)
                    .map((i) => (
                      <li key={i.slug} className="rounded-2xl border border-borda bg-vidro px-3 py-2">
                        <p className="t-h3 leading-snug">{i.nome}</p>
                        <p className="t-pq text-texto2">
                          {i.series} {i.series === 1 ? "série" : "séries"} · {rotuloAlvo(i.alvo)}
                        </p>
                      </li>
                    ))}
                </ol>
              </div>
            ))}
          </GlassCard>
        ) : (
          <Banner variante="aviso">
            Com este ajuste não sobra nenhum exercício. Escolha outro ajuste ou veja o treino completo.
          </Banner>
        )}

        <Button
          tamanho="g"
          className="h-16 w-full"
          disabled={!previa}
          icone={<Play className="size-6" />}
          onClick={() => {
            if (!previa) return;
            aplicar({ ...previa, iniciadoEm: Date.now() });
          }}
        >
          Começar
        </Button>

        <BottomSheet aberto={porque} onFechar={() => setPorque(false)} titulo="Por que este modo?">
          <p className="t-corpo">
            {seg?.nivel === "bloqueio"
              ? `Seu último check-in ficou em bloqueio (${seg.motivoBloqueio ?? "alerta de segurança"}). Hoje o treino vira recuperação, sem carga alta nem impacto.`
              : seg?.nivel === "atencao"
                ? "Seu último check-in ficou em atenção (dor entre 4 e 5, inchaço ou falha). Hoje o treino fica reduzido e sem aumento de carga."
                : "Seus dados recentes estão liberados. O treino segue como no plano."}
          </p>
          <p className="t-pq text-texto2">
            Você sempre pode mudar o modo nos chips. O motor completo do coach (prontidão, sono e carga) entra
            na próxima etapa.
          </p>
        </BottomSheet>
      </main>
    );
  }

  // ---- em andamento
  const e = estado;
  const item = itemAtual(e);
  const prog = progresso(e);
  const botao = botaoPrincipal(e);
  const resumo = resumoDoTreino(e, agoraMs || e.iniciadoEm);

  function acaoPrincipal() {
    switch (botao.acao) {
      case "concluir": {
        if (e.fase !== "executando") return;
        const { estado: novo, serie } = concluirSerie(e, Date.now());
        aplicar(novo);
        salvarSerie({
          execucaoId: e.id,
          data: e.data,
          bloco: serie.bloco,
          exercicio: serie.slug,
          numero: serie.numero,
          cargaKg: serie.cargaKg,
          reps: serie.reps,
          duracaoS: serie.duracaoS,
          rir: null,
          esforco: serie.esforco,
          dorDurante: serie.dorDurante,
          criadoEm: new Date(serie.em).toISOString(),
        }).catch(() => toast.mostrar("Não consegui gravar a série. Confira a internet.", "erro"));
        return;
      }
      case "proxima_serie":
      case "proximo_exercicio":
      case "finalizar":
        aplicar(avancar(e));
        return;
      case "iniciar_bloco":
        aplicar(iniciarProximoBloco(e));
        return;
      default:
        return;
    }
  }

  async function finalizar() {
    setFinalizando(true);
    try {
      for (const b of resumo.blocos) {
        if (b.resultado === "nao_fiz") continue;
        const planejado = b.planejadas || 1;
        await salvarSessao({
          data: e.data,
          bloco: b.id,
          resultado: b.resultado,
          esforco: esforcoGeral,
          duracaoMin: Math.max(1, Math.round(b.duracaoMin * Math.min(1, b.feitas / planejado))),
          notas:
            [notaFinal.trim(), dorFinal !== null ? `Dor ao final: ${dorFinal} de 10.` : ""]
              .filter(Boolean)
              .join(" ") || null,
        });
      }
      await limparExecucao();
      setConcluido(true);
      toast.mostrar("Treino registrado");
    } catch {
      toast.mostrar("Não foi possível salvar o treino. Tente de novo.", "erro");
    } finally {
      setFinalizando(false);
    }
  }

  // histórico e sugestão de progressão (só dica; nada muda sozinho)
  const historico: SerieHistorica[] = dados.series
    .filter((s) => s.exercicio === item.slug && s.execucaoId !== e.id)
    .map((s) => ({
      data: s.data,
      numero: s.numero,
      reps: s.reps,
      cargaKg: s.cargaKg,
      esforco: s.esforco,
      dorDurante: s.dorDurante,
    }));
  const ultima = sugeridos[item.slug]?.[Math.min(e.idxSerie, (sugeridos[item.slug]?.length ?? 1) - 1)];
  const dica =
    item.alvo.kind === "reps" && item.usaCarga && seg
      ? sugerirProgressao({
          series: historico,
          faixa: { min: item.alvo.min, max: item.alvo.max },
          seriesPlano: item.series,
          podeProgredir: seg.podeProgredir && podeProgredirHoje,
          prontidaoOk: coach ? coach.decisao.prontidao.pontuacao >= 75 : undefined,
        })
      : null;

  const alvo = item.alvo;
  const opcoes = opcoesDeTroca(item, {
    fase: faseTornozelo,
    podeProgredir: podeProgredirHoje,
    semAcademia: e.ajuste === "sem_academia",
    dorImpacto: e.dorPendente !== null && e.dorPendente > 3,
  });

  const restante = segundosDeDescanso(e, agoraMs || (e.descansoFimEm ?? 0));
  const totalDescanso = item.descansoS;

  return (
    <main className="pagina-fluxo flex min-h-dvh flex-col gap-4">
      {/* topo: fechar e progresso */}
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Fechar treino"
            onClick={() => setSair(true)}
            className="flex size-14 shrink-0 items-center justify-center rounded-full border border-borda bg-vidro-forte text-texto2"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
          <p className="t-rotulo min-w-0 flex-1 text-right text-texto2" aria-live="polite">
            {e.fase === "resumo"
              ? "Resumo"
              : `Exercício ${prog.exercicio} de ${prog.totalExercicios} · Série ${prog.serie} de ${prog.totalSeries}`}
          </p>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-vidro"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(prog.fracao * 100)}
          aria-label="Progresso do treino"
        >
          <div
            className="h-full rounded-full bg-realce-t transition-[width] duration-300"
            style={{ width: `${prog.fracao * 100}%` }}
          />
        </div>
      </header>

      <>
        {e.fase === "resumo" ? (
          <motion.section
            key="resumo"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {concluido ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <CheckAnimado />
                <h1 className="t-h1">Treino registrado</h1>
                <p className="t-corpo max-w-[320px] text-texto2">
                  Prontidão, carga e Evolução já foram atualizadas com o que você fez.
                </p>
                {(e.encerradoPorDor || (dorFinal !== null && dorFinal >= 4)) && (
                  <Button
                    tamanho="g"
                    className="w-full"
                    icone={<ClipboardCheck className="size-5" />}
                    onClick={() => router.replace("/hoje?acao=checkin")}
                  >
                    Fazer check-in agora
                  </Button>
                )}
                <Button
                  tamanho="g"
                  variante="secundario"
                  className="w-full"
                  onClick={() => router.replace("/hoje")}
                >
                  Voltar para a Hoje
                </Button>
              </div>
            ) : (
              <>
                <h1 className="t-h1">{e.encerradoPorDor ? "Treino encerrado" : "Treino concluído"}</h1>
                {e.encerradoPorDor && (
                  <Banner variante="alerta">
                    {ALERTA_SEGURANCA} Faça o check-in agora para registrar a dor.
                  </Banner>
                )}
                <GlassCard titulo="Resumo">
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="t-pq text-texto2">Duração</dt>
                      <dd className="t-h2 num">{resumo.duracaoMin} min</dd>
                    </div>
                    <div>
                      <dt className="t-pq text-texto2">Séries</dt>
                      <dd className="t-h2 num">
                        {resumo.seriesFeitas}/{resumo.seriesPlanejadas}
                      </dd>
                    </div>
                    <div>
                      <dt className="t-pq text-texto2">Volume</dt>
                      <dd className="t-h2 num">{resumo.volumeKg > 0 ? `${resumo.volumeKg} kg` : "—"}</dd>
                    </div>
                    <div>
                      <dt className="t-pq text-texto2">Maiores cargas</dt>
                      <dd className="t-corpo">
                        {resumo.maioresCargas.length
                          ? resumo.maioresCargas
                              .slice(0, 2)
                              .map((c) => `${c.cargaKg} kg`)
                              .join(" · ")
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                  <ul className="mt-3 space-y-1">
                    {resumo.blocos.map((b) => (
                      <li key={b.id} className="t-corpo flex justify-between gap-2">
                        <span className="min-w-0 truncate">{b.titulo}</span>
                        <span
                          className={cn(
                            b.resultado === "feito"
                              ? "text-ok-t"
                              : b.resultado === "parcial"
                                ? "text-aviso-t"
                                : "text-texto2",
                          )}
                        >
                          {b.resultado === "feito"
                            ? "Feito"
                            : b.resultado === "parcial"
                              ? "Parcial"
                              : "Não fiz"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
                <GlassCard titulo="Esforço percebido do treino">
                  <EscalaDor
                    variante="esforco"
                    valor={esforcoGeral}
                    onChange={setEsforcoGeral}
                    rotuloAria="Esforço do treino"
                  />
                </GlassCard>
                <GlassCard titulo="Dor no tornozelo ao final">
                  <EscalaDor valor={dorFinal} onChange={setDorFinal} rotuloAria="Dor ao final do treino" />
                </GlassCard>
                <GlassCard titulo="Nota (opcional)">
                  <textarea
                    value={notaFinal}
                    maxLength={300}
                    rows={3}
                    aria-label="Nota do treino"
                    onChange={(ev) => setNotaFinal(ev.target.value)}
                    className="w-full rounded-[16px] border border-borda bg-vidro-forte p-3 text-[0.9375rem] text-texto outline-none placeholder:text-texto3 focus:border-realce-t"
                  />
                </GlassCard>
                <Button
                  tamanho="g"
                  className="h-16 w-full"
                  carregando={finalizando}
                  disabled={esforcoGeral === null && !e.encerradoPorDor}
                  onClick={finalizar}
                >
                  Salvar e finalizar
                </Button>
                {esforcoGeral === null && !e.encerradoPorDor && (
                  <p className="t-pq text-center text-texto2">Escolha o esforço de 0 a 10 para salvar.</p>
                )}
              </>
            )}
          </motion.section>
        ) : e.fase === "transicao" ? (
          <motion.section
            key="transicao"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col justify-center gap-4 text-center"
          >
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-ok text-sobre">
              <Check className="size-9" strokeWidth={3} aria-hidden="true" />
            </div>
            <h1 className="t-h1">Bloco concluído</h1>
            <GlassCard variante="destaque">
              <p className="t-rotulo text-texto2">Próximo</p>
              <p className="t-h2">{e.blocos[e.itens[e.idxItem + 1].blocoIdx].titulo}</p>
              <p className="t-corpo text-texto2">
                {e.blocos[e.itens[e.idxItem + 1].blocoIdx].duracaoMin} min
              </p>
            </GlassCard>
          </motion.section>
        ) : e.fase === "descanso" ? (
          <motion.section
            key="descanso"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col items-center justify-center gap-5 text-center"
          >
            <p className="t-rotulo text-texto2">Descanso</p>
            <DescansoAnel restante={restante} total={totalDescanso} />
            <div className="flex w-full gap-3">
              <Button
                variante="secundario"
                className="h-14 flex-1"
                onClick={() => aplicar(ajustarDescanso(e, -15, Date.now()))}
              >
                −15 s
              </Button>
              <Button
                variante="secundario"
                className="h-14 flex-1"
                onClick={() => aplicar(ajustarDescanso(e, 15, Date.now()))}
              >
                +15 s
              </Button>
            </div>
            <Button
              variante="fantasma"
              className="h-14"
              icone={<SkipForward className="size-5" />}
              onClick={() => aplicar(terminarDescanso(e))}
            >
              Pular descanso
            </Button>
            <p className="t-corpo text-texto2">
              Depois:{" "}
              {e.idxSerie + 1 < item.series
                ? `série ${e.idxSerie + 2} de ${item.series} — ${item.nome}`
                : `próximo exercício — ${e.itens[e.idxItem + 1]?.nome ?? ""}`}
            </p>
          </motion.section>
        ) : e.fase === "pronto" ? (
          <motion.section
            key="pronto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col justify-center gap-4 text-center"
          >
            <h1 className="t-h1">
              {botao.acao === "finalizar" ? "Última série feita" : "Descanso concluído"}
            </h1>
            <p className="t-corpo text-texto2">
              {botao.acao === "proxima_serie"
                ? `Próxima: série ${e.idxSerie + 2} de ${item.series} — ${item.nome}`
                : botao.acao === "proximo_exercicio"
                  ? `Próximo: ${e.itens[e.idxItem + 1]?.nome}`
                  : "Toque em Finalizar treino para ver o resumo."}
            </p>
          </motion.section>
        ) : (
          <motion.section
            key={`ex-${e.idxItem}-${e.idxSerie}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {e.blocos.length > 1 && (
              <p className="t-rotulo text-realce-t">{e.blocos[item.blocoIdx].titulo}</p>
            )}
            <h1 className="t-h1 leading-tight">{item.nome}</h1>
            {item.trocadoDe && <p className="t-pq text-aviso-t">Trocado do plano.</p>}

            <MidiaPlaceholder />

            <div className="space-y-1">
              {item.comoFazer.map((l) => (
                <p key={l} className="t-corpo text-texto2">
                  {l}
                </p>
              ))}
              <p className="t-pq flex items-start gap-1.5 text-aviso-t">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {item.cuidado}
              </p>
              {item.observacao && <p className="t-pq text-texto2">{item.observacao}</p>}
            </div>

            <ol className="flex flex-wrap gap-2" aria-label="Séries">
              {Array.from({ length: item.series }, (_, i) => {
                const feita = e.feitas.some((s) => s.item === e.idxItem && s.numero === i + 1);
                return (
                  <li
                    key={i}
                    aria-current={i === e.idxSerie ? "step" : undefined}
                    className={cn(
                      "num flex h-11 min-w-14 items-center justify-center gap-1 rounded-full border-2 px-3 text-[0.9375rem] font-semibold",
                      feita && "border-ok bg-ok text-sobre",
                      !feita && i === e.idxSerie && "border-realce-t text-texto",
                      !feita && i !== e.idxSerie && "border-borda text-texto3",
                    )}
                  >
                    {feita && <Check className="size-4" strokeWidth={3} aria-hidden="true" />}S{i + 1}
                  </li>
                );
              })}
            </ol>

            {(ultima || dica) && (
              <div className="space-y-1">
                {ultima && (
                  <p className="t-pq text-texto2">
                    Última vez: {ultima.reps ?? "—"}
                    {ultima.cargaKg !== null ? ` × ${String(ultima.cargaKg).replace(".", ",")} kg` : ""}
                  </p>
                )}
                {dica?.acao === "subir" && dica.sugeridaKg && (
                  <p className="t-pq flex items-center gap-1 text-ok-t">
                    <Flame className="size-4" aria-hidden="true" />
                    Sugestão: subir para {String(dica.sugeridaKg).replace(".", ",")} kg (só uma sugestão).
                  </p>
                )}
                {dica && dica.acao !== "subir" && dica.acao !== "sem_dados" && (
                  <p className="t-pq text-texto2">{dica.motivo}</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              {alvo.kind === "reps" && (
                <Stepper
                  rotulo="Repetições"
                  valor={e.atual.reps}
                  onMenos={() =>
                    aplicar(atualizarValores(e, { reps: Math.max(0, (e.atual.reps ?? alvo.max) - 1) }))
                  }
                  onMais={() => aplicar(atualizarValores(e, { reps: (e.atual.reps ?? alvo.max) + 1 }))}
                />
              )}
              {alvo.kind === "reps" && item.usaCarga && (
                <Stepper
                  rotulo="Carga"
                  unidade="kg"
                  valor={e.atual.cargaKg}
                  legendaVazio="peso do corpo"
                  onMenos={() =>
                    aplicar(
                      atualizarValores(e, { cargaKg: Math.max(0, (e.atual.cargaKg ?? 0) - item.passoCarga) }),
                    )
                  }
                  onMais={() =>
                    aplicar(atualizarValores(e, { cargaKg: (e.atual.cargaKg ?? 0) + item.passoCarga }))
                  }
                />
              )}
              {alvo.kind === "tempo" && (
                <Stepper
                  rotulo="Tempo"
                  unidade="s"
                  valor={e.atual.duracaoS}
                  onMenos={() =>
                    aplicar(
                      atualizarValores(e, { duracaoS: Math.max(5, (e.atual.duracaoS ?? alvo.segundos) - 5) }),
                    )
                  }
                  onMais={() =>
                    aplicar(atualizarValores(e, { duracaoS: (e.atual.duracaoS ?? alvo.segundos) + 5 }))
                  }
                />
              )}
            </div>

            {alvo.kind === "tempo" && (
              <div className="flex items-center gap-4 rounded-cartao border border-borda bg-vidro-forte p-3">
                <Timer
                  key={`${e.idxItem}-${e.idxSerie}-${e.atual.duracaoS}`}
                  duracao={e.atual.duracaoS ?? alvo.segundos}
                  rodando={cronometro}
                  onFim={() => setCronometro(false)}
                  tamanho={96}
                />
                <Button
                  variante="secundario"
                  className="h-14 flex-1"
                  icone={cronometro ? <Pause className="size-5" /> : <Play className="size-5" />}
                  onClick={() => setCronometro((r) => !r)}
                >
                  {cronometro ? "Pausar" : "Cronômetro"}
                </Button>
              </div>
            )}

            {alvo.kind === "livre" && <p className="t-h3">{alvo.texto}</p>}

            <div>
              <p className="t-rotulo mb-2 text-texto2">Como foi? (opcional)</p>
              <Segmentado
                rotuloAria="Esforço da série"
                opcoes={rotuloEsforco}
                valor={e.atual.esforco}
                onChange={(v) => aplicar(atualizarValores(e, { esforco: v }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variante="secundario" className="h-14 px-2" onClick={() => setDoeu(true)}>
                Doeu
              </Button>
              <Button variante="secundario" className="h-14 px-2" onClick={() => setPular(true)}>
                Pular
              </Button>
              <Button
                variante="secundario"
                className="h-14 px-2"
                icone={<ArrowRightLeft className="size-5" />}
                onClick={() => setTrocar(true)}
              >
                Trocar
              </Button>
            </div>
          </motion.section>
        )}
      </>

      {e.fase !== "resumo" && (
        <div className="sticky bottom-3 mt-auto space-y-2 pt-2">
          {e.fase === "transicao" ? (
            <>
              <Button tamanho="g" className="h-16 w-full" onClick={acaoPrincipal}>
                {botao.rotulo}
              </Button>
              <Button
                variante="fantasma"
                className="h-14 w-full"
                onClick={() => aplicar(pularProximoBloco(e))}
              >
                Pular bloco
              </Button>
            </>
          ) : (
            <Button
              tamanho="g"
              className={cn("h-16 w-full text-[1.1875rem]", botao.desabilitado && "opacity-100")}
              disabled={botao.desabilitado}
              carregando={false}
              icone={botao.acao === "concluir" ? <Check className="size-6" /> : undefined}
              onClick={acaoPrincipal}
            >
              {botao.acao === "descansando" ? `Descansar · ${formatarTempo(restante * 1000)}` : botao.rotulo}
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        aberto={sair}
        titulo="Sair do treino?"
        texto="O que você já fez fica salvo e dá para continuar depois, pela Hoje."
        confirmarRotulo="Sair"
        cancelarRotulo="Continuar treinando"
        onConfirmar={() => {
          setSair(false);
          router.replace("/hoje");
        }}
        onCancelar={() => setSair(false)}
      />

      <DoeuSheet
        aberto={doeu}
        onFechar={() => setDoeu(false)}
        onRegistrar={(dor) => {
          const r = registrarDor(e, dor);
          aplicar(r.estado);
          if (r.aviso.nivel === "encerrar") setDoeu(false);
          return r.aviso;
        }}
        onTrocar={(slug) => {
          aplicar(trocarExercicio(e, slug));
          setDoeu(false);
        }}
        onPular={() => {
          aplicar(pularExercicio(e, "doeu"));
          setDoeu(false);
        }}
      />
      <PularSheet
        aberto={pular}
        onFechar={() => setPular(false)}
        onConfirmar={(motivo) => {
          aplicar(pularExercicio(e, motivo));
          setPular(false);
        }}
      />
      <TrocarSheet
        aberto={trocar}
        onFechar={() => setTrocar(false)}
        opcoes={opcoes}
        onEscolher={(slug) => {
          aplicar(trocarExercicio(e, slug));
          setTrocar(false);
        }}
      />
    </main>
  );
}

/** Anel do descanso: esvazia em tempo real. */
function DescansoAnel({ restante, total }: { restante: number; total: number }) {
  const tamanho = 220;
  const espessura = 14;
  const raio = (tamanho - espessura) / 2;
  const circ = 2 * Math.PI * raio;
  const fracao = total > 0 ? Math.min(1, restante / total) : 0;
  return (
    <div
      className="relative"
      style={{ width: tamanho, height: tamanho }}
      role="timer"
      aria-label={`Descanso: ${formatarTempo(restante * 1000)}`}
    >
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} className="-rotate-90">
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke="var(--border-glass)"
          strokeWidth={espessura}
        />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - fracao)}
          style={{ transition: "stroke-dashoffset 0.25s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="t-num">{formatarTempo(restante * 1000)}</span>
        <span className="t-pq text-texto2">restantes</span>
      </div>
    </div>
  );
}
