"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { criarRepo, type Repo } from "@/lib/repo";
import type { ConfigSeguranca } from "@/lib/safety";
import { addDias, dataISO } from "@/lib/tempo";
import {
  DADOS_VAZIOS,
  type Checkin,
  type DadosApp,
  type Jogo,
  type Perfil,
  type Sessao,
} from "@/lib/tipos";

type Status = "carregando" | "pronto" | "erro";

type Acoes = {
  salvarCheckin: (c: Checkin) => Promise<void>;
  salvarSessao: (s: Sessao) => Promise<void>;
  salvarJogo: (j: Jogo) => Promise<void>;
  salvarSeguranca: (c: ConfigSeguranca) => Promise<void>;
  salvarPerfil: (p: Perfil) => Promise<void>;
  alternarMarco: (chave: string) => Promise<void>;
  exportar: () => Promise<unknown>;
  recarregar: () => void;
};

type Valor = Acoes & {
  status: Status;
  erro: string | null;
  modo: Repo["modo"];
  dados: DadosApp;
};

const Ctx = createContext<Valor | null>(null);

/** Quantos dias de histórico o app carrega (cobre os filtros semana e mês da Evolução). */
const DIAS_HISTORICO = 120;

function substituir<T>(lista: T[], item: T, mesmo: (a: T, b: T) => boolean) {
  const i = lista.findIndex((x) => mesmo(x, item));
  if (i < 0) return [...lista, item];
  const copia = [...lista];
  copia[i] = item;
  return copia;
}

export function DadosProvider({ children }: { children: React.ReactNode }) {
  const repo = useMemo(() => criarRepo(), []);
  const [dados, setDados] = useState<DadosApp>(DADOS_VAZIOS);
  const [status, setStatus] = useState<Status>("carregando");
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const ref = useRef(dados);

  useEffect(() => {
    let cancelado = false;
    setStatus("carregando");
    repo
      .carregar(addDias(dataISO(new Date()), -DIAS_HISTORICO))
      .then((d) => {
        if (cancelado) return;
        ref.current = d;
        setDados(d);
        setStatus("pronto");
        setErro(null);
      })
      .catch((e: unknown) => {
        if (cancelado) return;
        setErro(e instanceof Error ? e.message : "Erro ao carregar os dados.");
        setStatus("erro");
      });
    return () => {
      cancelado = true;
    };
  }, [repo, tentativa]);

  /** Atualiza a tela na hora e desfaz se a gravação falhar. */
  const aplicar = useCallback(async (proximo: (d: DadosApp) => DadosApp, persistir: () => Promise<void>) => {
    const antes = ref.current;
    const depois = proximo(antes);
    ref.current = depois;
    setDados(depois);
    try {
      await persistir();
    } catch (e) {
      ref.current = antes;
      setDados(antes);
      throw e;
    }
  }, []);

  const acoes = useMemo<Acoes>(
    () => ({
      salvarCheckin: (c) =>
        aplicar(
          (d) => ({
            ...d,
            checkins: substituir(d.checkins, c, (a, b) => a.data === b.data).sort((a, b) =>
              a.data.localeCompare(b.data),
            ),
          }),
          () => repo.salvarCheckin(c),
        ),
      salvarSessao: (s) =>
        aplicar(
          (d) => ({ ...d, sessoes: substituir(d.sessoes, s, (a, b) => a.data === b.data && a.bloco === b.bloco) }),
          () => repo.salvarSessao(s),
        ),
      salvarJogo: (j) =>
        aplicar(
          (d) => ({
            ...d,
            jogos: substituir(d.jogos, j, (a, b) => a.inicio === b.inicio).sort((a, b) =>
              a.inicio.localeCompare(b.inicio),
            ),
          }),
          () => repo.salvarJogo(j),
        ),
      salvarSeguranca: (c) => aplicar((d) => ({ ...d, seguranca: c }), () => repo.salvarSeguranca(c)),
      salvarPerfil: (p) => aplicar((d) => ({ ...d, perfil: p }), () => repo.salvarPerfil(p)),
      alternarMarco: (chave) => {
        const atual = ref.current.marcos.find((m) => m.chave === chave);
        const novo = { chave, concluidoEm: atual?.concluidoEm ? null : dataISO(new Date()) };
        return aplicar(
          (d) => ({ ...d, marcos: substituir(d.marcos, novo, (a, b) => a.chave === b.chave) }),
          () => repo.salvarMarco(novo),
        );
      },
      exportar: () => repo.exportar(),
      recarregar: () => setTentativa((n) => n + 1),
    }),
    [aplicar, repo],
  );

  const valor = useMemo<Valor>(
    () => ({ ...acoes, status, erro, modo: repo.modo, dados }),
    [acoes, status, erro, repo.modo, dados],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useDados() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDados fora de <DadosProvider>");
  return v;
}
