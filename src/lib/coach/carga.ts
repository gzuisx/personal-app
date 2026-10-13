// Carga de treino (seção 3.4 e 24.3): cálculo próprio e transparente, só com registros reais.
import { diaDoPlano } from "../seed/plano";
import { addDias } from "../tempo";
import { dataISO } from "../tempo";
import type { Jogo, Sessao } from "../tipos";

export type CategoriaCarga =
  "Funcional" | "Força" | "Velocidade" | "Tornozelo" | "Mobilidade" | "Jogo" | "Outros";

export const CATEGORIAS_CARGA: CategoriaCarga[] = ["Funcional", "Força", "Velocidade", "Tornozelo", "Jogo"];

export type ItemCarga = {
  id: string;
  tipo: "sessao" | "jogo";
  data: string;
  titulo: string;
  categoria: CategoriaCarga;
  esforco: number | null;
  duracaoMin: number | null;
  /** esforço x minutos; null quando falta o esforço ou a duração */
  carga: number | null;
};

const PRECEDENCIA = ["Velocidade", "Força", "Funcional", "Tornozelo", "Mobilidade"] as const;

/** Categoria de um bloco do plano, pela etiqueta dele. */
export function categoriaDoBloco(
  blocoId: string,
  data: string,
): { categoria: CategoriaCarga; titulo: string } {
  const bloco = diaDoPlano(data).blocos.find((b) => b.id === blocoId);
  if (!bloco) return { categoria: "Outros", titulo: blocoId };
  const achou = PRECEDENCIA.find((c) => bloco.tags.includes(c));
  return { categoria: achou ?? "Outros", titulo: bloco.titulo };
}

export function cargaDe(esforco: number | null, minutos: number | null) {
  return esforco === null || minutos === null ? null : esforco * minutos;
}

const conta = (s: Sessao) => s.resultado === "feito" || s.resultado === "parcial";

/** Sessões e jogos de um período, cada um com a sua carga (esforço x minutos). */
export function itensDeCarga(sessoes: Sessao[], jogos: Jogo[], de: string, ate: string): ItemCarga[] {
  const itens: ItemCarga[] = [];
  for (const s of sessoes) {
    if (s.data < de || s.data > ate || !conta(s)) continue;
    const { categoria, titulo } = categoriaDoBloco(s.bloco, s.data);
    itens.push({
      id: `s-${s.data}-${s.bloco}`,
      tipo: "sessao",
      data: s.data,
      titulo,
      categoria,
      esforco: s.esforco,
      duracaoMin: s.duracaoMin,
      carga: cargaDe(s.esforco, s.duracaoMin),
    });
  }
  for (const j of jogos) {
    const data = dataISO(new Date(j.inicio));
    if (data < de || data > ate || j.status === "cancelado" || j.dor === null) continue;
    itens.push({
      id: `j-${j.inicio}`,
      tipo: "jogo",
      data,
      titulo: "Jogo",
      categoria: "Jogo",
      esforco: j.esforco ?? null,
      duracaoMin: j.minutosJogados,
      carga: cargaDe(j.esforco ?? null, j.minutosJogados),
    });
  }
  return itens.sort((a, b) => a.data.localeCompare(b.data));
}

export const somaCarga = (itens: ItemCarga[]) => itens.reduce((s, i) => s + (i.carga ?? 0), 0);

export type JanelaCarga = { de: string; ate: string; total: number; itens: ItemCarga[] };

/** Janela 0 = os 7 dias até hoje; janelas 1 a 4 = as 4 semanas anteriores (referência). */
export function janelasDeCarga(
  sessoes: Sessao[],
  jogos: Jogo[],
  hoje: string,
  referencias = 4,
): JanelaCarga[] {
  return Array.from({ length: referencias + 1 }, (_, k) => {
    const ate = addDias(hoje, -7 * k);
    const de = addDias(ate, -6);
    const itens = itensDeCarga(sessoes, jogos, de, ate);
    return { de, ate, total: somaCarga(itens), itens };
  });
}

export type AlertaCarga = "nenhum" | "amarelo" | "vermelho" | "poucos_dados";

export type VariacaoCarga = {
  atual: number;
  /** média das semanas de referência que têm dados */
  referencia: number | null;
  /** atual / referência */
  variacao: number | null;
  semanasDeReferenciaComDados: number;
  /** pelo menos 3 semanas de histórico (3.4) */
  suficiente: boolean;
  alerta: AlertaCarga;
  janelas: JanelaCarga[];
};

export const LIMITE_AMARELO = 1.3;
export const LIMITE_VERMELHO = 1.5;
export const SEMANAS_MINIMAS = 3;

/** Alerta amarelo acima de 1,30 e vermelho acima de 1,50; antes de 3 semanas de histórico, só "poucos dados". */
export function alertaDaVariacao(variacao: number | null, suficiente: boolean): AlertaCarga {
  if (!suficiente || variacao === null) return "poucos_dados";
  if (variacao > LIMITE_VERMELHO) return "vermelho";
  if (variacao > LIMITE_AMARELO) return "amarelo";
  return "nenhum";
}

export function variacaoDeCarga(sessoes: Sessao[], jogos: Jogo[], hoje: string): VariacaoCarga {
  const janelas = janelasDeCarga(sessoes, jogos, hoje);
  const [atual, ...refs] = janelas;
  const comDados = refs.filter((j) => j.total > 0);
  const referencia = comDados.length ? comDados.reduce((s, j) => s + j.total, 0) / comDados.length : null;
  const suficiente = comDados.length >= SEMANAS_MINIMAS;
  const variacao = referencia && referencia > 0 ? atual.total / referencia : null;
  return {
    atual: atual.total,
    referencia,
    variacao,
    semanasDeReferenciaComDados: comDados.length,
    suficiente,
    alerta: alertaDaVariacao(variacao, suficiente),
    janelas,
  };
}
