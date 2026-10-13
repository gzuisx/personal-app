"use client";

import { Check, ClipboardCheck, Lock, Play, Pencil } from "lucide-react";
import { BotaoAcao } from "@/components/ui/botao-acao";
import { GlassCard } from "@/components/ui/glass-card";
import { IconeBola } from "@/components/ui/icone-bola";
import { cn } from "@/lib/cn";
import type { EstadoJogo, IdPasso, Passo } from "@/lib/jogo";
import { JANELA_PRE_JOGO_H, addDias, contagemRegressiva, dataISO, horaTexto } from "@/lib/tempo";
import { SONO_ROTULO } from "@/lib/tipos";

type Props = {
  estado: EstadoJogo;
  agora: Date;
  indice?: number;
  /** abre o check-in do dia seguinte vinculado ao jogo */
  onCheckinSeguinte: () => void;
  /** na página do jogo mostra um aviso a mais e não repete o link para ela */
  naPagina?: boolean;
};

const titulos: Record<IdPasso, string> = {
  antes: "Antes",
  depois: "Depois",
  dia_seguinte: "Dia seguinte",
};

function nomeDia(iso: string, hoje: string) {
  if (iso === hoje) return "Hoje";
  if (iso === addDias(hoje, 1)) return "Amanhã";
  if (iso === addDias(hoje, -1)) return "Ontem";
  return null;
}

function Marcador({ passo, indice }: { passo: Passo; indice: number }) {
  const feito = passo.estado === "concluido";
  return (
    <span
      className={cn(
        "num flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-[0.9375rem] font-semibold",
        feito && "border-ok bg-ok text-sobre",
        passo.estado === "ativo" && "border-realce-t text-realce-t",
        passo.estado === "expirado" && "border-borda text-texto3",
        (passo.estado === "bloqueado" || passo.estado === "pendente") && "border-borda text-texto2",
      )}
      aria-hidden="true"
    >
      {feito ? <Check className="size-5" strokeWidth={3} /> : indice}
    </span>
  );
}

/** Card de jogo com 3 etapas (24.4): antes, depois e dia seguinte. O passo pendente fica em destaque. */
export function GameCard({ estado, agora, indice, onCheckinSeguinte, naPagina }: Props) {
  const { ocorrencia, registro, preLog, checkinSeguinte, passos, foco } = estado;
  const hoje = dataISO(agora);
  const hora = horaTexto(ocorrencia.slot.hora, ocorrencia.slot.min);
  const quando = nomeDia(estado.data, hoje) ?? ocorrencia.slot.nome;
  const msAteInicio = ocorrencia.inicio.getTime() - agora.getTime();
  const minLibera = ocorrencia.slot.hora * 60 + ocorrencia.slot.min - JANELA_PRE_JOGO_H * 60;
  const liberaAntes = horaTexto(Math.floor(minLibera / 60), minLibera % 60);
  const dorDepois = registro?.dor ?? null;
  const rotuloRegistrar = `/jogo/pos?jogo=${estado.data}`;

  function corpo(p: Passo) {
    switch (p.id) {
      case "antes":
        if (p.estado === "concluido")
          return (
            <p className="t-corpo text-texto2">
              Aquecimento feito{preLog ? ` · ${Math.round(preLog.duracaoS / 60)} min` : ""}
              {preLog?.tornozeleira === true
                ? " · tornozeleira"
                : preLog?.tornozeleira === false
                  ? " · sem tornozeleira"
                  : ""}
            </p>
          );
        if (p.estado === "ativo")
          return (
            <div className="space-y-2">
              <ul className="t-corpo list-inside list-disc text-texto2">
                <li>Refeição principal e lanche leve</li>
                <li>Tornozeleira nas primeiras semanas</li>
                <li>Ativação do tornozelo (10 a 12 min)</li>
              </ul>
              <BotaoAcao
                rotulo="Iniciar aquecimento"
                icone={<Play className="size-5" />}
                href={`/jogo/pre?jogo=${estado.data}`}
                variante={foco === "antes" ? "primario" : "secundario"}
              />
            </div>
          );
        if (p.estado === "expirado")
          return <p className="t-corpo text-texto2">Aquecimento não registrado.</p>;
        return <p className="t-corpo text-texto2">Libera 4 h antes ({liberaAntes}).</p>;
      case "depois":
        if (p.estado === "concluido" && registro)
          return (
            <p className="t-corpo text-texto2">
              {registro.minutosJogados ?? "—"} min · esforço {registro.esforco ?? "—"} · dor{" "}
              {registro.dor ?? "—"}
            </p>
          );
        if (p.estado === "ativo")
          return (
            <BotaoAcao
              rotulo="Registrar jogo"
              icone={<IconeBola className="size-5" />}
              href={rotuloRegistrar}
              variante={foco === "depois" ? "primario" : "secundario"}
            />
          );
        if (p.estado === "expirado")
          return (
            <div className="space-y-2">
              <p className="t-corpo text-texto2">A janela de 12 h passou, mas dá para registrar atrasado.</p>
              <BotaoAcao
                rotulo="Registrar atrasado"
                variante="secundario"
                icone={<Pencil className="size-5" />}
                href={rotuloRegistrar}
              />
            </div>
          );
        return <p className="t-corpo text-texto2">Libera quando o jogo acabar.</p>;
      case "dia_seguinte":
        if (p.estado === "concluido" && checkinSeguinte)
          return (
            <p className="t-corpo text-texto2">
              {dorDepois !== null
                ? `Dor depois do jogo: ${dorDepois} → hoje: ${checkinSeguinte.dor}`
                : `Dor no check-in: ${checkinSeguinte.dor}`}
              {checkinSeguinte.sonoFaixa ? ` · sono ${SONO_ROTULO[checkinSeguinte.sonoFaixa]}` : ""}
            </p>
          );
        if (p.estado === "ativo")
          return (
            <div className="space-y-2">
              <p className="t-corpo text-texto2">Como seu tornozelo respondeu ao jogo?</p>
              <BotaoAcao
                rotulo="Fazer check-in"
                icone={<ClipboardCheck className="size-5" />}
                onClick={onCheckinSeguinte}
                variante={foco === "dia_seguinte" ? "primario" : "secundario"}
              />
            </div>
          );
        if (p.estado === "expirado")
          return <p className="t-corpo text-texto2">Sem check-in no dia seguinte.</p>;
        return <p className="t-corpo text-texto2">Libera no dia seguinte ao jogo.</p>;
    }
  }

  return (
    <GlassCard
      indice={indice}
      variante={foco ? "destaque" : "forte"}
      titulo={`Jogo · ${quando}, ${hora}`}
      acao={<IconeBola className="size-7 text-aviso-t" />}
    >
      {msAteInicio > 0 ? (
        <p className="t-corpo -mt-1 mb-3 text-texto2">{contagemRegressiva(msAteInicio)}</p>
      ) : msAteInicio > -80 * 60_000 ? (
        <p className="t-corpo -mt-1 mb-3 text-aviso-t">Jogo em andamento</p>
      ) : null}

      <ol className="space-y-3">
        {passos.map((p, i) => (
          <li
            key={p.id}
            className={cn(
              "flex gap-3 rounded-2xl border p-3",
              foco === p.id ? "border-realce-t bg-vidro" : "border-borda bg-transparent",
              p.estado === "bloqueado" && "opacity-80",
            )}
          >
            <Marcador passo={p} indice={i + 1} />
            <div className="min-w-0 flex-1">
              <p className="t-h3 flex items-center gap-1.5">
                {titulos[p.id]}
                {p.estado === "bloqueado" && (
                  <Lock className="size-4 text-texto3" aria-label="ainda bloqueado" />
                )}
              </p>
              <div className="mt-1">{corpo(p)}</div>
            </div>
          </li>
        ))}
      </ol>

      {!naPagina && (
        <BotaoAcao
          className="mt-3"
          rotulo="Linha do tempo"
          variante="secundario"
          icone={<IconeBola className="size-5" />}
          href={`/jogo/${estado.data}`}
        />
      )}
    </GlassCard>
  );
}
