"use client";

import { useEffect, useState } from "react";
import { Check, Minus, X } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { EscalaDor } from "@/components/ui/escala-dor";
import { useToast } from "@/components/ui/toast";
import type { Bloco } from "@/lib/seed/plano";
import type { Resultado, Sessao } from "@/lib/tipos";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  data: string;
  bloco: Pick<Bloco, "id" | "titulo" | "duracaoMin" | "instrutor">;
  inicial?: Sessao | null;
  /** usado quando ainda não há sessão registrada */
  resultadoPadrao?: Resultado;
};

const opcoes = [
  { valor: "feito" as const, rotulo: "Feito", icone: <Check className="size-5" aria-hidden="true" /> },
  { valor: "parcial" as const, rotulo: "Parcial", icone: <Minus className="size-5" aria-hidden="true" /> },
  { valor: "nao_fiz" as const, rotulo: "Não fiz", icone: <X className="size-5" aria-hidden="true" /> },
];

export function SessaoSheet({ aberto, onFechar, data, bloco, inicial, resultadoPadrao = "feito" }: Props) {
  const { salvarSessao } = useDados();
  const toast = useToast();
  const [resultado, setResultado] = useState<Resultado>(resultadoPadrao);
  const [esforco, setEsforco] = useState<number | null>(null);
  const [duracao, setDuracao] = useState(bloco.duracaoMin);
  const [notas, setNotas] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setResultado(inicial?.resultado ?? resultadoPadrao);
    setEsforco(inicial?.esforco ?? null);
    setDuracao(inicial?.duracaoMin ?? bloco.duracaoMin);
    setNotas(inicial?.notas ?? "");
  }, [aberto, inicial, resultadoPadrao, bloco.duracaoMin]);

  async function salvar() {
    setSalvando(true);
    const fez = resultado !== "nao_fiz";
    try {
      await salvarSessao({
        data,
        bloco: bloco.id,
        resultado,
        esforco: fez ? esforco : null,
        duracaoMin: fez ? duracao : null,
        notas: notas.trim() || null,
      });
      toast.mostrar("Sessão salva");
      onFechar();
    } catch {
      toast.mostrar("Não foi possível salvar. Tente de novo.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <BottomSheet
      aberto={aberto}
      onFechar={onFechar}
      titulo="Registro da sessão"
      rodape={
        <Button tamanho="g" className="w-full" carregando={salvando} onClick={salvar}>
          Salvar sessão
        </Button>
      }
    >
      <p className="t-corpo text-texto2">{bloco.titulo}</p>

      <section className="space-y-2">
        <h3 className="t-h3">Como foi?</h3>
        <ChipGroup rotuloAria="Resultado" opcoes={opcoes} valor={resultado} onChange={setResultado} />
      </section>

      {resultado !== "nao_fiz" && (
        <>
          <section className="space-y-2">
            <h3 className="t-h3">Esforço percebido</h3>
            <EscalaDor
              variante="esforco"
              valor={esforco}
              onChange={setEsforco}
              rotuloAria="Esforço percebido"
            />
          </section>

          <section className="space-y-2">
            <h3 className="t-h3">Duração</h3>
            <div className="flex items-center gap-3">
              <Button
                variante="secundario"
                aria-label="Menos 5 minutos"
                onClick={() => setDuracao((d) => Math.max(0, d - 5))}
              >
                −5
              </Button>
              <p className="t-h2 num min-w-24 text-center">{duracao} min</p>
              <Button
                variante="secundario"
                aria-label="Mais 5 minutos"
                onClick={() => setDuracao((d) => Math.min(300, d + 5))}
              >
                +5
              </Button>
            </div>
          </section>
        </>
      )}

      <section className="space-y-2">
        <label htmlFor="notas-sessao" className="t-h3 block">
          Notas {bloco.instrutor ? "(o que o instrutor passou)" : "(opcional)"}
        </label>
        <textarea
          id="notas-sessao"
          value={notas}
          maxLength={300}
          rows={3}
          onChange={(e) => setNotas(e.target.value)}
          className="w-full rounded-[16px] border border-borda bg-vidro-forte p-3 text-[15px] text-texto outline-none placeholder:text-texto3 focus:border-realce"
          placeholder="Escreva só se quiser"
        />
      </section>
    </BottomSheet>
  );
}
