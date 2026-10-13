"use client";

import { diaPlanejado } from "@/lib/coach/dia";
import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, ChevronDown, Clock, Play } from "lucide-react";
import { BotaoAcao } from "@/components/ui/botao-acao";
import { hrefBiblioteca, hrefDoBloco } from "@/lib/rotas";
import Link from "next/link";
import { IconeBola } from "@/components/ui/icone-bola";
import { useToast } from "@/components/ui/toast";
import { useDados } from "@/components/dados-provider";
import { SessaoSheet } from "@/components/features/sessao-sheet";
import { StatusBloco } from "@/components/features/status-bloco";
import { TagChip } from "@/components/features/tag-chip";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { Demonstracao } from "@/components/demonstracao/demonstracao";
import { SkeletonTela } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { rotuloCarga } from "@/lib/carga";
import type { Sessao } from "@/lib/tipos";
import { sessaoDoBloco } from "@/lib/derivados";
import { avaliarSeguranca } from "@/lib/safety";
import { ROTULO_PERIODO, blocoTreinavel, type Bloco, type ExercicioNoBloco } from "@/lib/seed/plano";
import { dataExtensoISO, dataISO, horaTexto } from "@/lib/tempo";
import { useAgora } from "@/lib/use-agora";

function Exercicio({ e, de }: { e: ExercicioNoBloco; de: string }) {
  const [aberto, setAberto] = useState(false);
  const carga = e.series ? `${e.series} x ${e.repeticoes}` : e.repeticoes;
  const dica = e.observacao ?? e.observacoes;

  return (
    <li className="rounded-2xl border border-borda bg-vidro">
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="t-h3 block leading-snug">{e.nome}</span>
          <span className="t-corpo num text-realce-t">{carga}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-texto2 transition-transform duration-200",
            aberto && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-4 pb-4">
              {dica && <p className="t-corpo text-texto2">{dica}</p>}
              <Demonstracao slug={e.slug} nome={e.nome} compacta />
              <Link
                href={hrefBiblioteca(e.slug, de)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-borda bg-vidro-forte text-[0.9375rem] font-semibold text-realce-t"
              >
                <BookOpen className="size-5" aria-hidden="true" />
                Como fazer e erros comuns
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function NotaFuncional({ data, bloco, sessao }: { data: string; bloco: Bloco; sessao: Sessao | null }) {
  const { salvarSessao } = useDados();
  const toast = useToast();
  const [nota, setNota] = useState(sessao?.notas ?? "");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    try {
      await salvarSessao({
        data,
        bloco: bloco.id,
        resultado: sessao?.resultado ?? "feito",
        esforco: sessao?.esforco ?? null,
        duracaoMin: sessao?.duracaoMin ?? bloco.duracaoMin,
        notas: nota.trim() || null,
      });
      toast.mostrar(sessao ? "Anotação salva" : "Anotação salva e bloco marcado como feito");
    } catch {
      toast.mostrar("Não foi possível salvar. Tente de novo.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <label htmlFor={"nota-" + bloco.id} className="t-h3 block">
        O que foi feito
      </label>
      <textarea
        id={"nota-" + bloco.id}
        value={nota}
        maxLength={300}
        rows={3}
        onChange={(e) => setNota(e.target.value)}
        placeholder="Anote o que o instrutor passou hoje"
        className="w-full rounded-[16px] border border-borda bg-vidro-forte p-3 text-[0.9375rem] text-texto outline-none placeholder:text-texto3 focus:border-realce-t"
      />
      <Button variante="secundario" className="w-full" carregando={salvando} onClick={salvar}>
        {sessao ? "Salvar anotação" : "Salvar e marcar como feito"}
      </Button>
    </div>
  );
}

export default function DetalheDiaPage() {
  const { dia: iso } = useParams<{ dia: string }>();
  const agora = useAgora();
  const { status, dados } = useDados();
  const [sheetAberto, setSheetAberto] = useState(false);
  const [blocoSheet, setBlocoSheet] = useState<Bloco | null>(null);
  const pronto = !!agora && status === "pronto";

  // Links dos anéis e de "Iniciar treino" chegam com #id-do-bloco: rola até ele.
  useEffect(() => {
    if (!pronto) return;
    const alvo = window.location.hash.slice(1);
    if (alvo) document.getElementById(alvo)?.scrollIntoView({ block: "start" });
  }, [pronto]);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(Date.parse(iso))) notFound();

  if (!agora || status === "carregando") {
    return (
      <main className="pagina">
        <SkeletonTela />
      </main>
    );
  }

  const hoje = dataISO(agora);
  const planejado = diaPlanejado(iso, dados);
  const dia = planejado.dia;
  const seg = avaliarSeguranca({
    checkins: dados.checkins,
    jogos: dados.jogos,
    hoje,
    agora,
    config: dados.seguranca,
  });

  function abrir(b: Bloco) {
    setBlocoSheet(b);
    setSheetAberto(true);
  }

  return (
    <main className="pagina space-y-4">
      <Header voltarPara="/semana" titulo={dia.titulo} sobretitulo={dataExtensoISO(iso)} />
      <p className="t-rotulo inline-flex rounded-full border border-borda bg-vidro-forte px-4 py-2 text-texto2">
        Carga: {rotuloCarga(iso)}
      </p>
      {planejado.avisos.length > 0 && (
        <p className="t-corpo rounded-2xl border border-borda bg-vidro-forte p-3 text-texto2">
          {planejado.avisos.join(" · ")}
        </p>
      )}
      {!seg.podeProgredir && seg.nivel !== "sem_dados" && iso >= hoje && (
        <p className="t-corpo rounded-2xl border border-aviso/60 bg-vidro-forte p-3 text-aviso-t">
          Não aumente a carga hoje. Mantenha séries e repetições iguais às últimas sessões.
        </p>
      )}

      {dia.blocos.map((b, i) => {
        const sessao = sessaoDoBloco(dados.sessoes, iso, b.id);
        return (
          <div key={b.id} id={b.id} className="scroll-mt-24">
            <GlassCard indice={i}>
              <p className="t-rotulo text-texto2">
                {ROTULO_PERIODO[b.periodo]}
                {b.horario ? ` · ${b.horario}` : ""}
              </p>
              <h2 className="t-h2 mt-0.5">{b.instrutor ? "Sessão do instrutor" : b.titulo}</h2>
              {b.instrutor && <p className="t-corpo text-texto2">{b.titulo}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {b.duracaoMin > 0 && (
                  <span className="t-pq inline-flex items-center gap-1 text-texto2">
                    <Clock className="size-4" aria-hidden="true" />
                    {b.duracaoMin} min
                  </span>
                )}
                {b.tags.map((t) => (
                  <TagChip key={t} tag={t} />
                ))}
              </div>
              {b.observacao && <p className="t-corpo mt-3 text-texto2">{b.observacao}</p>}

              {b.instrutor && <NotaFuncional data={iso} bloco={b} sessao={sessao} />}

              {b.tags.includes("Jogo") && dia.jogo && (
                <p className="t-h3 mt-3 flex items-center gap-2 text-aviso-t">
                  <IconeBola className="size-5" />
                  Jogo às {horaTexto(dia.jogo.hora, dia.jogo.min)}
                </p>
              )}

              {b.exercicios.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {b.exercicios.map((e) => (
                    <Exercicio key={`${b.id}-${e.slug}`} e={e} de={`/semana/${iso}`} />
                  ))}
                </ul>
              )}

              {blocoTreinavel(b) && b.exercicios.length > 0 && iso === hoje && !sessao && (
                <BotaoAcao
                  className="mt-4"
                  rotulo="Iniciar treino"
                  icone={<Play className="size-5" />}
                  href={hrefDoBloco(iso, b)}
                />
              )}

              {blocoTreinavel(b) && (
                <div className="mt-4 flex items-center gap-3">
                  {sessao ? (
                    <StatusBloco sessao={sessao} nome={b.titulo} onClick={() => abrir(b)} />
                  ) : (
                    <Button className="w-full" onClick={() => abrir(b)}>
                      Marcar bloco como feito
                    </Button>
                  )}
                  {sessao?.notas && <p className="t-pq min-w-0 flex-1 text-texto2">{sessao.notas}</p>}
                </div>
              )}
            </GlassCard>
          </div>
        );
      })}

      {blocoSheet && (
        <SessaoSheet
          aberto={sheetAberto}
          onFechar={() => setSheetAberto(false)}
          data={iso}
          bloco={blocoSheet}
          inicial={sessaoDoBloco(dados.sessoes, iso, blocoSheet.id)}
          resultadoPadrao="feito"
        />
      )}
    </main>
  );
}
