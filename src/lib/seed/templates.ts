// Modelos de plano P1 a P7 (seção 8.1). P1 a P4 e P7 mudam o dia de verdade; P5 e P6 ficam descritos
// e só aparecem como sugestão quando o app tiver dados para recomendá-los.
import { CATALOGO_POR_ID, exigeAcademia } from "./catalogo";
import type { Bloco, DiaPlano, ExercicioNoBloco } from "./plano";

export type ChaveTemplate = "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7";

export type Template = {
  chave: ChaveTemplate;
  nome: string;
  descricao: string;
  quandoRecomendar: string;
  quandoSair: string;
  duracaoDias: number | null;
  naoFazer: string[];
  /** false = ainda só descrito (não altera o dia) */
  aplicavel: boolean;
};

export const TEMPLATES: Template[] = [
  {
    chave: "P1",
    nome: "Base",
    descricao: "O plano da semana como está.",
    quandoRecomendar: "Rotina normal.",
    quandoSair: "Quando outro modelo for aceito.",
    duracaoDias: null,
    naoFazer: [],
    aplicavel: true,
  },
  {
    chave: "P2",
    nome: "Semana curta",
    descricao:
      "3 sessões de cerca de 25 min (tornozelo, 1 exercício principal e 1 acessório), mais os jogos.",
    quandoRecomendar: "Semana sem tempo ou atípica.",
    quandoSair: "Na semana seguinte, volta ao Base.",
    duracaoDias: 7,
    naoFazer: ["Não tente compensar as sessões que saíram."],
    aplicavel: true,
  },
  {
    chave: "P3",
    nome: "Descarga",
    descricao: "Volume 40% menor, velocidade curta e tornozelo mantido.",
    quandoRecomendar: "Prontidão baixa por 5 dias ou 3 semanas de carga crescente.",
    quandoSair: "Depois de 7 dias.",
    duracaoDias: 7,
    naoFazer: ["Sem sprint máximo.", "Sem carga nova."],
    aplicavel: true,
  },
  {
    chave: "P4",
    nome: "Retorno após alerta",
    descricao: "7 dias de tornozelo leve, caminhada e mobilidade, sem pliometria nem velocidade.",
    quandoRecomendar: "Depois de dor forte, inchaço ou falha.",
    quandoSair: "Semáforo verde por 3 dias.",
    duracaoDias: 7,
    naoFazer: ["Sem saltos.", "Sem corrida rápida.", "Sem carga alta."],
    aplicavel: true,
  },
  {
    chave: "P5",
    nome: "Foco posterior",
    descricao: "3 séries a mais de posterior na semana, sprint a 80 ou 90% e sem corrida lançada.",
    quandoRecomendar: "Queixa leve de posterior ou volume abaixo da meta.",
    quandoSair: "Quando o volume da meta for atingido por 2 semanas.",
    duracaoDias: 14,
    naoFazer: ["Sem corrida lançada."],
    aplicavel: false,
  },
  {
    chave: "P6",
    nome: "Foco arranque e potência",
    descricao: "2 sessões curtas de saídas e saltos com bastante descanso; mantém 1 sessão de força.",
    quandoRecomendar: "Só na fase 3 ou mais, com semáforo verde.",
    quandoSair: "Qualquer dor de 4 ou mais.",
    duracaoDias: 14,
    naoFazer: ["Sem saltos com dor."],
    aplicavel: false,
  },
  {
    chave: "P7",
    nome: "Sem academia ou viagem",
    descricao: "Peso do corpo, elástico e degrau, em 3 sessões.",
    quandoRecomendar: "Viagem ou semana sem acesso à academia.",
    quandoSair: "Quando voltar à academia.",
    duracaoDias: 7,
    naoFazer: [],
    aplicavel: true,
  },
];

export const TEMPLATE_POR_CHAVE = Object.fromEntries(TEMPLATES.map((t) => [t.chave, t])) as Record<
  ChaveTemplate,
  Template
>;

const nSeries = (e: ExercicioNoBloco) => Number(e.series ?? CATALOGO_POR_ID[e.slug]?.series ?? 1) || 1;
const comSeries = (e: ExercicioNoBloco, n: number): ExercicioNoBloco => ({
  ...e,
  series: String(Math.max(1, n)),
});
const ehTornozelo = (b: Bloco) => b.tags.includes("Tornozelo");

function leve(e: ExercicioNoBloco) {
  const c = CATALOGO_POR_ID[e.slug];
  return !!c && c.impacto === "baixo" && c.nivel <= 3 && ["tornozelo", "mobilidade", "core"].includes(c.tipo);
}

function semAcademia(e: ExercicioNoBloco): ExercicioNoBloco | null {
  const c = CATALOGO_POR_ID[e.slug];
  if (!c || !exigeAcademia(c)) return e;
  for (const altId of c.alternativas) {
    const alt = CATALOGO_POR_ID[altId];
    if (alt && !exigeAcademia(alt)) {
      return {
        ...e,
        slug: alt.id,
        nome: alt.nome,
        grupo: alt.grupo,
        repeticoes: alt.reps,
        series: String(alt.series),
        observacoes: alt.cuidado,
      };
    }
  }
  return null;
}

/** Aplica um modelo ao dia do plano. Nunca remove o tornozelo; P1 e modelos só descritos devolvem o dia igual. */
export function aplicarTemplate(chave: ChaveTemplate | string | null | undefined, dia: DiaPlano): DiaPlano {
  const t = chave ? TEMPLATE_POR_CHAVE[chave as ChaveTemplate] : undefined;
  if (!t || !t.aplicavel || t.chave === "P1") return dia;

  let blocos: Bloco[] = dia.blocos.map((b) => ({ ...b, exercicios: [...b.exercicios] }));

  if (t.chave === "P2") {
    // tornozelo inteiro, 1 principal e 1 acessório nos demais blocos; o funcional do instrutor cai
    blocos = blocos
      .filter((b) => !b.instrutor)
      .map((b) =>
        ehTornozelo(b) || b.tags.includes("Jogo")
          ? b
          : { ...b, exercicios: b.exercicios.slice(0, 2).map((e) => comSeries(e, Math.min(nSeries(e), 2))) },
      );
  }

  if (t.chave === "P3") {
    blocos = blocos
      .filter((b) => !b.instrutor)
      .map((b) => {
        if (b.tags.includes("Jogo") || ehTornozelo(b)) return b;
        const velocidade = b.exercicios.filter((e) => e.tipo === "velocidade");
        const resto = b.exercicios.filter((e) => e.tipo !== "velocidade");
        const reduzidos = resto.map((e) => comSeries(e, Math.round(nSeries(e) * 0.6)));
        const vel = velocidade.slice(0, 1).map((e) => comSeries(e, Math.min(2, nSeries(e))));
        return { ...b, exercicios: [...reduzidos, ...vel] };
      });
  }

  if (t.chave === "P4") {
    blocos = blocos
      .filter((b) => !b.instrutor)
      .map((b) =>
        b.tags.includes("Jogo")
          ? b
          : { ...b, exercicios: b.exercicios.filter(leve).map((e) => comSeries(e, Math.min(nSeries(e), 2))) },
      );
  }

  if (t.chave === "P7") {
    blocos = blocos.map((b) => ({
      ...b,
      exercicios: b.exercicios.map(semAcademia).filter((e): e is ExercicioNoBloco => !!e),
    }));
  }

  return { ...dia, blocos };
}
