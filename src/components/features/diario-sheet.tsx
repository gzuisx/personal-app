"use client";

import { useEffect, useState } from "react";
import { useDados } from "@/components/dados-provider";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { useToast } from "@/components/ui/toast";
import { diarioVazio, limparItens } from "@/lib/diario";
import type { DiarioJogo } from "@/lib/tipos";

type Contador = "finalizacoes" | "gols" | "assistencias" | "arrancadas";
type Nota = "olhadas" | "movimentacao" | "condicao";

const CONTADORES: { campo: Contador; rotulo: string }[] = [
  { campo: "finalizacoes", rotulo: "Finalizações" },
  { campo: "gols", rotulo: "Gols" },
  { campo: "assistencias", rotulo: "Assistências" },
  { campo: "arrancadas", rotulo: "Arrancadas de ruptura" },
];
const NOTAS: { campo: Nota; rotulo: string }[] = [
  { campo: "olhadas", rotulo: "Olhadas por cima do ombro" },
  { campo: "movimentacao", rotulo: "Movimentação sem bola" },
  { campo: "condicao", rotulo: "Condição física" },
];
const UM_A_CINCO = [1, 2, 3, 4, 5].map((n) => ({ valor: n, rotulo: String(n) }));

/** Diário do centroavante: cerca de 20 segundos depois do jogo. Sem comparação com outras pessoas. */
export function DiarioSheet({
  jogoData,
  aberto,
  onFechar,
}: {
  jogoData: string | null;
  aberto: boolean;
  onFechar: () => void;
}) {
  const { dados, salvarDiario } = useDados();
  const toast = useToast();
  const [d, setD] = useState<DiarioJogo>(diarioVazio(""));
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto || !jogoData) return;
    setD(dados.diarios.find((x) => x.jogoData === jogoData) ?? diarioVazio(jogoData));
    // só ao abrir: não reescreve o que a pessoa já digitou
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, jogoData]);

  const muda = (parcial: Partial<DiarioJogo>) => setD((x) => ({ ...x, ...parcial }));
  const contar = (campo: Contador, delta: number) => muda({ [campo]: Math.max(0, (d[campo] ?? 0) + delta) });
  const texto = (campo: "bom" | "melhorar", i: number, valor: string) => {
    const lista = [...d[campo]];
    while (lista.length < 2) lista.push("");
    lista[i] = valor;
    muda({ [campo]: lista });
  };

  async function salvar() {
    setSalvando(true);
    try {
      await salvarDiario({ ...d, bom: limparItens(d.bom), melhorar: limparItens(d.melhorar) });
      toast.mostrar("Diário salvo");
      onFechar();
    } catch {
      toast.mostrar("Não consegui salvar. Confira a internet.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <BottomSheet
      aberto={aberto}
      onFechar={onFechar}
      titulo="Diário do centroavante"
      rodape={
        <Button tamanho="g" className="w-full" carregando={salvando} onClick={salvar}>
          Salvar diário
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {CONTADORES.map((c) => (
            <div key={c.campo} className="rounded-2xl border border-borda bg-vidro p-3">
              <p className="t-pq text-texto2">{c.rotulo}</p>
              <div className="mt-1 flex items-center justify-between">
                <Button
                  variante="secundario"
                  className="size-11 !min-w-11 !px-0"
                  aria-label={`Menos ${c.rotulo}`}
                  onClick={() => contar(c.campo, -1)}
                >
                  −
                </Button>
                <span className="t-h2 num" aria-live="polite">
                  {d[c.campo] ?? 0}
                </span>
                <Button
                  variante="secundario"
                  className="size-11 !min-w-11 !px-0"
                  aria-label={`Mais ${c.rotulo}`}
                  onClick={() => contar(c.campo, 1)}
                >
                  +
                </Button>
              </div>
            </div>
          ))}
        </div>

        {NOTAS.map((n) => (
          <section key={n.campo}>
            <p className="t-rotulo mb-2 text-texto2">{n.rotulo} (1 a 5)</p>
            <ChipGroup
              rotuloAria={n.rotulo}
              opcoes={UM_A_CINCO}
              valor={d[n.campo]}
              onChange={(v) => muda({ [n.campo]: v })}
            />
          </section>
        ))}

        {(["bom", "melhorar"] as const).map((campo) => (
          <section key={campo} className="space-y-2">
            <p className="t-rotulo text-texto2">{campo === "bom" ? "Duas coisas boas" : "Duas a melhorar"}</p>
            {[0, 1].map((i) => (
              <input
                key={i}
                value={d[campo][i] ?? ""}
                maxLength={80}
                onChange={(e) => texto(campo, i, e.target.value)}
                aria-label={`${campo === "bom" ? "Coisa boa" : "A melhorar"} ${i + 1}`}
                placeholder="Frase curta"
                className="block h-12 w-full rounded-2xl border border-borda bg-vidro-forte px-4 text-texto placeholder:text-texto3"
              />
            ))}
          </section>
        ))}
      </div>
    </BottomSheet>
  );
}
