"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, BookOpen } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { Banner } from "@/components/ui/banner";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/toast";
import {
  AVISO_TROCA_FOCO,
  faseDoProtocoloDoFoco,
  faseInicialDoFoco,
  rotulosDoFoco,
  textoSegurancaTroca,
  type LadoFoco,
  type RegiaoFoco,
} from "@/lib/foco";
import { AVISO_PROTOCOLO, PROTOCOLOS, REGIOES_FOCO } from "@/lib/seed/protocolos";

const dataBR = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/** Perfil > Foco de lesão: mostra o foco ativo e permite trocar, com confirmação e o texto de segurança. */
export function FocoCard({ indice }: { indice: number }) {
  const { dados, trocarFoco } = useDados();
  const toast = useToast();
  const foco = dados.foco;
  const rot = rotulosDoFoco(foco);
  const fase = faseDoProtocoloDoFoco(foco);

  const [aberto, setAberto] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [regiao, setRegiao] = useState<RegiaoFoco>(foco.regiao);
  const [lado, setLado] = useState<LadoFoco>(foco.lado);
  const [notas, setNotas] = useState("");
  const [salvando, setSalvando] = useState(false);

  const mesmo = regiao === foco.regiao && lado === foco.lado;
  const destino = rotulosDoFoco({ regiao, lado });
  const faseNova = faseInicialDoFoco(regiao, dados.faseTornozelo.fase);

  function abrir() {
    setRegiao(foco.regiao);
    setLado(foco.lado);
    setNotas("");
    setAberto(true);
  }

  async function confirmarTroca() {
    setConfirmar(false);
    setSalvando(true);
    try {
      await trocarFoco({ regiao, lado, notas });
      setAberto(false);
      toast.mostrar(`Foco trocado: ${destino.nome}`);
    } catch {
      toast.mostrar("Não foi possível trocar o foco. Tente de novo.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <GlassCard indice={indice} titulo="Foco de lesão" variante="destaque">
      <p className="t-h2 first-letter:uppercase">{rot.nome}</p>
      <p className="t-corpo mt-1 text-texto2">
        Fase {fase.fase}: {fase.nome}. Desde {dataBR(foco.inicio)}.
      </p>
      <p className="t-corpo mt-2">{fase.objetivo}</p>
      {fase.restricoes.nota && <p className="t-pq mt-2 text-texto2">{fase.restricoes.nota}</p>}
      <p className="t-pq mt-2 text-texto2">{AVISO_PROTOCOLO}</p>
      <div className="mt-4 grid gap-3">
        <Button variante="secundario" icone={<ArrowLeftRight className="size-5" />} onClick={abrir}>
          Trocar foco
        </Button>
        <Link
          href={`/biblioteca?foco=${foco.regiao}`}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full text-[0.9375rem] font-semibold text-realce-t"
        >
          <BookOpen className="size-5" aria-hidden="true" />
          Exercícios do foco na biblioteca
        </Link>
      </div>

      <BottomSheet
        aberto={aberto}
        onFechar={() => setAberto(false)}
        titulo="Trocar o foco de lesão"
        rodape={
          <Button
            tamanho="g"
            className="w-full"
            disabled={mesmo}
            carregando={salvando}
            onClick={() => setConfirmar(true)}
          >
            Trocar foco
          </Button>
        }
      >
        <Banner variante="aviso">{AVISO_TROCA_FOCO}</Banner>
        <section className="space-y-2">
          <h3 className="t-h3">Região</h3>
          <ChipGroup<RegiaoFoco>
            rotuloAria="Região do foco"
            valor={regiao}
            onChange={setRegiao}
            opcoes={REGIOES_FOCO.map((r) => ({ valor: r, rotulo: PROTOCOLOS[r].nome }))}
          />
          <p className="t-pq text-texto2">{PROTOCOLOS[regiao].descricao}</p>
        </section>
        <section className="space-y-2">
          <h3 className="t-h3">Lado</h3>
          <ChipGroup<LadoFoco>
            rotuloAria="Lado do foco"
            valor={lado}
            onChange={setLado}
            opcoes={[
              { valor: "direito", rotulo: "Direito" },
              { valor: "esquerdo", rotulo: "Esquerdo" },
            ]}
          />
        </section>
        <label className="block space-y-1.5">
          <span className="t-h3">O que aconteceu (opcional)</span>
          <textarea
            value={notas}
            maxLength={200}
            rows={2}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full rounded-[16px] border border-borda bg-vidro-forte p-3 text-[0.9375rem] text-texto outline-none placeholder:text-texto3 focus:border-realce"
            placeholder="Ex.: fisgada na arrancada do jogo de sábado"
          />
        </label>
        {!mesmo && (
          <p className="t-corpo text-texto2">
            Começa na fase {faseNova}:{" "}
            {PROTOCOLOS[regiao].fases[faseNova >= 3 ? 3 : (faseNova as 1 | 2)].nome}. Avançar de fase continua
            só por proposta que você aceita.
          </p>
        )}
        <Banner variante="alerta">{textoSegurancaTroca({ regiao, lado })}</Banner>
      </BottomSheet>

      <ConfirmDialog
        aberto={confirmar}
        titulo={`Trocar o foco para ${destino.nome}?`}
        texto={`A reabilitação, os exercícios e as demonstrações passam a girar em torno de ${destino.nome}. O tornozelo continua com a manutenção e com as mesmas regras de segurança. Procure um ortopedista ou fisioterapeuta para avaliar a lesão.`}
        confirmarRotulo="Sim, trocar"
        onConfirmar={confirmarTroca}
        onCancelar={() => setConfirmar(false)}
      />
    </GlassCard>
  );
}
