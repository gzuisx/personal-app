import { DADOS_VAZIOS, type DadosApp } from "@/lib/tipos";
import type { Repo } from "./tipos";

export const CHAVE_LOCAL = "meu-personal:v1";
export const CHAVE_DEMO = "meu-personal:demo";

function novoId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `j-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function lerLocal(chave: string): DadosApp {
  try {
    const bruto = localStorage.getItem(chave);
    if (bruto) {
      const dados = JSON.parse(bruto) as Partial<DadosApp>;
      return { ...structuredClone(DADOS_VAZIOS), ...dados };
    }
  } catch {
    // dados corrompidos ou armazenamento bloqueado: começa do zero
  }
  return structuredClone(DADOS_VAZIOS);
}

export function gravarLocal(chave: string, dados: DadosApp) {
  try {
    localStorage.setItem(chave, JSON.stringify(dados));
  } catch {
    throw new Error("Não foi possível gravar neste aparelho (armazenamento cheio ou bloqueado).");
  }
}

function upsert<T>(lista: T[], item: T, mesmo: (a: T, b: T) => boolean) {
  const i = lista.findIndex((x) => mesmo(x, item));
  if (i >= 0) {
    const copia = [...lista];
    copia[i] = item;
    return copia;
  }
  return [...lista, item];
}

/**
 * Repositório local: tudo fica no localStorage deste aparelho.
 * Serve ao modo local (sem login) e ao modo demonstração (chave separada, nunca vai ao Supabase).
 */
export function criarLocalRepo(chave: string = CHAVE_LOCAL): Repo {
  const ler = () => lerLocal(chave);
  const gravar = (d: DadosApp) => gravarLocal(chave, d);
  return {
    modo: "local",
    async carregar() {
      return ler();
    },
    async salvarCheckin(c) {
      const d = ler();
      gravar({ ...d, checkins: upsert(d.checkins, c, (a, b) => a.data === b.data) });
    },
    async salvarSessao(s) {
      const d = ler();
      gravar({ ...d, sessoes: upsert(d.sessoes, s, (a, b) => a.data === b.data && a.bloco === b.bloco) });
    },
    async salvarJogo(j) {
      const d = ler();
      const atual = d.jogos.find((x) => x.inicio === j.inicio);
      gravar({
        ...d,
        jogos: upsert(d.jogos, { ...j, id: j.id ?? atual?.id ?? novoId() }, (a, b) => a.inicio === b.inicio),
      });
    },
    async salvarPreJogo(p) {
      const d = ler();
      gravar({ ...d, preJogos: upsert(d.preJogos, p, (a, b) => a.jogoData === b.jogoData) });
    },
    async salvarSerie(s) {
      const d = ler();
      gravar({
        ...d,
        series: upsert(
          d.series,
          s,
          (a, b) => a.execucaoId === b.execucaoId && a.exercicio === b.exercicio && a.numero === b.numero,
        ),
      });
    },
    async salvarExecucao(e) {
      gravar({ ...ler(), execucao: e });
    },
    async limparExecucao() {
      gravar({ ...ler(), execucao: null });
    },
    async salvarSeguranca(c) {
      gravar({ ...ler(), seguranca: c });
    },
    async salvarPerfil(p) {
      gravar({ ...ler(), perfil: p });
    },
    async salvarMarco(m) {
      const d = ler();
      gravar({ ...d, marcos: upsert(d.marcos, m, (a, b) => a.chave === b.chave) });
    },
    async salvarFase(f) {
      gravar({ ...ler(), faseTornozelo: f });
    },
    async exportar() {
      return ler();
    },
  };
}

export function apagarLocal(chave: string) {
  try {
    localStorage.removeItem(chave);
  } catch {
    // sem armazenamento: nada a apagar
  }
}
