// Insights e correlações (seção 10): honestos, com dados mínimos e linguagem de "parece que", nunca de causa.
// Regra geral: só mostra com pelo menos 10 observações (ou 4 semanas) e sempre diz "com base em N registros".
import { diaDoPlano, blocoTreinavel } from "../seed/plano";
import { sessoesDoExercicio, emPlato, exerciciosRegistrados } from "../evolucao/exercicios";
import { CATALOGO_POR_ID } from "../seed/catalogo";
import { addDias, dataISO, diaSemanaISO, DIAS_SEMANA, inicioSemana } from "../tempo";
import { GATILHO_ROTULO, SONO_HORAS, type DadosApp } from "../tipos";
import { itensDeCarga, somaCarga } from "./carga";

export const MIN_OBSERVACOES = 10;
export const MIN_SEMANAS = 4;

export type Insight = {
  id: string;
  titulo: string;
  /** frase pronta quando há dados suficientes */
  frase: string | null;
  /** quantos registros entraram */
  n: number;
  /** o que falta para aparecer (ex.: "Faltam 4 registros") */
  falta: string | null;
  disponivel: boolean;
  /** "Por que?": dados e método */
  porque: string[];
  /** gráfico simples de barras */
  barras?: { rotulo: string; valor: number }[];
  unidadeBarras?: string;
};

const fmt = (v: number, casas = 1) => v.toFixed(casas).replace(".", ",");
const media = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

function insight(
  base: Omit<Insight, "disponivel" | "falta" | "frase"> & {
    frase: string | null;
    minimo?: number;
    semanas?: number;
  },
): Insight {
  const minimo = base.minimo ?? MIN_OBSERVACOES;
  const semanasOk = base.semanas !== undefined && base.semanas >= MIN_SEMANAS;
  const disponivel = (base.n >= minimo || semanasOk) && !!base.frase;
  const faltam = Math.max(0, minimo - base.n);
  const { minimo: _m, semanas: _s, ...resto } = base;
  void _m;
  void _s;
  return {
    ...resto,
    frase: disponivel ? base.frase : null,
    disponivel,
    falta: disponivel
      ? null
      : base.n >= minimo
        ? "Ainda não há dados dos dois lados para comparar."
        : `Faltam ${faltam} ${faltam === 1 ? "registro" : "registros"} (mínimo ${minimo}).`,
    barras: disponivel ? base.barras : undefined,
  };
}

const dataDoJogo = (inicio: string) => dataISO(new Date(inicio));
const sonoCurto = (f: string | null) => f === "menos_5" || f === "5_6";
const sonoBom = (f: string | null) => f === "7_8" || f === "mais_8";

// ---------------------------------------------------------------- I1 a I10

function i1(d: DadosApp): Insight {
  const jogos = d.jogos.filter((j) => j.dor !== null && j.status !== "cancelado");
  const porDia = new Map<number, number[]>();
  for (const j of jogos) {
    const dow = diaSemanaISO(dataDoJogo(j.inicio));
    porDia.set(dow, [...(porDia.get(dow) ?? []), j.dor!]);
  }
  const barras = [...porDia.entries()].map(([dow, v]) => ({
    rotulo: DIAS_SEMANA[dow],
    valor: Math.round(media(v)! * 10) / 10,
  }));
  const gatilhos = new Map<string, number>();
  for (const j of jogos) if (j.gatilho) gatilhos.set(j.gatilho, (gatilhos.get(j.gatilho) ?? 0) + 1);
  const topo = [...gatilhos.entries()].sort((a, b) => b[1] - a[1])[0];
  const maior = [...barras].sort((a, b) => b.valor - a.valor)[0];
  const frase =
    barras.length >= 2 && maior
      ? `Parece que a dor depois do jogo costuma ser maior na ${maior.rotulo} (média ${fmt(maior.valor)}).${topo ? ` O gatilho mais anotado é "${GATILHO_ROTULO[topo[0] as keyof typeof GATILHO_ROTULO].toLowerCase()}" (${topo[1]} vezes).` : ""}`
      : topo
        ? `O gatilho mais anotado depois dos jogos é "${GATILHO_ROTULO[topo[0] as keyof typeof GATILHO_ROTULO].toLowerCase()}" (${topo[1]} vezes).`
        : null;
  return insight({
    id: "I1",
    titulo: "Dor depois do jogo por dia e por gatilho",
    frase,
    n: jogos.length,
    porque: [
      "Dor depois do jogo (0 a 10) de cada jogo registrado, agrupada por dia da semana.",
      "Gatilho anotado em cada jogo.",
    ],
    barras,
    unidadeBarras: "dor média",
  });
}

function i2(d: DadosApp): Insight {
  const comSono = d.checkins.filter((c) => c.sonoFaixa);
  const curto = comSono.filter((c) => sonoCurto(c.sonoFaixa)).map((c) => c.dor);
  const bom = comSono.filter((c) => sonoBom(c.sonoFaixa)).map((c) => c.dor);
  const mc = media(curto);
  const mb = media(bom);
  const ok = curto.length >= 3 && bom.length >= 3 && mc !== null && mb !== null;
  return insight({
    id: "I2",
    titulo: "Dor do dia depois de dormir pouco ou bem",
    frase: ok
      ? `Parece que, depois de dormir menos de 7 h, a dor média do check-in foi ${fmt(mc!)}; com 7 h ou mais, ${fmt(mb!)}.`
      : null,
    n: comSono.length,
    porque: [
      "Sono da última noite e dor do tornozelo no mesmo check-in.",
      `Menos de 7 h: ${curto.length} dias. 7 h ou mais: ${bom.length} dias.`,
    ],
    barras: ok
      ? [
          { rotulo: "Menos de 7 h", valor: Math.round(mc! * 10) / 10 },
          { rotulo: "7 h ou mais", valor: Math.round(mb! * 10) / 10 },
        ]
      : undefined,
    unidadeBarras: "dor média",
  });
}

function i3(d: DadosApp): Insight {
  const registros = d.jogos
    .filter((j) => j.dor !== null && j.status !== "cancelado")
    .map((j) => ({ dor: j.dor!, pre: d.preJogos.find((p) => p.jogoData === dataDoJogo(j.inicio)) }))
    .filter((x) => x.pre);
  const completo = registros.filter((x) => x.pre!.concluido).map((x) => x.dor);
  const parcial = registros.filter((x) => !x.pre!.concluido).map((x) => x.dor);
  const com = registros.filter((x) => x.pre!.tornozeleira).map((x) => x.dor);
  const sem = registros.filter((x) => !x.pre!.tornozeleira).map((x) => x.dor);
  const mcomp = media(completo);
  const mparc = media(parcial);
  const partes: string[] = [];
  if (completo.length >= 3 && parcial.length >= 3)
    partes.push(`Com aquecimento completo a dor depois do jogo foi ${fmt(mcomp!)}; sem ele, ${fmt(mparc!)}.`);
  if (com.length >= 3 && sem.length >= 3)
    partes.push(`Com tornozeleira, ${fmt(media(com)!)}; sem, ${fmt(media(sem)!)}.`);
  return insight({
    id: "I3",
    titulo: "Dor depois do jogo com e sem aquecimento e tornozeleira",
    frase: partes.length ? `Parece que: ${partes.join(" ")}` : null,
    n: registros.length,
    porque: [
      "Jogos com registro de dor e de aquecimento pré-jogo.",
      `Aquecimento completo: ${completo.length} jogos. Parcial: ${parcial.length}.`,
    ],
  });
}

/** Semanas (segunda) com dados, em ordem. */
function semanasComDados(d: DadosApp, hoje: string) {
  const inicios = new Set<string>();
  for (const c of d.checkins) inicios.add(inicioSemana(c.data));
  for (const s of d.sessoes) inicios.add(inicioSemana(s.data));
  const atual = inicioSemana(hoje);
  return [...inicios].filter((i) => i < atual).sort();
}

function i4(d: DadosApp, hoje: string): Insight {
  const semanas = semanasComDados(d, hoje);
  const pares: { carga: number; dorSeguinte: number }[] = [];
  for (const s of semanas) {
    const carga = somaCarga(itensDeCarga(d.sessoes, d.jogos, s, addDias(s, 6)));
    const prox = addDias(s, 7);
    const dores = d.checkins.filter((c) => c.data >= prox && c.data <= addDias(prox, 6)).map((c) => c.dor);
    if (carga > 0 && dores.length >= 3) pares.push({ carga, dorSeguinte: media(dores)! });
  }
  const mediana = [...pares].map((p) => p.carga).sort((a, b) => a - b)[Math.floor(pares.length / 2)];
  const alta = pares.filter((p) => p.carga >= mediana).map((p) => p.dorSeguinte);
  const baixa = pares.filter((p) => p.carga < mediana).map((p) => p.dorSeguinte);
  const ok = alta.length >= 2 && baixa.length >= 2;
  return insight({
    id: "I4",
    titulo: "Carga da semana e dor da semana seguinte",
    frase: ok
      ? `Parece que, nas semanas de carga maior, a dor média da semana seguinte foi ${fmt(media(alta)!)}; nas de carga menor, ${fmt(media(baixa)!)}.`
      : null,
    n: pares.length,
    minimo: MIN_SEMANAS,
    porque: [
      "Carga = esforço x minutos das sessões e jogos da semana.",
      "Dor média dos check-ins da semana seguinte (mínimo de 3 check-ins).",
    ],
    barras: ok
      ? [
          { rotulo: "Carga maior", valor: Math.round(media(alta)! * 10) / 10 },
          { rotulo: "Carga menor", valor: Math.round(media(baixa)! * 10) / 10 },
        ]
      : undefined,
    unidadeBarras: "dor média",
  });
}

function i5(d: DadosApp, hoje: string): Insight {
  const semanas = semanasComDados(d, hoje).filter((s) =>
    d.checkins.some(
      (c) => inicioSemana(c.data) === s && c.posteriorApertou !== undefined && c.posteriorApertou !== null,
    ),
  );
  const linhas = semanas.map((s) => {
    const fim = addDias(s, 6);
    const apertou = d.checkins.filter((c) => c.data >= s && c.data <= fim && c.posteriorApertou).length;
    const sprint = d.series.filter(
      (x) => x.data >= s && x.data <= fim && CATALOGO_POR_ID[x.exercicio]?.tipo === "velocidade",
    ).length;
    const posterior = d.series.filter(
      (x) =>
        x.data >= s &&
        x.data <= fim &&
        /posterior|stiff|nordic|isquio/i.test(`${CATALOGO_POR_ID[x.exercicio]?.grupo ?? ""} ${x.exercicio}`),
    ).length;
    return { apertou, sprint, posterior };
  });
  const comApertou = linhas.filter((l) => l.apertou > 0);
  const sem = linhas.filter((l) => l.apertou === 0);
  const ok = comApertou.length >= 1 && sem.length >= 1;
  return insight({
    id: "I5",
    titulo: "Posterior apertou, sprint e volume de posterior",
    frase: ok
      ? `Parece que, nas semanas em que o posterior apertou, houve em média ${fmt(media(comApertou.map((l) => l.sprint))!, 0)} séries de velocidade e ${fmt(media(comApertou.map((l) => l.posterior))!, 0)} de posterior; nas outras, ${fmt(media(sem.map((l) => l.sprint))!, 0)} e ${fmt(media(sem.map((l) => l.posterior))!, 0)}.`
      : null,
    n: linhas.length,
    minimo: MIN_SEMANAS,
    porque: [
      "Semanas com a resposta de 'posterior apertou' no check-in.",
      "Séries de velocidade e de posterior gravadas no treino guiado.",
    ],
  });
}

function i6(d: DadosApp, hoje: string): Insight {
  const porPeriodo = new Map<string, { plan: number; feito: number }>();
  const inicio = addDias(hoje, -56);
  for (let dia = inicio; dia < hoje; dia = addDias(dia, 1)) {
    for (const b of diaDoPlano(dia).blocos.filter(blocoTreinavel)) {
      const reg = porPeriodo.get(b.periodo) ?? { plan: 0, feito: 0 };
      reg.plan += 1;
      if (
        d.sessoes.some(
          (s) => s.data === dia && s.bloco === b.id && (s.resultado === "feito" || s.resultado === "parcial"),
        )
      )
        reg.feito += 1;
      porPeriodo.set(b.periodo, reg);
    }
  }
  const total = d.sessoes.filter((s) => s.data >= inicio && s.data < hoje).length;
  const rotulos: Record<string, string> = { manha: "Manhã", tarde: "Tarde", noite: "Noite", dia: "Dia" };
  const barras = [...porPeriodo.entries()]
    .filter(([, v]) => v.plan >= 3)
    .map(([p, v]) => ({ rotulo: rotulos[p] ?? p, valor: Math.round((v.feito / v.plan) * 100) }));
  const melhor = [...barras].sort((a, b) => b.valor - a.valor)[0];
  const pior = [...barras].sort((a, b) => a.valor - b.valor)[0];
  const ok =
    barras.length >= 2 && melhor && pior && melhor.rotulo !== pior.rotulo && melhor.valor - pior.valor >= 15;
  return insight({
    id: "I6",
    titulo: "Quando você mais cumpre o treino",
    frase: ok
      ? `Parece que você cumpre mais pela ${melhor.rotulo.toLowerCase()} (${melhor.valor}% das sessões) do que à ${pior.rotulo.toLowerCase()} (${pior.valor}%). Considere reagendar o que costuma ficar para trás.`
      : null,
    n: total,
    porque: ["Sessões do plano nas últimas 8 semanas, feitas ou parciais, contra as planejadas por período."],
    barras: ok ? barras : undefined,
    unidadeBarras: "% cumprido",
  });
}

function i7(d: DadosApp): Insight {
  const doeu = new Map<string, number>();
  for (const s of d.series)
    if ((s.dorDurante ?? 0) >= 4) doeu.set(s.exercicio, (doeu.get(s.exercicio) ?? 0) + 1);
  const top = [...doeu.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const nome = (slug: string) => CATALOGO_POR_ID[slug]?.nome ?? slug;
  return insight({
    id: "I7",
    titulo: "Exercícios que mais geram 'doeu'",
    frase: top.length
      ? `Os exercícios com mais séries de dor 4 ou mais: ${top.map(([s, n]) => `${nome(s)} (${n})`).join(", ")}. Vale pensar numa versão mais leve${CATALOGO_POR_ID[top[0][0]]?.regressao ? ` (por exemplo, ${nome(CATALOGO_POR_ID[top[0][0]].regressao!)})` : ""}.`
      : null,
    n: d.series.length,
    porque: ["Séries gravadas no treino guiado com dor durante o exercício de 4 ou mais."],
    barras: top.map(([s, n]) => ({ rotulo: nome(s), valor: n })),
    unidadeBarras: "séries com dor",
  });
}

function i8(d: DadosApp, hoje: string): Insight {
  const linhas: string[] = [];
  const barras: { rotulo: string; valor: number }[] = [];
  for (const { slug } of exerciciosRegistrados(d.series).slice(0, 8)) {
    const s = sessoesDoExercicio(d.series, slug);
    if (s.length < 3) continue;
    const comCarga = s.filter((x) => x.cargaMaxKg !== null);
    if (comCarga.length < 3) continue;
    const primeiro = comCarga[0].cargaMaxKg!;
    const ultimo = comCarga[comCarga.length - 1].cargaMaxKg!;
    const nome = CATALOGO_POR_ID[slug]?.nome ?? slug;
    barras.push({ rotulo: nome, valor: Math.round((ultimo - primeiro) * 10) / 10 });
    if (emPlato(s, hoje)) linhas.push(`${nome} parece parado há ${4} semanas ou mais em ${fmt(ultimo)} kg.`);
    else if (ultimo > primeiro) linhas.push(`${nome} subiu de ${fmt(primeiro)} para ${fmt(ultimo)} kg.`);
  }
  return insight({
    id: "I8",
    titulo: "Evolução de cargas e platôs",
    frase: linhas.length ? linhas.slice(0, 3).join(" ") : null,
    n: d.series.length,
    porque: [
      "Maior carga de cada sessão por exercício, a partir de 3 sessões com carga registrada.",
      "Platô = sem subir há 4 semanas.",
    ],
    barras,
    unidadeBarras: "kg de diferença",
  });
}

function i9(d: DadosApp): Insight {
  const porDia = new Map<number, number[]>();
  for (const c of d.checkins) {
    if (!c.sonoFaixa) continue;
    const dow = diaSemanaISO(c.data);
    porDia.set(dow, [...(porDia.get(dow) ?? []), SONO_HORAS[c.sonoFaixa]]);
  }
  const barras = [...porDia.entries()]
    .filter(([, v]) => v.length >= 2)
    .map(([dow, v]) => ({ rotulo: DIAS_SEMANA[dow], valor: Math.round(media(v)! * 10) / 10 }));
  const pior = [...barras].sort((a, b) => a.valor - b.valor)[0];
  const n = [...porDia.values()].reduce((s, v) => s + v.length, 0);
  return insight({
    id: "I9",
    titulo: "Sono médio por dia da semana",
    frase:
      pior && pior.valor < 7
        ? `Parece que a noite que chega na ${pior.rotulo} é a mais curta (${fmt(pior.valor)} h em média). Que tal um horário fixo para dormir nesse dia?`
        : barras.length
          ? "O sono médio está em 7 h ou mais em todos os dias com registro."
          : null,
    n,
    porque: ["Faixa de sono do check-in convertida em horas (média de cada faixa)."],
    barras,
    unidadeBarras: "horas",
  });
}

function i10(d: DadosApp): Insight {
  const linhas = d.diarios
    .map((g) => {
      const ck =
        d.checkins.find((c) => c.data === g.jogoData) ??
        d.checkins.find((c) => c.data === addDias(g.jogoData, -1));
      return { g, sono: ck?.sonoFaixa ? SONO_HORAS[ck.sonoFaixa] : null };
    })
    .filter((x) => x.sono !== null && x.g.condicao !== null);
  const sonoBomJogos = linhas.filter((x) => x.sono! >= 7).map((x) => x.g.condicao!);
  const sonoCurtoJogos = linhas.filter((x) => x.sono! < 7).map((x) => x.g.condicao!);
  const ok = sonoBomJogos.length >= 3 && sonoCurtoJogos.length >= 3;
  return insight({
    id: "I10",
    titulo: "Notas do diário e sono",
    frase: ok
      ? `Parece que a nota de condição física foi ${fmt(media(sonoBomJogos)!)} depois de 7 h ou mais de sono e ${fmt(media(sonoCurtoJogos)!)} com menos.`
      : null,
    n: linhas.length,
    porque: [
      "Nota de condição física (1 a 5) do diário e sono do check-in do dia do jogo (ou do dia anterior).",
    ],
  });
}

export function calcularInsights(dados: DadosApp, hoje: string): Insight[] {
  return [
    i1(dados),
    i2(dados),
    i3(dados),
    i4(dados, hoje),
    i5(dados, hoje),
    i6(dados, hoje),
    i7(dados),
    i8(dados, hoje),
    i9(dados),
    i10(dados),
  ];
}
