"use client";

import { useState } from "react";
import { HelpCircle, SlidersHorizontal, Timer } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
import { MINUTOS_DISPONIVEIS } from "@/lib/coach/agenda";
import { guardarEscolhaDoDia, type EscolhaDoDia } from "@/lib/coach/ajuste-dia";
import { ajusteDoModo } from "@/lib/coach/modo";
import { ROTULO_MODO, type Decisao } from "@/lib/coach/tipos";
import { AJUSTES, type Ajuste } from "@/lib/treino/motor";

const AJUSTES_DO_DIA = AJUSTES.filter((a) => a.valor !== "20min");

const COR_MODO: Record<Decisao["modo"], string> = {
  completo: "bg-ok/20 text-ok-t",
  reduzido: "bg-aviso/20 text-aviso-t",
  recuperacao: "bg-perigo/20 text-perigo-t",
  folga: "bg-vidro text-texto2",
};

type Props = {
  indice?: number;
  data: string;
  decisao: Decisao;
  escolha: EscolhaDoDia | null;
  onAbrirCheckin: () => void;
};

/** Cartão "Decisão do dia": modo, frase curta, "Por que?", "Ajustar treino" e "Só tenho X min". Sem porcentagem. */
export function DecisaoDoDia({ indice = 1, data, decisao, escolha, onAbrirCheckin }: Props) {
  const [porque, setPorque] = useState(false);
  const [ajustar, setAjustar] = useState(false);

  const ajusteAtual: Ajuste = escolha?.ajuste ?? ajusteDoModo(decisao.modo);
  const rotuloEscolha = escolha?.minutos
    ? `Só ${escolha.minutos} min`
    : escolha
      ? (AJUSTES.find((a) => a.valor === escolha.ajuste)?.rotulo ?? null)
      : null;

  return (
    <>
      <GlassCard indice={indice} variante="destaque" titulo="Decisão do dia">
        <div className="flex flex-wrap items-center gap-2">
          <span data-testid="modo-do-dia" className={`t-h3 rounded-full px-3 py-1 ${COR_MODO[decisao.modo]}`}>
            Modo {ROTULO_MODO[decisao.modo]}
          </span>
          {rotuloEscolha && <span className="t-pq text-texto2">Você escolheu: {rotuloEscolha}</span>}
        </div>
        <p className="t-corpo mt-2">{decisao.frase}</p>

        {decisao.alertas.length > 0 && (
          <ul className="t-corpo mt-3 space-y-1 text-aviso-t">
            {decisao.alertas.map((a) => (
              <li key={a.texto}>{a.texto}</li>
            ))}
          </ul>
        )}

        {decisao.proximasAcoes.length > 0 && (
          <ul className="mt-3 space-y-2">
            {decisao.proximasAcoes.map((a) => (
              <li key={a.id} className="rounded-2xl border border-borda bg-vidro p-3">
                <p className="t-h3">{a.titulo}</p>
                <p className="t-corpo text-texto2">{a.texto}</p>
                {(a.id === "abrir_checkin" || a.id === "checkin_leve" || a.id === "perguntar_movimento") && (
                  <Button className="mt-2" variante="secundario" onClick={onAbrirCheckin}>
                    Abrir check-in
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variante="secundario" onClick={() => setPorque(true)}>
            <HelpCircle className="size-4" aria-hidden="true" /> Por que?
          </Button>
          <Button variante="secundario" onClick={() => setAjustar(true)}>
            <SlidersHorizontal className="size-4" aria-hidden="true" /> Ajustar treino
          </Button>
        </div>
      </GlassCard>

      <BottomSheet aberto={porque} onFechar={() => setPorque(false)} titulo="Por que este modo?">
        <div className="space-y-4">
          <p className="t-corpo">{decisao.frase}</p>
          {decisao.regras.length === 0 && (
            <p className="t-corpo text-texto2">
              Nenhuma regra especial foi aplicada hoje: só o plano e o seu check-in.
            </p>
          )}
          {decisao.regras.map((r) => (
            <section key={r.id} className="rounded-2xl border border-borda bg-vidro p-3">
              <p className="t-rotulo text-texto2">
                Regra {r.id} · {r.titulo}
              </p>
              <p className="t-corpo mt-1">{r.mensagem}</p>
              <ul className="t-pq mt-2 list-inside list-disc text-texto2">
                {r.porque.dados.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <p className="t-pq mt-2 text-texto2">O que mudaria: {r.porque.mudaria}</p>
            </section>
          ))}
          <section>
            <p className="t-rotulo text-texto2">Dados usados</p>
            <ul className="t-pq mt-1 list-inside list-disc text-texto2">
              {decisao.componentes.map((c) => (
                <li key={c.id}>{c.detalhe}</li>
              ))}
            </ul>
            <p className="t-pq mt-2 text-texto2">
              Pontuação interna do app: {decisao.prontidao.pontuacao}. Não é medida fisiológica.
            </p>
          </section>
          <p className="t-corpo">
            <strong>O que mudaria a decisão:</strong> {decisao.oQueMudaria}
          </p>
          {decisao.motivoBloqueio && (
            <p className="t-corpo text-aviso-t">
              <strong>Sem aumentar carga hoje:</strong> {decisao.motivoBloqueio}
            </p>
          )}
        </div>
      </BottomSheet>

      <BottomSheet aberto={ajustar} onFechar={() => setAjustar(false)} titulo="Ajustar treino">
        <div className="space-y-4">
          <p className="t-corpo text-texto2">
            Sugestão do app: <strong>{ROTULO_MODO[decisao.modo]}</strong>. Você decide como treinar hoje.
          </p>
          <ChipGroup
            rotuloAria="Ajuste do treino de hoje"
            opcoes={AJUSTES_DO_DIA.map((a) => ({ valor: a.valor, rotulo: a.rotulo }))}
            valor={escolha?.minutos ? null : ajusteAtual}
            onChange={(v) => {
              guardarEscolhaDoDia(data, { ajuste: v });
              setAjustar(false);
            }}
          />
          <section>
            <p className="t-rotulo mb-2 flex items-center gap-1 text-texto2">
              <Timer className="size-4" aria-hidden="true" /> Só tenho X min
            </p>
            <ChipGroup
              rotuloAria="Tempo disponível"
              opcoes={MINUTOS_DISPONIVEIS.map((m) => ({ valor: m, rotulo: `${m} min` }))}
              valor={escolha?.minutos ?? null}
              onChange={(m) => {
                guardarEscolhaDoDia(data, { ajuste: ajusteDoModo(decisao.modo), minutos: m });
                setAjustar(false);
              }}
            />
            <p className="t-pq mt-2 text-texto2">
              Monta o essencial do plano para esse tempo e registra como parcial.
            </p>
          </section>
          {escolha && (
            <Button
              variante="fantasma"
              onClick={() => {
                guardarEscolhaDoDia(data, null);
                setAjustar(false);
              }}
            >
              Voltar à sugestão do app
            </Button>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
