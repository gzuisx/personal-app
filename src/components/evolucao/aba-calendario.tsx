"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Moon } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ChipGroupMulti } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
import { IconeBola } from "@/components/ui/icone-bola";
import { cn } from "@/lib/cn";
import { ROTULO_MODO } from "@/lib/coach/tipos";
import { decisaoDoDia, getDiaResumo, type DiaResumo } from "@/lib/evolucao/dia";
import { DIAS_SEMANA, dataExtensoISO, diaSemanaISO } from "@/lib/tempo";
import { SONO_ROTULO } from "@/lib/tipos";

type Filtro = "treino" | "jogo" | "dor";
const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: "treino", rotulo: "Treino" },
  { valor: "jogo", rotulo: "Jogo" },
  { valor: "dor", rotulo: "Dor" },
];
const LETRAS = ["S", "T", "Q", "Q", "S", "S", "D"];
const NOME_MES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const COR_DOR = { verde: "bg-ok", amarelo: "bg-aviso", vermelho: "bg-perigo" } as const;
const ROTULO_STATUS = {
  feito: "Feito",
  parcial: "Parcial",
  nao_fiz: "Não fiz",
  pendente: "Planejado",
  sem_registro: "Sem registro",
} as const;
const ROTULO_COR = { verde: "verde", amarelo: "amarelo", vermelho: "vermelho" } as const;

/** Dias do mês em linhas de 7 (segunda a domingo), com vazios antes e depois. */
export function gradeDoMes(ano: number, mes: number): (string | null)[][] {
  const primeiro = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const dias = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const vazios = (diaSemanaISO(primeiro) + 6) % 7;
  const celulas: (string | null)[] = [
    ...Array<null>(vazios).fill(null),
    ...Array.from(
      { length: dias },
      (_, i) => `${ano}-${String(mes).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
    ),
  ];
  while (celulas.length % 7) celulas.push(null);
  return Array.from({ length: celulas.length / 7 }, (_, i) => celulas.slice(i * 7, i * 7 + 7));
}

export function AbaCalendario({ hoje }: { hoje: string }) {
  const { dados } = useDados();
  const [ano, setAno] = useState(Number(hoje.slice(0, 4)));
  const [mes, setMes] = useState(Number(hoje.slice(5, 7)));
  const [filtros, setFiltros] = useState<Filtro[]>(["treino", "jogo", "dor"]);
  const [aberto, setAberto] = useState<string | null>(null);

  const grade = gradeDoMes(ano, mes);
  const mostra = (f: Filtro) => filtros.includes(f);

  function mover(delta: number) {
    const total = ano * 12 + (mes - 1) + delta;
    setAno(Math.floor(total / 12));
    setMes((total % 12) + 1);
  }

  const resumo: DiaResumo | null = aberto ? getDiaResumo(aberto, dados, hoje) : null;
  const decisao =
    aberto && aberto <= hoje && dados.checkins.some((c) => c.data === aberto)
      ? decisaoDoDia(aberto, dados)
      : null;

  return (
    <>
      <GlassCard indice={1}>
        <div className="mb-3 flex items-center gap-2">
          <Button
            variante="secundario"
            className="size-11 !min-w-11 !px-0"
            aria-label="Mês anterior"
            onClick={() => mover(-1)}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Button>
          <h2 className="t-h2 flex-1 text-center capitalize" aria-live="polite">
            {NOME_MES[mes - 1]} de {ano}
          </h2>
          <Button
            variante="secundario"
            className="size-11 !min-w-11 !px-0"
            aria-label="Próximo mês"
            onClick={() => mover(1)}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </Button>
        </div>
        <ChipGroupMulti
          rotuloAria="Mostrar no calendário"
          opcoes={FILTROS}
          valores={filtros}
          onChange={setFiltros}
        />

        <div
          className="mt-3 grid grid-cols-7 gap-1"
          role="group"
          aria-label={`Calendário de ${NOME_MES[mes - 1]}`}
        >
          {LETRAS.map((l, i) => (
            <span key={i} className="t-pq text-center text-texto2" aria-hidden="true">
              {l}
            </span>
          ))}
          {grade.flat().map((iso, i) => {
            if (!iso) return <span key={`v${i}`} />;
            const r = getDiaResumo(iso, dados, hoje);
            const todosFeitos = r.planejados > 0 && r.feitos >= r.planejados;
            const descricao = [
              `${Number(iso.slice(8))} de ${NOME_MES[mes - 1]}`,
              r.hoje ? "hoje" : null,
              r.descanso ? "descanso" : `${r.feitos} de ${r.planejados} treinos`,
              r.jogoPlanejado ? "jogo" : null,
              r.corDor ? `dor ${ROTULO_COR[r.corDor]}` : null,
            ]
              .filter(Boolean)
              .join(", ");
            return (
              <button
                key={iso}
                type="button"
                aria-label={descricao}
                onClick={() => setAberto(iso)}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-start gap-0.5 rounded-xl border p-1 text-texto",
                  r.hoje ? "border-realce bg-vidro-forte" : "border-borda bg-vidro",
                )}
              >
                <span className="t-pq num">{Number(iso.slice(8))}</span>
                <span className="flex h-4 items-center gap-0.5">
                  {mostra("treino") &&
                    (r.descanso ? (
                      <Moon className="size-3 text-texto3" aria-hidden="true" />
                    ) : todosFeitos ? (
                      <Check className="size-3.5 text-ok-t" aria-hidden="true" />
                    ) : (
                      <span className="size-2 rounded-full bg-primario" aria-hidden="true" />
                    ))}
                  {mostra("jogo") && r.jogoPlanejado && <IconeBola className="size-3.5 text-aviso-t" />}
                </span>
                {mostra("dor") && r.corDor ? (
                  <span className={cn("size-2 rounded-full", COR_DOR[r.corDor])} aria-hidden="true" />
                ) : (
                  <span className="size-2" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
        <p className="t-pq mt-3 text-texto2">
          Ponto azul = treino planejado · check = tudo feito · bola = jogo · ponto colorido = dor do check-in
          · lua = descanso
        </p>
      </GlassCard>

      <BottomSheet aberto={!!resumo} onFechar={() => setAberto(null)} titulo="Planejado x realizado">
        {resumo && (
          <div className="space-y-4">
            <div>
              <p className="t-h3">{dataExtensoISO(resumo.data)}</p>
              <p className="t-pq text-texto2">{DIAS_SEMANA[resumo.diaSemana]}</p>
            </div>
            {resumo.avisos.length > 0 && <p className="t-corpo text-aviso-t">{resumo.avisos.join(" · ")}</p>}

            <section>
              <h3 className="t-rotulo mb-2 text-texto2">Treinos</h3>
              {resumo.blocos.length === 0 ? (
                <p className="t-corpo text-texto2">Dia de descanso no plano.</p>
              ) : (
                <ul className="space-y-2">
                  {resumo.blocos.map((b) => (
                    <li key={b.id} className="rounded-2xl border border-borda bg-vidro p-3">
                      <p className="t-corpo">{b.titulo}</p>
                      <p className="t-pq text-texto2">
                        {ROTULO_STATUS[b.status]}
                        {b.sessao?.duracaoMin ? ` · ${b.sessao.duracaoMin} min` : ""}
                        {b.sessao?.esforco != null ? ` · esforço ${b.sessao.esforco}` : ""}
                      </p>
                      {b.sessao?.notas && <p className="t-pq text-texto2">{b.sessao.notas}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="t-rotulo mb-2 text-texto2">Jogo</h3>
              {resumo.jogo ? (
                <p className="t-corpo">
                  {resumo.jogo.minutosJogados ?? "—"} min · esforço {resumo.jogo.esforco ?? "—"} · dor depois{" "}
                  {resumo.jogo.dor ?? "—"}
                </p>
              ) : (
                <p className="t-corpo text-texto2">
                  {resumo.jogoPlanejado
                    ? resumo.futuro
                      ? "Jogo planejado."
                      : "Jogo planejado, sem registro."
                    : "Sem jogo."}
                </p>
              )}
            </section>

            <section>
              <h3 className="t-rotulo mb-2 text-texto2">Check-in</h3>
              {resumo.checkin ? (
                <p className="t-corpo">
                  Dor {resumo.checkin.dor} de 10
                  {resumo.checkin.inchaco ? " · inchaço" : ""}
                  {resumo.checkin.falhou ? " · tornozelo cedeu" : ""}
                  {resumo.checkin.sonoFaixa ? ` · sono ${SONO_ROTULO[resumo.checkin.sonoFaixa]}` : ""}
                </p>
              ) : (
                <p className="t-corpo text-texto2">Sem registro.</p>
              )}
              {resumo.checkin?.observacao && (
                <p className="t-pq text-texto2">Nota: {resumo.checkin.observacao}</p>
              )}
            </section>

            {resumo.testes.length > 0 && (
              <section>
                <h3 className="t-rotulo mb-2 text-texto2">Testes de campo</h3>
                <ul className="t-corpo">
                  {resumo.testes.map((t) => (
                    <li key={t.id}>
                      {t.tipo}: {String(t.valor).replace(".", ",")} {t.unidade}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {decisao && (
              <section>
                <h3 className="t-rotulo mb-2 text-texto2">Decisão do coach</h3>
                <p className="t-corpo">
                  Modo {ROTULO_MODO[decisao.modo]}. {decisao.frase}
                </p>
                <p className="t-pq text-texto2">Recalculada com os registros até esse dia.</p>
              </section>
            )}
          </div>
        )}
      </BottomSheet>
    </>
  );
}
