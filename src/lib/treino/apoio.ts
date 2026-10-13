// Apoios do treino guiado: valores sugeridos da última sessão, trocas de exercício e Sequência do dia.
import { CATALOGO_POR_ID, exigeAcademia, type ItemCatalogo } from "../seed/catalogo";
import { blocoTreinavel, type Bloco, type DiaPlano, type Periodo } from "../seed/plano";
import type { Sessao, SerieLog } from "../tipos";
import type { Item, SugeridoSerie } from "./motor";

// ---------------------------------------------------------------- última sessão

/**
 * Para cada exercício, as séries da sessão mais recente (por data) antes de `ate`
 * (ou do mesmo dia, de outra execução). Usado como valor sugerido (5.5).
 */
export function sugeridosDaUltimaSessao(
  series: SerieLog[],
  slugs: string[],
  ate: string,
  execucaoAtual?: string,
): Record<string, SugeridoSerie[]> {
  const saida: Record<string, SugeridoSerie[]> = {};
  for (const slug of slugs) {
    const doExercicio = series.filter(
      (s) => s.exercicio === slug && s.data <= ate && s.execucaoId !== execucaoAtual,
    );
    if (!doExercicio.length) continue;
    const ultimaData = doExercicio.reduce((m, s) => (s.data > m ? s.data : m), "");
    const dessa = doExercicio.filter((s) => s.data === ultimaData).sort((a, b) => a.numero - b.numero);
    saida[slug] = dessa.map((s) => ({ reps: s.reps, cargaKg: s.cargaKg, duracaoS: s.duracaoS }));
  }
  return saida;
}

// ---------------------------------------------------------------- trocas

export type OpcaoTroca = {
  item: ItemCatalogo;
  /** "Mais leve", "Equivalente" ou "Mais difícil" */
  tipo: "mais_leve" | "equivalente" | "mais_dificil";
  motivo: string;
};

/**
 * Alternativas para trocar um exercício (5.3, 7.2): respeita a fase do tornozelo, o impacto
 * quando há dor lateral e a falta de academia. A progressão (mais difícil) só aparece se a segurança liberar.
 */
export function opcoesDeTroca(
  item: Pick<Item, "slug">,
  contexto: { fase: number; podeProgredir: boolean; semAcademia?: boolean; dorImpacto?: boolean },
): OpcaoTroca[] {
  const cat = CATALOGO_POR_ID[item.slug];
  if (!cat) return [];
  const opcoes: OpcaoTroca[] = [];
  const vistos = new Set<string>([cat.id]);

  const aceita = (c: ItemCatalogo) => {
    if (c.faseMinima > contexto.fase) return false;
    if (contexto.semAcademia && exigeAcademia(c)) return false;
    if (contexto.dorImpacto && c.impacto !== "baixo") return false;
    return true;
  };

  const adicionar = (id: string | undefined, tipo: OpcaoTroca["tipo"], motivo: string) => {
    if (!id || vistos.has(id)) return;
    const c = CATALOGO_POR_ID[id];
    if (!c || !aceita(c)) return;
    vistos.add(id);
    opcoes.push({ item: c, tipo, motivo });
  };

  adicionar(cat.regressao, "mais_leve", "Versão mais leve, para quando doeu ou está difícil.");
  for (const alt of cat.alternativas) adicionar(alt, "equivalente", "Equivalente, com o mesmo objetivo.");
  if (contexto.podeProgredir)
    adicionar(cat.progressao, "mais_dificil", "Versão mais difícil, liberada porque a segurança permite.");
  return opcoes;
}

// ---------------------------------------------------------------- sequência do dia

const ORDEM: Record<Periodo, number> = { manha: 0, tarde: 1, noite: 2, jogo: 3, dia: 0 };

export type SequenciaDoDia = {
  periodo: Periodo;
  blocos: Bloco[];
  totalMin: number;
};

const temExercicios = (b: Bloco) => b.exercicios.length > 0;

/**
 * Blocos que podem virar uma Sequência (24.6): 2 ou mais blocos pendentes, com exercícios,
 * no mesmo período do dia. Usa só o que está no plano; nunca acrescenta atividade.
 */
export function sequenciaPendente(dia: DiaPlano, sessoes: Sessao[]): SequenciaDoDia | null {
  const pendentes = dia.blocos
    .filter(blocoTreinavel)
    .filter(temExercicios)
    .filter((b) => !sessoes.some((s) => s.data === dia.iso && s.bloco === b.id));
  const porPeriodo = new Map<Periodo, Bloco[]>();
  for (const b of pendentes) porPeriodo.set(b.periodo, [...(porPeriodo.get(b.periodo) ?? []), b]);
  const candidatos = [...porPeriodo.entries()]
    .filter(([, blocos]) => blocos.length >= 2)
    .sort((a, b) => ORDEM[a[0]] - ORDEM[b[0]]);
  if (!candidatos.length) return null;
  const [periodo, blocos] = candidatos[0];
  return { periodo, blocos, totalMin: blocos.reduce((s, b) => s + b.duracaoMin, 0) };
}
