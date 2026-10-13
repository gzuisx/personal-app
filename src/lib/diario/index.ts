// Diário do centroavante (seção 9.5): tendências por média móvel de 5 jogos. Sem comparação social.
import type { DiarioJogo } from "../tipos-testes";

export type CampoDiario =
  "finalizacoes" | "gols" | "assistencias" | "arrancadas" | "olhadas" | "movimentacao" | "condicao";

export const ROTULO_CAMPO: Record<CampoDiario, string> = {
  finalizacoes: "Finalizações",
  gols: "Gols",
  assistencias: "Assistências",
  arrancadas: "Arrancadas de ruptura",
  olhadas: "Olhadas por cima do ombro (1 a 5)",
  movimentacao: "Movimentação sem bola (1 a 5)",
  condicao: "Condição física (1 a 5)",
};

export const JANELA_MEDIA_MOVEL = 5;

export function diarioVazio(jogoData: string): DiarioJogo {
  return {
    jogoData,
    finalizacoes: null,
    gols: null,
    assistencias: null,
    arrancadas: null,
    olhadas: null,
    movimentacao: null,
    condicao: null,
    bom: [],
    melhorar: [],
  };
}

/** O diário foi preenchido com pelo menos alguma coisa? */
export function temConteudo(d: DiarioJogo) {
  return (
    d.finalizacoes !== null ||
    d.gols !== null ||
    d.assistencias !== null ||
    d.arrancadas !== null ||
    d.olhadas !== null ||
    d.movimentacao !== null ||
    d.condicao !== null ||
    d.bom.some((t) => t.trim()) ||
    d.melhorar.some((t) => t.trim())
  );
}

export type PontoTendencia = { jogoData: string; valor: number; mediaMovel: number };

/** Valor de cada jogo e a média dos últimos 5 jogos até ele (menos de 5 jogos usa os que houver). */
export function tendencia(diarios: DiarioJogo[], campo: CampoDiario): PontoTendencia[] {
  const ordenados = [...diarios]
    .filter((d) => d[campo] !== null)
    .sort((a, b) => a.jogoData.localeCompare(b.jogoData));
  return ordenados.map((d, i) => {
    const janela = ordenados
      .slice(Math.max(0, i - JANELA_MEDIA_MOVEL + 1), i + 1)
      .map((x) => x[campo] as number);
    return {
      jogoData: d.jogoData,
      valor: d[campo] as number,
      mediaMovel: Math.round((janela.reduce((a, b) => a + b, 0) / janela.length) * 100) / 100,
    };
  });
}

/** "sobe", "desce" ou "estavel" comparando a média móvel atual com a de 5 jogos antes; precisa de 6 jogos. */
export function sentido(pontos: PontoTendencia[]): "sobe" | "desce" | "estavel" | null {
  if (pontos.length < JANELA_MEDIA_MOVEL + 1) return null;
  const atual = pontos[pontos.length - 1].mediaMovel;
  const antes = pontos[pontos.length - 1 - JANELA_MEDIA_MOVEL].mediaMovel;
  const d = atual - antes;
  if (Math.abs(d) < 0.25) return "estavel";
  return d > 0 ? "sobe" : "desce";
}

/** Limpa o texto das duas coisas boas e das duas a melhorar (máximo 2 itens, 80 caracteres). */
export function limparItens(itens: string[]) {
  return itens
    .map((t) => t.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 2);
}
