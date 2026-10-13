"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Header } from "@/components/ui/header";
import { ROTULO_TIPO, TIPOS_BIBLIOTECA, filtrarBiblioteca } from "@/lib/biblioteca";
import { rotulosDoFoco } from "@/lib/foco";
import { voltarSeguro } from "@/lib/rotas";
import { REGIOES_CORPO, type RegiaoCorpo } from "@/lib/seed/catalogo-detalhes";
import { REGIOES_FOCO, type RegiaoFoco } from "@/lib/seed/protocolos";
import type { TipoCatalogo } from "@/lib/seed/catalogo";

function Biblioteca() {
  const params = useSearchParams();
  const { dados } = useDados();
  const focoParam = params.get("foco");
  const inicialFoco = REGIOES_FOCO.includes(focoParam as RegiaoFoco) ? (focoParam as RegiaoFoco) : null;
  const regiaoParam = params.get("regiao");
  const voltar = voltarSeguro(params.get("de"), "/hoje");

  const [busca, setBusca] = useState("");
  const [soFoco, setSoFoco] = useState(!!inicialFoco);
  const [tipo, setTipo] = useState<TipoCatalogo | null>(null);
  const [regiao, setRegiao] = useState<RegiaoCorpo | null>(
    REGIOES_CORPO.includes(regiaoParam as RegiaoCorpo) ? (regiaoParam as RegiaoCorpo) : null,
  );

  const foco = inicialFoco ?? dados.foco.regiao;
  const nomeFoco = rotulosDoFoco(
    inicialFoco ? { regiao: inicialFoco, lado: dados.foco.lado } : dados.foco,
  ).regiao;
  const lista = useMemo(
    () => filtrarBiblioteca({ busca, tipo, regiao, foco: soFoco ? foco : null }),
    [busca, tipo, regiao, soFoco, foco],
  );
  const aqui = `/biblioteca${params.toString() ? `?${params.toString()}` : ""}`;

  return (
    <main className="pagina space-y-4">
      <Header titulo="Biblioteca" sobretitulo="Exercícios com demonstração" voltarPara={voltar} />

      <label className="relative block">
        <span className="sr-only">Buscar exercício</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-texto3"
          aria-hidden="true"
        />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar: panturrilha, stiff, elástico..."
          className="h-12 w-full rounded-full border border-borda bg-vidro-forte pl-12 pr-4 text-[0.9375rem] text-texto outline-none placeholder:text-texto3 focus:border-realce"
        />
      </label>

      <p className="t-rotulo -mb-2 text-texto2">Tipo</p>
      <section aria-label="Filtros por tag" className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2 pb-1">
          <Chip selecionado={soFoco} onClick={() => setSoFoco((v) => !v)}>
            Meu foco: {nomeFoco}
          </Chip>
          <Chip selecionado={tipo === null} onClick={() => setTipo(null)}>
            Todos
          </Chip>
          {TIPOS_BIBLIOTECA.map((t) => (
            <Chip key={t} selecionado={tipo === t} onClick={() => setTipo(tipo === t ? null : t)}>
              {ROTULO_TIPO[t]}
            </Chip>
          ))}
        </div>
      </section>

      <p className="t-rotulo -mb-2 text-texto2">Região</p>
      <section aria-label="Filtros por região" className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2 pb-1">
          {REGIOES_CORPO.map((r) => (
            <Chip key={r} selecionado={regiao === r} onClick={() => setRegiao(regiao === r ? null : r)}>
              {r}
            </Chip>
          ))}
        </div>
      </section>

      <p className="t-pq text-texto2" aria-live="polite">
        {lista.length} {lista.length === 1 ? "exercício" : "exercícios"}
      </p>

      {lista.length === 0 ? (
        <EmptyState
          titulo="Nenhum exercício encontrado"
          texto="Tente outra palavra ou tire um filtro."
          compacto
        />
      ) : (
        <ul className="space-y-2">
          {lista.map((i) => (
            <li key={i.id}>
              <Link
                href={`/biblioteca/${i.id}?de=${encodeURIComponent(aqui)}`}
                className="flex min-h-16 items-center gap-3 rounded-2xl border border-borda bg-vidro px-4 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="t-h3 block leading-snug">{i.nome}</span>
                  <span className="t-pq block truncate text-texto2">
                    {[...new Set([ROTULO_TIPO[i.tipo], ...i.regioes])].slice(0, 4).join(" · ")}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-texto2" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {foco !== "tornozelo" && soFoco && (
        <p className="t-pq text-texto2">
          Exercícios da reabilitação de {nomeFoco.toLowerCase()}, nas 3 fases.
        </p>
      )}
    </main>
  );
}

export default function BibliotecaPage() {
  return (
    <Suspense fallback={null}>
      <Biblioteca />
    </Suspense>
  );
}
