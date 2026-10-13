"use client";

import { useState } from "react";
import { Check, Circle } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { diaConcluido } from "@/components/features/dia-card";
import { GraficoBarras, GraficoDor, type PontoBarra, type PontoDor } from "@/components/features/graficos";
import { AbaCalendario } from "@/components/evolucao/aba-calendario";
import { AbaCarga } from "@/components/evolucao/aba-carga";
import { AbaForca } from "@/components/evolucao/aba-forca";
import { AbaInsights } from "@/components/evolucao/aba-insights";
import { AbaJogos } from "@/components/evolucao/aba-jogos";
import { AbaTestes } from "@/components/evolucao/aba-testes";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { DayStrip, type DiaFaixa } from "@/components/ui/day-strip";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SkeletonTela } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { dorMedia, esforcoMedio, media, sessoesNoPeriodo, sonoMedio } from "@/lib/derivados";
import { diasVerdesSeguidos } from "@/lib/safety";
import { faseGuardada } from "@/lib/seed/fase";
import { diaDoPlano, treinosPlanejados } from "@/lib/seed/plano";
import { DIAS_SEMANA, addDias, dataExtensoISO, dataISO, diasDaSemana } from "@/lib/tempo";
import { GATILHO_ROTULO, SONO_HORAS, type Jogo } from "@/lib/tipos";
import { useAgora } from "@/lib/use-agora";

type Filtro = "semana" | "mes";
type Aba = "resumo" | "calendario" | "carga" | "tornozelo" | "forca" | "testes" | "insights" | "jogos";

const ABAS: { valor: Aba; rotulo: string }[] = [
  { valor: "resumo", rotulo: "Resumo" },
  { valor: "calendario", rotulo: "Calendário" },
  { valor: "carga", rotulo: "Carga" },
  { valor: "tornozelo", rotulo: "Tornozelo" },
  { valor: "forca", rotulo: "Força" },
  { valor: "testes", rotulo: "Testes" },
  { valor: "insights", rotulo: "Insights" },
  { valor: "jogos", rotulo: "Jogos" },
];

const LETRAS = ["S", "T", "Q", "Q", "S", "S", "D"];
const fmt = (v: number | null, casas = 1) => (v === null ? "—" : v.toFixed(casas).replace(".", ","));
const dataBR = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

function corDorTexto(v: number, atencao: number, bloqueio: number) {
  return v >= bloqueio ? "bg-perigo text-sobre" : v >= atencao ? "bg-aviso text-sobre" : "bg-ok text-sobre";
}

export default function EvolucaoPage() {
  const agora = useAgora();
  const { status, erro, recarregar, dados, alternarMarco } = useDados();
  const toast = useToast();
  const [filtro, setFiltro] = useState<Filtro>("semana");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>("resumo");

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
          texto={erro ?? undefined}
          acao={<Button onClick={recarregar}>Tentar de novo</Button>}
        />
      </main>
    );
  }

  const hoje = dataISO(agora);
  const { checkins, sessoes, jogos, seguranca, marcos, marcosDefs } = dados;
  const semana = diasDaSemana(hoje);
  const dias = filtro === "semana" ? semana : Array.from({ length: 30 }, (_, i) => addDias(hoje, i - 29));
  const de = dias[0];
  const ate = dias[dias.length - 1];

  const jogosPorDia = new Map<string, Jogo>();
  for (const j of jogos) jogosPorDia.set(dataISO(new Date(j.inicio)), j);

  const feitos = sessoesNoPeriodo(sessoes, de, ate).length;
  const planejados = dias.reduce((s, d) => s + treinosPlanejados(d), 0);
  const esforco = esforcoMedio(sessoes, de, ate);
  const sono = sonoMedio(checkins, de, ate);

  const pontosDor: PontoDor[] = dias.map((iso, i) => ({
    iso,
    rotulo: filtro === "semana" ? LETRAS[i] : String(Number(iso.slice(8))),
    dor: checkins.find((c) => c.data === iso)?.dor ?? null,
    dorJogo: jogosPorDia.get(iso)?.dor ?? null,
    jogo: !!diaDoPlano(iso).jogo,
  }));
  const pontosEsforco: PontoBarra[] = dias.map((iso, i) => ({
    iso,
    rotulo: filtro === "semana" ? LETRAS[i] : String(Number(iso.slice(8))),
    valor: media(
      sessoes
        .filter((s) => s.data === iso && s.esforco !== null && s.resultado !== "nao_fiz")
        .map((s) => s.esforco!),
    ),
  }));
  const pontosSono: PontoBarra[] = dias.map((iso, i) => {
    const c = checkins.find((x) => x.data === iso);
    return {
      iso,
      rotulo: filtro === "semana" ? LETRAS[i] : String(Number(iso.slice(8))),
      valor: c?.sonoFaixa ? SONO_HORAS[c.sonoFaixa] : null,
    };
  });

  const temDor = pontosDor.some((p) => p.dor !== null || p.dorJogo !== null);
  const temEsforco = pontosEsforco.some((p) => p.valor !== null);
  const temSono = pontosSono.some((p) => p.valor !== null);
  const semNada = !checkins.length && !sessoes.length && !jogos.length;

  const faixa: DiaFaixa[] = semana.map((iso, i) => {
    const p = diaDoPlano(iso);
    return {
      iso,
      letra: LETRAS[i],
      numero: Number(iso.slice(8)),
      rotuloAria: `${DIAS_SEMANA[p.diaSemana]}, ${Number(iso.slice(8))}`,
      hoje: iso === hoje,
      selecionado: iso === (selecionado ?? hoje),
      jogo: !!p.jogo,
      feito: diaConcluido(p, sessoes, hoje),
    };
  });

  const diaSel = selecionado ?? hoje;
  const ckSel = checkins.find((c) => c.data === diaSel);
  const sessoesSel = sessoes.filter((s) => s.data === diaSel && s.resultado !== "nao_fiz");
  const jogoSel = jogosPorDia.get(diaSel);

  const fase = faseGuardada(dados.faseTornozelo, hoje);
  const verdes = diasVerdesSeguidos(checkins, hoje, seguranca);
  const posJogos = [...jogos]
    .filter((j) => j.dor !== null)
    .sort((a, b) => b.inicio.localeCompare(a.inicio))
    .slice(0, 6);

  async function alternar(chave: string) {
    try {
      await alternarMarco(chave);
    } catch {
      toast.mostrar("Não foi possível salvar. Tente de novo.", "erro");
    }
  }

  const descDor = temDor
    ? `Dor do tornozelo por dia, de 0 a 10. ${pontosDor.filter((p) => p.dor !== null).length} registros.`
    : "Sem registros de dor no período.";

  return (
    <main className="pagina space-y-4">
      <Header titulo="Evolução" />

      <div className="-mx-4 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Seções da Evolução">
        <div className="flex w-max gap-2">
          {ABAS.map((a) => (
            <button
              key={a.valor}
              type="button"
              role="tab"
              aria-selected={aba === a.valor}
              onClick={() => setAba(a.valor)}
              className={cn(
                "min-h-11 shrink-0 rounded-full border px-4 font-semibold transition-colors",
                aba === a.valor
                  ? "border-realce bg-primario text-white"
                  : "border-borda bg-vidro-forte text-texto",
              )}
            >
              {a.rotulo}
            </button>
          ))}
        </div>
      </div>

      {aba === "calendario" && <AbaCalendario hoje={hoje} />}
      {aba === "carga" && <AbaCarga hoje={hoje} />}
      {aba === "forca" && <AbaForca hoje={hoje} />}
      {aba === "testes" && <AbaTestes hoje={hoje} />}
      {aba === "insights" && <AbaInsights hoje={hoje} />}
      {aba === "jogos" && <AbaJogos />}

      {aba === "resumo" && (
        <>
          <DayStrip dias={faixa} onSelect={setSelecionado} />

          <GlassCard variante="leve" indice={0}>
            <p className="t-h3">{dataExtensoISO(diaSel)}</p>
            <ul className="t-corpo mt-2 space-y-1 text-texto2">
              <li>
                {ckSel
                  ? `Dor ${ckSel.dor} de 10${ckSel.inchaco ? " · inchaço" : ""}${ckSel.falhou ? " · tornozelo cedeu" : ""}`
                  : "Sem check-in"}
              </li>
              <li>
                {sessoesSel.length
                  ? `${sessoesSel.length} ${sessoesSel.length === 1 ? "treino registrado" : "treinos registrados"}`
                  : "Sem treino registrado"}
              </li>
              {jogoSel && (
                <li className="text-texto">
                  Jogo: {jogoSel.minutosJogados ?? "—"} min · dor depois {jogoSel.dor ?? "—"}
                </li>
              )}
            </ul>
          </GlassCard>

          <ChipGroup<Filtro>
            rotuloAria="Período"
            valor={filtro}
            onChange={setFiltro}
            opcoes={[
              { valor: "semana", rotulo: "Semana" },
              { valor: "mes", rotulo: "Mês" },
            ]}
          />

          {semNada ? (
            <GlassCard indice={1}>
              <EmptyState
                titulo="Ainda sem dados"
                texto="Faça o check-in do dia e registre seus treinos e jogos. Seus gráficos aparecem aqui."
              />
            </GlassCard>
          ) : (
            <>
              <GlassCard indice={1}>
                <div className="grid grid-cols-3 gap-2">
                  <ProgressRing
                    valor={planejados ? feitos / planejados : 0}
                    rotulo="Treinos feitos"
                    descricao={`${feitos} de ${planejados} treinos`}
                    centro={
                      <span className="t-h3 num leading-tight">
                        {feitos}
                        <span className="t-pq text-texto2">/{planejados}</span>
                      </span>
                    }
                    tamanho={92}
                  />
                  <ProgressRing
                    valor={(esforco ?? 0) / 10}
                    rotulo="Esforço médio"
                    cor="var(--primary-hover)"
                    descricao={`Esforço médio ${fmt(esforco)} de 10`}
                    centro={<span className="t-h3 num">{fmt(esforco)}</span>}
                    tamanho={92}
                  />
                  <ProgressRing
                    valor={(sono ?? 0) / 9}
                    rotulo="Sono médio"
                    cor="var(--success)"
                    descricao={`Sono médio ${fmt(sono)} horas`}
                    centro={
                      <span className="t-h3 num leading-tight">
                        {fmt(sono)}
                        <span className="t-pq text-texto2"> h</span>
                      </span>
                    }
                    tamanho={92}
                  />
                </div>
              </GlassCard>

              <GlassCard indice={2} titulo="Dor do tornozelo">
                {temDor ? (
                  <>
                    <GraficoDor
                      pontos={pontosDor}
                      limiteAtencao={seguranca.limiteAtencao}
                      limiteBloqueio={seguranca.limiteBloqueio}
                      descricao={descDor}
                    />
                    <p className="t-pq mt-2 text-texto2">
                      Faixa azul = dia de jogo · losango = dor depois do jogo · linhas tracejadas = limites de
                      atenção e bloqueio
                      {dorMedia(checkins, de, ate) !== null
                        ? ` · média ${fmt(dorMedia(checkins, de, ate))}`
                        : ""}
                    </p>
                  </>
                ) : (
                  <EmptyState
                    compacto
                    titulo="Sem registros de dor"
                    texto="Os check-ins aparecem aqui como uma linha."
                  />
                )}
              </GlassCard>

              <GlassCard indice={3} titulo="Esforço dos treinos">
                {temEsforco ? (
                  <GraficoBarras
                    pontos={pontosEsforco}
                    max={10}
                    descricao="Esforço percebido por dia, de 0 a 10."
                  />
                ) : (
                  <EmptyState
                    compacto
                    titulo="Sem treinos registrados"
                    texto="Registre o esforço ao marcar um treino como feito."
                  />
                )}
              </GlassCard>

              <GlassCard indice={4} titulo="Sono">
                {temSono ? (
                  <GraficoBarras
                    pontos={pontosSono}
                    max={10}
                    cor="var(--success)"
                    descricao="Horas de sono por dia, a partir das faixas do check-in."
                  />
                ) : (
                  <EmptyState
                    compacto
                    titulo="Sem registros de sono"
                    texto="Informe o sono no check-in diário."
                  />
                )}
              </GlassCard>
            </>
          )}
        </>
      )}

      {aba === "tornozelo" && (
        <GlassCard indice={5} titulo="Tornozelo" variante="destaque">
          <p className="t-h2">
            Fase {fase.fase}: {fase.nome}
          </p>
          <p className="t-corpo text-texto2">
            {fase.semanasNaFase
              ? `Semana ${fase.semanaNaFase} de ${fase.semanasNaFase}`
              : `Semana ${fase.semanaNaFase}`}
          </p>
          <div className="mt-3 space-y-2">
            <p className="t-corpo">{fase.criterioAvancar}</p>
            <div
              className="h-3 overflow-hidden rounded-full bg-vidro"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={7}
              aria-valuenow={Math.min(7, verdes)}
              aria-label="Dias verdes seguidos"
            >
              <div
                className="h-full rounded-full bg-ok transition-[width] duration-700"
                style={{ width: `${(Math.min(7, verdes) / 7) * 100}%` }}
              />
            </div>
            <p className="t-pq text-texto2">{Math.min(7, verdes)} de 7 dias verdes seguidos</p>
          </div>

          <h3 className="t-h3 mt-5 mb-2">Dor depois dos jogos</h3>
          {posJogos.length ? (
            <ul className="space-y-2">
              {posJogos.map((j) => {
                const iso = dataISO(new Date(j.inicio));
                return (
                  <li
                    key={j.inicio}
                    className="flex items-center gap-3 rounded-2xl border border-borda bg-vidro p-3"
                  >
                    <span
                      className={cn(
                        "num flex size-10 shrink-0 items-center justify-center rounded-full text-[1.0625rem] font-semibold",
                        corDorTexto(j.dor ?? 0, seguranca.limiteAtencao, seguranca.limiteBloqueio),
                      )}
                      aria-label={`Dor ${j.dor} de 10`}
                    >
                      {j.dor}
                    </span>
                    <div className="min-w-0">
                      <p className="t-corpo">
                        {dataBR(iso)} · {DIAS_SEMANA[diaDoPlano(iso).diaSemana]}
                      </p>
                      <p className="t-pq text-texto2">
                        {j.minutosJogados ?? "—"} min
                        {j.gatilho ? ` · gatilho: ${GATILHO_ROTULO[j.gatilho].toLowerCase()}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="t-corpo text-texto2">Nenhum jogo registrado ainda.</p>
          )}

          <h3 className="t-h3 mt-5 mb-2">Jornada</h3>
          <ul className="space-y-2">
            {marcosDefs.map((def) => {
              const m = marcos.find((x) => x.chave === def.chave);
              const feito = !!m?.concluidoEm;
              return (
                <li key={def.chave}>
                  <button
                    type="button"
                    onClick={() => alternar(def.chave)}
                    aria-pressed={feito}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-2xl border p-3 text-left transition-transform duration-100 active:scale-[0.99]",
                      feito ? "border-ok/60 bg-vidro" : "border-borda bg-vidro",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                        feito ? "border-ok bg-ok text-sobre" : "border-texto3 text-texto3",
                      )}
                    >
                      {feito ? (
                        <Check className="size-5" aria-hidden="true" />
                      ) : (
                        <Circle className="size-3" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="t-h3 block leading-snug">{def.titulo}</span>
                      <span className="t-pq text-texto2">
                        {feito && m?.concluidoEm
                          ? `Concluído em ${dataBR(m.concluidoEm)}`
                          : "Em andamento · toque para concluir"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </GlassCard>
      )}

      {aba === "resumo" && (
        <p className="t-pq px-1 text-texto2">
          Os gráficos de sono usam o valor médio de cada faixa (4,5 · 5,5 · 7,5 · 8,5 h).
        </p>
      )}
    </main>
  );
}
