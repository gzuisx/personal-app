// Fase do tornozelo (seção 6.3): critérios SUGERIDOS para propor a próxima fase.
// A fase só muda quando o Gabriel aceita a proposta; o texto sempre pede confirmação com um profissional.
import type { FaseNum, Jogo, SerieLog, CriterioProposta } from "../tipos";
import { simetriaDosPes } from "./marcos";
import type { TesteCampoResumo } from "./tipos";

export const AVISO_FASE =
  "Critérios sugeridos; confirme com um fisioterapeuta ou ortopedista, principalmente se ainda houver dor ao chutar de mal jeito.";

export type AvaliacaoFase = {
  faseAtual: FaseNum;
  proxima: 2 | 3 | 4 | null;
  criterios: CriterioProposta[];
  /** todos os critérios atendidos e a segurança liberada */
  apto: boolean;
};

type Sessao = { data: string; series: SerieLog[] };

function sessoesDos(series: SerieLog[], slugs: string[]): Sessao[] {
  const porData = new Map<string, SerieLog[]>();
  for (const s of series) {
    if (!slugs.includes(s.exercicio)) continue;
    porData.set(s.data, [...(porData.get(s.data) ?? []), s]);
  }
  return [...porData.entries()]
    .map(([data, lista]) => ({ data, series: lista }))
    .sort((a, b) => b.data.localeCompare(a.data));
}

const semDor = (s: SerieLog) => (s.dorDurante ?? 0) < 4;

/** Sessões seguidas (da mais recente para trás) com pelo menos `series` séries boas, sem dor >= 4. */
function sequenciaBoa(
  series: SerieLog[],
  slugs: string[],
  minSeries: number,
  bom: (s: SerieLog) => boolean,
): number {
  let n = 0;
  for (const sessao of sessoesDos(series, slugs)) {
    const boas = sessao.series.filter((s) => bom(s) && semDor(s));
    const algumaComDor = sessao.series.some((s) => !semDor(s));
    if (boas.length >= minSeries && !algumaComDor) n++;
    else break;
  }
  return n;
}

const comReps = (min: number) => (s: SerieLog) => (s.reps ?? 0) >= min;
const comTempo = (min: number) => (s: SerieLog) => (s.duracaoS ?? 0) >= min;

function criterioSequencia(
  texto: string,
  alvo: number,
  feitas: number,
  unidade = "sessões",
): CriterioProposta {
  return { texto, ok: feitas >= alvo, progresso: `${Math.min(feitas, alvo)} de ${alvo} ${unidade}` };
}

function criterioVerde(dias: number, diasVerdes: number): CriterioProposta {
  return {
    texto: `Semáforo verde por ${dias} dias seguidos`,
    ok: diasVerdes >= dias,
    progresso: `${Math.min(diasVerdes, dias)} de ${dias} dias`,
  };
}

function criterioJogos(jogos: Jogo[], maxDor: number, n: number): CriterioProposta {
  const ultimos = [...jogos]
    .filter((j) => j.dor !== null && j.status !== "cancelado")
    .sort((a, b) => b.inicio.localeCompare(a.inicio))
    .slice(0, n);
  const ok = ultimos.length >= n && ultimos.every((j) => (j.dor ?? 99) <= maxDor);
  return {
    texto: `Dor depois do jogo até ${maxDor} nos ${n} últimos jogos`,
    ok,
    progresso: `${ultimos.filter((j) => (j.dor ?? 99) <= maxDor).length} de ${n} jogos`,
  };
}

export function avaliarFase(e: {
  fase: FaseNum;
  diasVerdes: number;
  series: SerieLog[];
  jogos: Jogo[];
  testes: TesteCampoResumo[];
  podeProgredir: boolean;
}): AvaliacaoFase {
  const { series } = e;

  if (e.fase === 1) {
    const criterios: CriterioProposta[] = [
      criterioVerde(7, e.diasVerdes),
      criterioSequencia(
        "Panturrilha no degrau, 3x12, sem dor de 4 ou mais",
        5,
        sequenciaBoa(series, ["pant-degrau"], 3, comReps(12)),
      ),
      criterioSequencia(
        "Equilíbrio em um pé por 30 s, sem falha",
        3,
        sequenciaBoa(series, ["eq-um-pe"], 3, comTempo(30)),
      ),
      criterioSequencia(
        "Elástico nas 3 direções, 3x15, sem dor de 4 ou mais",
        3,
        Math.min(
          sequenciaBoa(series, ["el-fora"], 3, comReps(15)),
          sequenciaBoa(series, ["el-dentro"], 3, comReps(15)),
          sequenciaBoa(series, ["el-cima"], 3, comReps(15)),
        ),
        "sessões (cada direção)",
      ),
    ];
    return { faseAtual: 1, proxima: 2, criterios, apto: e.podeProgredir && criterios.every((c) => c.ok) };
  }

  if (e.fase === 2) {
    const criterios: CriterioProposta[] = [
      criterioVerde(14, e.diasVerdes),
      criterioSequencia(
        "Panturrilha em um pé, 3x10, sem dor de 4 ou mais",
        3,
        sequenciaBoa(series, ["pant-um-pe"], 3, comReps(10)),
      ),
      criterioSequencia(
        "Equilíbrio na almofada por 30 s, sem falha",
        2,
        sequenciaBoa(series, ["eq-almofada", "eq-almofada-simples"], 3, comTempo(30)),
      ),
      criterioSequencia(
        "Agachamento em uma perna, 3x10, controlado",
        1,
        sequenciaBoa(series, ["agach-uma-perna"], 3, comReps(10)),
      ),
      criterioJogos(e.jogos, 3, 2),
    ];
    return { faseAtual: 2, proxima: 3, criterios, apto: e.podeProgredir && criterios.every((c) => c.ok) };
  }

  if (e.fase === 3) {
    const simetria = simetriaDosPes(e.testes, "T5");
    const criterios: CriterioProposta[] = [
      criterioVerde(21, e.diasVerdes),
      criterioSequencia(
        "Saltos e mudanças de direção sem dor de 4 ou mais",
        6,
        sequenciaBoa(
          series,
          [
            "salto-aterrissagem",
            "salto-lateral",
            "salto-bipodal-aterrissagem",
            "zigue-zague-lento",
            "mudanca-direcao",
          ],
          1,
          () => true,
        ),
        "sessões",
      ),
      {
        texto: "Simetria de 90% ou mais entre os pés no salto em um pé (teste T5)",
        ok: simetria !== null && simetria >= 90,
        progresso: simetria === null ? "teste ainda não feito" : `${Math.round(simetria)}% de simetria`,
      },
      criterioJogos(e.jogos, 2, 3),
    ];
    return { faseAtual: 3, proxima: 4, criterios, apto: e.podeProgredir && criterios.every((c) => c.ok) };
  }

  return { faseAtual: 4, proxima: null, criterios: [], apto: false };
}
