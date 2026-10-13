"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Play, Square } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { Banner } from "@/components/ui/banner";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip";
import { useToast } from "@/components/ui/toast";
import { AVISO_PARE, ROTULO_PE, type DefTeste } from "@/lib/testes";
import type { PeTeste, TesteCampo } from "@/lib/tipos";

type Props = { def: DefTeste | null; data: string; aberto: boolean; onFechar: () => void };

const novoId = () => crypto.randomUUID();

/** Converte "3,45" ou "3.45" em número; vazio ou inválido vira null. */
function numero(texto: string): number | null {
  const n = Number(texto.trim().replace(",", "."));
  return texto.trim() && Number.isFinite(n) && n >= 0 ? n : null;
}

/** Registro de um teste de campo: instruções, aquecimento, aviso de dor, cronômetro e tentativas. */
export function RegistrarTeste({ def, data, aberto, onFechar }: Props) {
  const { salvarTeste } = useDados();
  const toast = useToast();
  const [pe, setPe] = useState<PeTeste>("direito");
  const [subtipo, setSubtipo] = useState<string | null>(null);
  const [tentativas, setTentativas] = useState<string[]>([]);
  const [falhas, setFalhas] = useState("0");
  const [rodando, setRodando] = useState(false);
  const [decorrido, setDecorrido] = useState(0);
  const inicio = useRef(0);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto || !def) return;
    setPe("direito");
    setSubtipo(def.subtipos?.[0]?.valor ?? null);
    setTentativas(Array.from({ length: def.tentativas }, () => ""));
    setFalhas("0");
    setRodando(false);
    setDecorrido(0);
  }, [aberto, def]);

  useEffect(() => {
    if (!rodando) return;
    const id = setInterval(() => setDecorrido(performance.now() - inicio.current), 50);
    return () => clearInterval(id);
  }, [rodando]);

  if (!def) return null;

  function alternarCronometro() {
    if (!rodando) {
      inicio.current = performance.now();
      setDecorrido(0);
      setRodando(true);
      return;
    }
    const segundos = Math.round(((performance.now() - inicio.current) / 1000) * 100) / 100;
    setRodando(false);
    setDecorrido(0);
    setTentativas((t) => {
      const i = t.findIndex((x) => !x.trim());
      const proximo = [...t];
      proximo[i === -1 ? t.length - 1 : i] = String(segundos).replace(".", ",");
      return proximo;
    });
  }

  async function salvar() {
    if (!def) return;
    const valores = tentativas.map(numero);
    if (valores.every((v) => v === null)) {
      toast.mostrar("Digite pelo menos um valor.", "aviso");
      return;
    }
    setSalvando(true);
    try {
      const nFalhas = def.contaFalhas ? Math.max(0, Math.round(numero(falhas) ?? 0)) : null;
      let ordem = 0;
      for (const v of valores) {
        if (v === null) continue;
        ordem += 1;
        const t: TesteCampo = {
          id: novoId(),
          tipo: def.tipo,
          pe: def.porPe ? pe : null,
          subtipo,
          valor: v,
          unidade: def.unidade,
          tentativa: ordem,
          data,
          falhas: nFalhas,
        };
        await salvarTeste(t);
      }
      toast.mostrar("Teste registrado");
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
      titulo={def.nome}
      rodape={
        <Button tamanho="g" className="w-full" carregando={salvando} onClick={salvar}>
          Salvar teste
        </Button>
      }
    >
      <div className="space-y-4">
        <Banner variante="aviso">
          <span className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" /> {AVISO_PARE}
          </span>
        </Banner>
        <section>
          <p className="t-rotulo text-texto2">Aquecimento sugerido</p>
          <p className="t-corpo">{def.aquecimento}</p>
        </section>
        <ol className="t-corpo list-inside list-decimal space-y-1 text-texto2">
          {def.passos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
        {def.descansoS ? (
          <p className="t-pq text-texto2">Descanse {def.descansoS / 60} min entre as tentativas.</p>
        ) : null}

        {def.subtipos && (
          <section>
            <p className="t-rotulo mb-2 text-texto2">Variação</p>
            <ChipGroup
              rotuloAria="Variação do teste"
              opcoes={def.subtipos.map((s) => ({ valor: s.valor, rotulo: s.rotulo }))}
              valor={subtipo}
              onChange={setSubtipo}
            />
          </section>
        )}
        {def.porPe && (
          <section>
            <p className="t-rotulo mb-2 text-texto2">Pé</p>
            <ChipGroup
              rotuloAria="Pé testado"
              opcoes={(["direito", "esquerdo"] as const).map((p) => ({ valor: p, rotulo: ROTULO_PE[p] }))}
              valor={pe}
              onChange={setPe}
            />
          </section>
        )}

        {def.cronometro && (
          <section className="rounded-2xl border border-borda bg-vidro p-3">
            <p className="num t-h1 text-center" aria-live="off">
              {(decorrido / 1000).toFixed(2).replace(".", ",")} s
            </p>
            <Button
              className="mt-2 w-full"
              variante={rodando ? "perigo" : "primario"}
              onClick={alternarCronometro}
            >
              {rodando ? (
                <>
                  <Square className="size-4" aria-hidden="true" /> Parar
                </>
              ) : (
                <>
                  <Play className="size-4" aria-hidden="true" /> Iniciar cronômetro
                </>
              )}
            </Button>
            <p className="t-pq mt-2 text-texto2">
              Ao parar, o tempo entra na próxima tentativa vazia. Você também pode digitar.
            </p>
          </section>
        )}

        <section className="space-y-2">
          <p className="t-rotulo text-texto2">
            {def.tentativas > 1
              ? `Tentativas (vale a melhor), em ${def.unidade}`
              : `Resultado, em ${def.unidade}`}
          </p>
          {tentativas.map((valor, i) => (
            <label key={i} className="block">
              <span className="t-pq text-texto2">{def.tentativas > 1 ? `Tentativa ${i + 1}` : "Valor"}</span>
              <input
                inputMode="decimal"
                value={valor}
                onChange={(e) => setTentativas((t) => t.map((x, k) => (k === i ? e.target.value : x)))}
                className="mt-1 block h-12 w-full rounded-2xl border border-borda bg-vidro-forte px-4 text-texto"
              />
            </label>
          ))}
        </section>

        {def.contaFalhas && (
          <label className="block">
            <span className="t-rotulo text-texto2">Falhas (apoiou ou perdeu o equilíbrio)</span>
            <input
              inputMode="numeric"
              value={falhas}
              onChange={(e) => setFalhas(e.target.value)}
              className="mt-1 block h-12 w-full rounded-2xl border border-borda bg-vidro-forte px-4 text-texto"
            />
          </label>
        )}
      </div>
    </BottomSheet>
  );
}
