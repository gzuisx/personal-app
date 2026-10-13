import { DADOS_VAZIOS, type DadosApp } from "@/lib/tipos";
import type { Repo } from "./tipos";

const CHAVE = "meu-personal:v1";

function ler(): DadosApp {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return { ...DADOS_VAZIOS, ...(JSON.parse(bruto) as Partial<DadosApp>) };
  } catch {
    // dados corrompidos ou armazenamento bloqueado: começa do zero
  }
  return structuredClone(DADOS_VAZIOS);
}

function gravar(dados: DadosApp) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
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

/** Modo local: tudo fica no localStorage deste aparelho, sem login. */
export function criarLocalRepo(): Repo {
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
      gravar({ ...d, jogos: upsert(d.jogos, j, (a, b) => a.inicio === b.inicio) });
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
    async exportar() {
      return ler();
    },
  };
}
