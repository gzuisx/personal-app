"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/components/ui/toast";
import { metasSugeridas, progressoDaMeta, resumirTestes } from "@/lib/testes";
import type { Meta } from "@/lib/tipos";

const fmt = (v: number | null) => (v === null ? "—" : String(Math.round(v * 100) / 100).replace(".", ","));
const dataBR = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/** Metas de 2027: valor inicial, atual, alvo e barra de progresso. As metas de partida são referência, não promessa. */
export function MetasCard({ hoje, indice }: { hoje: string; indice?: number }) {
  const { dados, salvarMeta, removerMeta } = useDados();
  const toast = useToast();
  const [editando, setEditando] = useState<Meta | null>(null);
  const [alvoTexto, setAlvoTexto] = useState("");
  const resumos = useMemo(() => resumirTestes(dados.testes), [dados.testes]);
  const sugeridas = useMemo(
    () =>
      metasSugeridas(resumos, () => crypto.randomUUID(), hoje).filter(
        (s) => !dados.metas.some((m) => m.chave === s.chave),
      ),
    [resumos, dados.metas, hoje],
  );

  async function criarSugeridas() {
    try {
      for (const m of sugeridas) await salvarMeta(m);
      toast.mostrar("Metas criadas");
    } catch {
      toast.mostrar("Não consegui salvar. Confira a internet.", "erro");
    }
  }

  async function salvarAlvo() {
    if (!editando) return;
    const alvo = Number(alvoTexto.replace(",", "."));
    if (!Number.isFinite(alvo) || alvo <= 0) {
      toast.mostrar("Digite um alvo válido.", "aviso");
      return;
    }
    try {
      await salvarMeta({ ...editando, alvo });
      setEditando(null);
    } catch {
      toast.mostrar("Não consegui salvar. Confira a internet.", "erro");
    }
  }

  return (
    <GlassCard indice={indice} titulo="Metas de 2027">
      {dados.metas.length === 0 && (
        <p className="t-corpo text-texto2">
          {sugeridas.length
            ? "Com o primeiro teste feito, o app sugere metas de partida. Você pode editar o alvo."
            : "Faça o primeiro teste de campo para o app sugerir metas de partida."}
        </p>
      )}
      <ul className="space-y-3">
        {dados.metas.map((m) => {
          const p = progressoDaMeta(m, resumos);
          return (
            <li key={m.id} className="rounded-2xl border border-borda bg-vidro p-3">
              <div className="flex items-start gap-2">
                <p className="t-h3 flex-1">{m.titulo}</p>
                <button
                  type="button"
                  aria-label={`Editar alvo de ${m.titulo}`}
                  onClick={() => {
                    setEditando(m);
                    setAlvoTexto(String(m.alvo).replace(".", ","));
                  }}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-texto2"
                >
                  <Pencil className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Remover meta ${m.titulo}`}
                  onClick={() =>
                    removerMeta(m.id).catch(() => toast.mostrar("Não consegui remover.", "erro"))
                  }
                  className="flex size-11 shrink-0 items-center justify-center rounded-full text-texto2"
                >
                  <Trash2 className="size-5" aria-hidden="true" />
                </button>
              </div>
              <p className="t-pq text-texto2">
                Início {fmt(m.inicial)} · agora {fmt(p.atual)} · alvo {fmt(m.alvo)} {m.unidade}
                {m.prazo ? ` · até ${dataBR(m.prazo)}` : ""}
              </p>
              <div
                className="mt-2 h-3 overflow-hidden rounded-full bg-vidro-forte"
                role="progressbar"
                aria-label={`Progresso da meta ${m.titulo}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={p.percentual ?? 0}
              >
                <div
                  className={`h-full rounded-full ${p.atingida ? "bg-ok" : "bg-primario"} transition-[width] duration-700`}
                  style={{ width: `${p.percentual ?? 0}%` }}
                />
              </div>
              <p className="t-pq mt-1 text-texto2">
                {p.atingida
                  ? "Meta atingida"
                  : p.percentual === null
                    ? "Sem teste para comparar ainda"
                    : `${p.percentual}% do caminho`}
              </p>
            </li>
          );
        })}
      </ul>
      {sugeridas.length > 0 && (
        <Button className="mt-3" variante="secundario" onClick={criarSugeridas}>
          Criar {sugeridas.length === 1 ? "meta sugerida" : `${sugeridas.length} metas sugeridas`}
        </Button>
      )}
      <p className="t-pq mt-3 text-texto2">Metas de referência, não promessas.</p>

      <BottomSheet
        aberto={!!editando}
        onFechar={() => setEditando(null)}
        titulo="Editar alvo"
        rodape={
          <Button tamanho="g" className="w-full" onClick={salvarAlvo}>
            Salvar alvo
          </Button>
        }
      >
        <label className="block">
          <span className="t-rotulo text-texto2">
            {editando?.titulo} ({editando?.unidade})
          </span>
          <input
            inputMode="decimal"
            value={alvoTexto}
            onChange={(e) => setAlvoTexto(e.target.value)}
            className="mt-1 block h-12 w-full rounded-2xl border border-borda bg-vidro-forte px-4 text-texto"
          />
        </label>
      </BottomSheet>
    </GlassCard>
  );
}
