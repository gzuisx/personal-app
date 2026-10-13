"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { expandirSessoesLegadas } from "@/lib/derivados";
import { gerarDadosDemo, CHAVE_MODO_DEMO } from "@/lib/demo";
import { criarRepo, criarRepoDemo, type Repo } from "@/lib/repo";
import { apagarLocal, CHAVE_DEMO, gravarLocal } from "@/lib/repo/local";
import { novoFoco, trocarFocoNaLista, type LadoFoco, type RegiaoFoco } from "@/lib/foco";
import type { ConfigSeguranca } from "@/lib/safety";
import {
  aceitarProposta,
  adiarProposta,
  novasPropostas,
  recusarProposta,
  type ResultadoDecisao,
} from "@/lib/coach/propostas";
import type { Decisao, PropostaSugerida } from "@/lib/coach/tipos";
import { addDias, dataISO } from "@/lib/tempo";
import {
  DADOS_VAZIOS,
  type Checkin,
  type Execucao,
  type DadosApp,
  type DiarioJogo,
  type ExcecaoAgenda,
  type Meta,
  type TesteCampo,
  type Rotina,
  type FaseTornozelo,
  type Jogo,
  type Perfil,
  type SerieLog,
  type PreJogoLog,
  type Sessao,
} from "@/lib/tipos";

type Status = "carregando" | "pronto" | "erro";

type Acoes = {
  salvarCheckin: (c: Checkin) => Promise<void>;
  salvarSessao: (s: Sessao) => Promise<void>;
  salvarJogo: (j: Jogo) => Promise<void>;
  salvarPreJogo: (p: PreJogoLog) => Promise<void>;
  /** uma série do treino guiado (grava assim que é concluída) */
  salvarSerie: (sl: SerieLog) => Promise<void>;
  /** treino em andamento, para retomar depois de fechar o app */
  salvarExecucao: (e: Execucao) => Promise<void>;
  limparExecucao: () => Promise<void>;
  salvarSeguranca: (c: ConfigSeguranca) => Promise<void>;
  salvarPerfil: (p: Perfil) => Promise<void>;
  alternarMarco: (chave: string) => Promise<void>;
  /** só pode ser chamada ao aceitar uma proposta de fase (C5) */
  definirFase: (f: FaseTornozelo) => Promise<void>;
  /** troca o foco de lesão. Só por ação do Gabriel no Perfil, depois da confirmação. */
  trocarFoco: (e: { regiao: RegiaoFoco; lado: LadoFoco; notas?: string | null }) => Promise<void>;
  salvarTeste: (t: TesteCampo) => Promise<void>;
  removerTeste: (id: string) => Promise<void>;
  salvarMeta: (m: Meta) => Promise<void>;
  removerMeta: (id: string) => Promise<void>;
  salvarDiario: (d: DiarioJogo) => Promise<void>;
  salvarExcecao: (e: ExcecaoAgenda) => Promise<void>;
  removerExcecao: (id: string) => Promise<void>;
  salvarRotina: (r: Rotina) => Promise<void>;
  /** cria no banco as propostas novas sugeridas pelas regras (sem repetir) */
  sincronizarPropostas: (sugeridas: PropostaSugerida[]) => Promise<void>;
  /** Aceitar / Adiar / Recusar; devolve o motivo quando a validação recusa */
  decidirProposta: (
    id: string,
    acao: "aceitar" | "adiar" | "recusar",
    estado: {
      decisao: Pick<Decisao, "podeProgredir" | "modo">;
      podeProgredirSeguranca: boolean;
      dorHoje: number | null;
    },
  ) => Promise<{ ok: true } | { ok: false; motivo: string }>;
  exportar: () => Promise<unknown>;
  recarregar: () => void;
  ativarDemo: () => void;
  apagarDemo: () => void;
};

type Valor = Acoes & {
  status: Status;
  erro: string | null;
  modo: Repo["modo"];
  /** true enquanto a demonstração (dados fictícios, só neste aparelho) estiver ligada */
  demo: boolean;
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

function lerFlagDemo() {
  try {
    return localStorage.getItem(CHAVE_MODO_DEMO) === "1";
  } catch {
    return false;
  }
}

export function DadosProvider({ children }: { children: React.ReactNode }) {
  // null = ainda não sabemos (servidor / primeira renderização); depois "real" ou "demo".
  const [fonte, setFonte] = useState<"real" | "demo" | null>(null);
  const repoReal = useMemo(() => criarRepo(), []);
  const repoDemo = useMemo(() => criarRepoDemo(), []);
  const repo = fonte === "demo" ? repoDemo : repoReal;

  const [dados, setDados] = useState<DadosApp>(DADOS_VAZIOS);
  const [status, setStatus] = useState<Status>("carregando");
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const ref = useRef(dados);

  useEffect(() => {
    setFonte(lerFlagDemo() ? "demo" : "real");
  }, []);

  useEffect(() => {
    if (fonte === null) return;
    let cancelado = false;
    setStatus("carregando");
    repo
      .carregar(addDias(dataISO(new Date()), -DIAS_HISTORICO))
      .then((d) => {
        if (cancelado) return;
        const normalizado = { ...d, sessoes: expandirSessoesLegadas(d.sessoes) };
        ref.current = normalizado;
        setDados(normalizado);
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
  }, [repo, fonte, tentativa]);

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
      salvarCheckin: async (c) => {
        // Check-in do dia seguinte a um jogo fica vinculado a ele (24.4, R17).
        // a dor do check-in é a do foco de lesão do dia
        let checkin: Checkin = { ...c, focoRegiao: c.focoRegiao ?? ref.current.foco.regiao };
        if (c.jogoId === undefined || c.jogoId === null) {
          const jogo = ref.current.jogos.find(
            (j) => j.id && dataISO(new Date(j.inicio)) === addDias(c.data, -1) && j.dor !== null,
          );
          if (jogo?.id) checkin = { ...c, jogoId: jogo.id };
        }
        await aplicar(
          (d) => ({
            ...d,
            checkins: substituir(d.checkins, checkin, (a, b) => a.data === b.data).sort((a, b) =>
              a.data.localeCompare(b.data),
            ),
          }),
          () => repo.salvarCheckin(checkin),
        );
      },
      salvarSessao: (s) =>
        aplicar(
          (d) => ({
            ...d,
            sessoes: substituir(d.sessoes, s, (a, b) => a.data === b.data && a.bloco === b.bloco),
          }),
          () => repo.salvarSessao(s),
        ),
      salvarJogo: async (j) => {
        const existente = ref.current.jogos.find((x) => x.inicio === j.inicio);
        const jogo: Jogo = {
          ...j,
          id: j.id ?? existente?.id ?? crypto.randomUUID(),
          status: j.status ?? "jogado",
        };
        await aplicar(
          (d) => ({
            ...d,
            jogos: substituir(d.jogos, jogo, (a, b) => a.inicio === b.inicio).sort((a, b) =>
              a.inicio.localeCompare(b.inicio),
            ),
          }),
          () => repo.salvarJogo(jogo),
        );
      },
      salvarPreJogo: (p) =>
        aplicar(
          (d) => ({ ...d, preJogos: substituir(d.preJogos, p, (a, b) => a.jogoData === b.jogoData) }),
          () => repo.salvarPreJogo(p),
        ),
      salvarSerie: (sl) =>
        aplicar(
          (d) => ({
            ...d,
            series: substituir(
              d.series,
              sl,
              (a, b) => a.execucaoId === b.execucaoId && a.exercicio === b.exercicio && a.numero === b.numero,
            ),
          }),
          () => repo.salvarSerie(sl),
        ),
      salvarExecucao: (e) =>
        aplicar(
          (d) => ({ ...d, execucao: e }),
          () => repo.salvarExecucao(e),
        ),
      limparExecucao: () =>
        aplicar(
          (d) => ({ ...d, execucao: null }),
          () => repo.limparExecucao(),
        ),
      salvarSeguranca: (c) =>
        aplicar(
          (d) => ({ ...d, seguranca: c }),
          () => repo.salvarSeguranca(c),
        ),
      salvarPerfil: (p) =>
        aplicar(
          (d) => ({ ...d, perfil: p }),
          () => repo.salvarPerfil(p),
        ),
      alternarMarco: (chave) => {
        const atual = ref.current.marcos.find((m) => m.chave === chave);
        const novo = { chave, concluidoEm: atual?.concluidoEm ? null : dataISO(new Date()) };
        return aplicar(
          (d) => ({ ...d, marcos: substituir(d.marcos, novo, (a, b) => a.chave === b.chave) }),
          () => repo.salvarMarco(novo),
        );
      },
      definirFase: (f) =>
        aplicar(
          (d) => ({ ...d, faseTornozelo: f }),
          () => repo.salvarFase(f),
        ),
      trocarFoco: async ({ regiao, lado, notas }) => {
        const d0 = ref.current;
        const novo = novoFoco({
          id: crypto.randomUUID(),
          regiao,
          lado,
          notas,
          hoje: dataISO(new Date()),
          faseTornozelo: d0.faseTornozelo,
        });
        await aplicar(
          (d) => ({ ...d, foco: novo, focos: trocarFocoNaLista(d.focos, novo) }),
          async () => {
            await repo.trocarFoco(novo);
            await repo.registrarAuditoria({
              id: crypto.randomUUID(),
              evento: "foco_trocado",
              detalhes: {
                de: { regiao: d0.foco.regiao, lado: d0.foco.lado, fase: d0.foco.fase },
                para: { regiao, lado, fase: novo.fase },
              },
              criadoEm: new Date().toISOString(),
            });
          },
        );
      },
      salvarTeste: (t) =>
        aplicar(
          (d) => ({ ...d, testes: substituir(d.testes, t, (a, b) => a.id === b.id) }),
          () => repo.salvarTeste(t),
        ),
      removerTeste: (id) =>
        aplicar(
          (d) => ({ ...d, testes: d.testes.filter((x) => x.id !== id) }),
          () => repo.removerTeste(id),
        ),
      salvarMeta: (m) =>
        aplicar(
          (d) => ({ ...d, metas: substituir(d.metas, m, (a, b) => a.chave === b.chave) }),
          () => repo.salvarMeta(m),
        ),
      removerMeta: (id) =>
        aplicar(
          (d) => ({ ...d, metas: d.metas.filter((x) => x.id !== id) }),
          () => repo.removerMeta(id),
        ),
      salvarDiario: (di) =>
        aplicar(
          (d) => ({ ...d, diarios: substituir(d.diarios, di, (a, b) => a.jogoData === b.jogoData) }),
          () => repo.salvarDiario(di),
        ),
      salvarExcecao: (e) =>
        aplicar(
          (d) => ({ ...d, excecoes: substituir(d.excecoes, e, (a, b) => a.id === b.id) }),
          () => repo.salvarExcecao(e),
        ),
      removerExcecao: (id) =>
        aplicar(
          (d) => ({ ...d, excecoes: d.excecoes.filter((x) => x.id !== id) }),
          () => repo.removerExcecao(id),
        ),
      salvarRotina: (r) =>
        aplicar(
          (d) => ({ ...d, rotina: r }),
          () => repo.salvarRotina(r),
        ),
      sincronizarPropostas: async (sugeridas) => {
        const novas = novasPropostas(ref.current.propostas, sugeridas, dataISO(new Date()), () =>
          crypto.randomUUID(),
        );
        for (const p of novas) {
          await aplicar(
            (d) => ({ ...d, propostas: [...d.propostas, p] }),
            () => repo.salvarProposta(p),
          );
        }
      },
      decidirProposta: async (id, acao, estado) => {
        const p = ref.current.propostas.find((x) => x.id === id);
        if (!p) return { ok: false, motivo: "Proposta não encontrada." };
        const c = {
          hoje: dataISO(new Date()),
          agora: new Date().toISOString(),
          novoId: () => crypto.randomUUID(),
          regiaoFoco: ref.current.foco.regiao,
          ...estado,
        };
        const r: ResultadoDecisao =
          acao === "aceitar"
            ? aceitarProposta(p, c)
            : acao === "adiar"
              ? adiarProposta(p, c)
              : recusarProposta(p, c);
        if (!r.ok) return r;
        const nf = r.novaFase;
        const focoAtual = ref.current.foco;
        // a fase muda no foco ativo; com o tornozelo, também em profiles.fase_tornozelo (leitura compatível)
        const novoFoco =
          nf && nf.regiao === focoAtual.regiao
            ? { ...focoAtual, fase: nf.fase, faseInicio: nf.inicio }
            : null;
        const faseTorn = nf && nf.regiao === "tornozelo" ? { fase: nf.fase, inicio: nf.inicio } : null;
        await aplicar(
          (d) => ({
            ...d,
            propostas: substituir(d.propostas, r.proposta, (a, b) => a.id === b.id),
            versoes: r.versao ? [...d.versoes, r.versao] : d.versoes,
            auditoria: [r.auditoria, ...d.auditoria],
            faseTornozelo: faseTorn ?? d.faseTornozelo,
            foco: novoFoco ?? d.foco,
            focos: novoFoco ? substituir(d.focos, novoFoco, (a, b) => a.id === b.id) : d.focos,
          }),
          async () => {
            await repo.salvarProposta(r.proposta);
            if (r.versao) await repo.salvarVersao(r.versao);
            await repo.registrarAuditoria(r.auditoria);
            if (faseTorn) await repo.salvarFase(faseTorn);
            if (novoFoco) await repo.salvarFoco(novoFoco);
          },
        );
        return { ok: true };
      },
      exportar: () => repo.exportar(),
      recarregar: () => setTentativa((n) => n + 1),
      ativarDemo: () => {
        try {
          gravarLocal(CHAVE_DEMO, gerarDadosDemo(dataISO(new Date())));
          localStorage.setItem(CHAVE_MODO_DEMO, "1");
        } catch {
          return;
        }
        setFonte("demo");
      },
      apagarDemo: () => {
        apagarLocal(CHAVE_DEMO);
        try {
          localStorage.removeItem(CHAVE_MODO_DEMO);
        } catch {
          // sem armazenamento: nada a limpar
        }
        setFonte("real");
      },
    }),
    [aplicar, repo],
  );

  const valor = useMemo<Valor>(
    () => ({ ...acoes, status, erro, modo: repo.modo, demo: fonte === "demo", dados }),
    [acoes, status, erro, repo.modo, fonte, dados],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useDados() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDados fora de <DadosProvider>");
  return v;
}
