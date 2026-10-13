"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Banner } from "@/components/ui/banner";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { EscalaDor } from "@/components/ui/escala-dor";
import { cn } from "@/lib/cn";
import type { OpcaoTroca } from "@/lib/treino/apoio";
import type { AvisoDor } from "@/lib/treino/motor";
import { CATALOGO_POR_ID } from "@/lib/seed/catalogo";

/** "Doeu": dor durante o exercício, de 0 a 10 (R11). */
export function DoeuSheet({
  aberto,
  onFechar,
  onRegistrar,
  onTrocar,
  onPular,
}: {
  aberto: boolean;
  onFechar: () => void;
  onRegistrar: (dor: number) => AvisoDor;
  onTrocar: (slug: string) => void;
  onPular: () => void;
}) {
  const [dor, setDor] = useState<number | null>(null);
  const [aviso, setAviso] = useState<AvisoDor | null>(null);

  useEffect(() => {
    if (aberto) {
      setDor(null);
      setAviso(null);
    }
  }, [aberto]);

  return (
    <BottomSheet aberto={aberto} onFechar={onFechar} titulo="Doeu?">
      <p className="t-corpo text-texto2">Quanto doeu durante este exercício, de 0 a 10?</p>
      <EscalaDor
        valor={dor}
        onChange={(v) => {
          setDor(v);
          setAviso(onRegistrar(v));
        }}
        rotuloAria="Dor durante o exercício"
      />

      {aviso && (
        <div className="space-y-3">
          <Banner variante={aviso.nivel === "ok" ? "info" : aviso.nivel === "regredir" ? "aviso" : "alerta"}>
            {aviso.mensagem}
          </Banner>
          {aviso.nivel === "ok" && (
            <Button className="w-full" onClick={onFechar}>
              Voltar ao treino
            </Button>
          )}
          {aviso.nivel === "regredir" && (
            <div className="space-y-2">
              {aviso.regressao && CATALOGO_POR_ID[aviso.regressao] && (
                <Button
                  className="w-full"
                  icone={<ArrowRightLeft className="size-5" />}
                  onClick={() => onTrocar(aviso.regressao!)}
                >
                  Trocar por: {CATALOGO_POR_ID[aviso.regressao].nome}
                </Button>
              )}
              <Button variante="secundario" className="w-full" onClick={onPular}>
                Pular este exercício
              </Button>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}

const MOTIVOS = [
  { valor: "sem tempo", rotulo: "Sem tempo" },
  { valor: "doeu", rotulo: "Doeu" },
  { valor: "sem equipamento", rotulo: "Sem equipamento" },
  { valor: "cansado", rotulo: "Cansado" },
  { valor: "outro", rotulo: "Outro" },
];

export function PularSheet({
  aberto,
  onFechar,
  onConfirmar,
}: {
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState<string | null>(null);
  useEffect(() => {
    if (aberto) setMotivo(null);
  }, [aberto]);

  return (
    <BottomSheet
      aberto={aberto}
      onFechar={onFechar}
      titulo="Pular exercício"
      rodape={
        <Button
          tamanho="g"
          className="w-full"
          disabled={!motivo}
          onClick={() => motivo && onConfirmar(motivo)}
        >
          Pular
        </Button>
      }
    >
      <p className="t-corpo text-texto2">Por que você vai pular?</p>
      <ChipGroup rotuloAria="Motivo" opcoes={MOTIVOS} valor={motivo} onChange={setMotivo} />
    </BottomSheet>
  );
}

const ROTULO_TIPO: Record<OpcaoTroca["tipo"], string> = {
  mais_leve: "Mais leve",
  equivalente: "Equivalente",
  mais_dificil: "Mais difícil",
};

export function TrocarSheet({
  aberto,
  onFechar,
  opcoes,
  onEscolher,
}: {
  aberto: boolean;
  onFechar: () => void;
  opcoes: OpcaoTroca[];
  onEscolher: (slug: string) => void;
}) {
  return (
    <BottomSheet aberto={aberto} onFechar={onFechar} titulo="Trocar exercício">
      {opcoes.length === 0 ? (
        <p className="t-corpo text-texto2">Não há troca disponível para este exercício agora.</p>
      ) : (
        <ul className="space-y-3">
          {opcoes.map((o) => (
            <li key={o.item.id}>
              <button
                type="button"
                onClick={() => onEscolher(o.item.id)}
                className="w-full rounded-2xl border border-borda bg-vidro p-4 text-left transition-transform duration-100 active:scale-[0.99]"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="t-h3 leading-snug">{o.item.nome}</span>
                  <span
                    className={cn(
                      "t-pq shrink-0 rounded-full border px-2.5 py-1",
                      o.tipo === "mais_leve" ? "border-ok-t/60 text-ok-t" : "border-borda text-texto2",
                    )}
                  >
                    {ROTULO_TIPO[o.tipo]}
                  </span>
                </span>
                <span className="t-corpo mt-1 block text-texto2">{o.item.comoFazer[0]}</span>
                <span className="t-pq mt-1 flex items-center gap-1 text-aviso-t">
                  <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                  {o.item.cuidado}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
