// Progressão por exercício (seção 6.1): dupla progressão. Aqui é só CÁLCULO e SUGESTÃO:
// nada muda sozinho, e nada sobe quando a segurança bloqueia.

export type SerieHistorica = {
  /** AAAA-MM-DD da sessão */
  data: string;
  numero: number;
  reps: number | null;
  cargaKg: number | null;
  esforco: "facil" | "ok" | "duro" | null;
  dorDurante: number | null;
};

export type SessaoDoExercicio = { data: string; series: SerieHistorica[] };

export type AcaoProgressao = "subir" | "manter" | "reduzir" | "variante" | "sem_dados";

export type CriterioProgressao = { texto: string; ok: boolean };

export type SugestaoProgressao = {
  acao: AcaoProgressao;
  cargaAtualKg: number | null;
  sugeridaKg: number | null;
  motivo: string;
  checklist: CriterioProgressao[];
};

/** Agrupa as séries por data (uma sessão por dia), da mais recente para a mais antiga. */
export function sessoesDoExercicio(series: SerieHistorica[]): SessaoDoExercicio[] {
  const porData = new Map<string, SerieHistorica[]>();
  for (const s of series) {
    const lista = porData.get(s.data) ?? [];
    lista.push(s);
    porData.set(s.data, lista);
  }
  return [...porData.entries()]
    .map(([data, lista]) => ({ data, series: lista.sort((a, b) => a.numero - b.numero) }))
    .sort((a, b) => b.data.localeCompare(a.data));
}

/** Aumento de 2,5% a 5% (de 1 a 2,5 kg), em passos de 0,5 kg. */
export function proximaCarga(cargaKg: number) {
  const delta = Math.min(2.5, Math.max(1, Math.round(cargaKg * 0.04 * 2) / 2));
  return cargaKg + delta;
}

/** Redução de cerca de 8% (entre 5% e 10%), em passos de 0,5 kg. */
export function cargaReduzida(cargaKg: number) {
  return Math.max(0, Math.round((cargaKg * 0.92) / 0.5) * 0.5);
}

const maiorCarga = (s: SessaoDoExercicio) =>
  s.series.reduce<number | null>(
    (m, x) => (x.cargaKg !== null && (m === null || x.cargaKg > m) ? x.cargaKg : m),
    null,
  );

const atingiuTopo = (s: SessaoDoExercicio, faixa: { max: number }, seriesPlano: number) =>
  s.series.length >= seriesPlano &&
  s.series.every((x) => (x.reps ?? 0) >= faixa.max && x.esforco !== "duro" && (x.dorDurante ?? 0) <= 3);

const abaixoDoPiso = (s: SessaoDoExercicio, faixa: { min: number }) =>
  s.series.some((x) => (x.reps ?? Infinity) < faixa.min);

export function sugerirProgressao(entrada: {
  series: SerieHistorica[];
  faixa: { min: number; max: number };
  seriesPlano: number;
  /** vem de lib/safety: se for false, nenhuma progressão é sugerida */
  podeProgredir: boolean;
  /** prontidão >= 75 nos dias das sessões (calculada pelo coach); padrão true se não informada */
  prontidaoOk?: boolean;
}): SugestaoProgressao {
  const sessoes = sessoesDoExercicio(entrada.series).slice(0, 3);
  const cargaAtualKg = sessoes[0] ? maiorCarga(sessoes[0]) : null;

  if (sessoes.length < 2) {
    const falta = 2 - sessoes.length;
    return {
      acao: "sem_dados",
      cargaAtualKg,
      sugeridaKg: null,
      motivo: `${falta === 1 ? "Falta 1 sessão" : `Faltam ${falta} sessões`} com este exercício para sugerir uma progressão.`,
      checklist: [{ texto: `${sessoes.length} de 2 sessões registradas`, ok: false }],
    };
  }

  const [s1, s2] = sessoes;
  const topo1 = atingiuTopo(s1, entrada.faixa, entrada.seriesPlano);
  const topo2 = atingiuTopo(s2, entrada.faixa, entrada.seriesPlano);
  const prontidaoOk = entrada.prontidaoOk ?? true;

  const checklist: CriterioProgressao[] = [
    {
      texto: `Topo da faixa (${entrada.faixa.max}) em todas as séries, 2 sessões seguidas`,
      ok: topo1 && topo2,
    },
    { texto: "Esforço sem ser 'duro' e sem dor", ok: topo1 && topo2 },
    { texto: "Segurança do tornozelo liberada", ok: entrada.podeProgredir },
    { texto: "Prontidão boa nos dias dos treinos", ok: prontidaoOk },
  ];

  // Regra mestra (6.5): sem segurança liberada, nunca sobe.
  if (!entrada.podeProgredir) {
    return {
      acao: "manter",
      cargaAtualKg,
      sugeridaKg: null,
      motivo: "A segurança do tornozelo não liberou progressão. Mantenha a carga.",
      checklist,
    };
  }

  if (topo1 && topo2 && prontidaoOk) {
    if (cargaAtualKg !== null && cargaAtualKg > 0) {
      const nova = proximaCarga(cargaAtualKg);
      return {
        acao: "subir",
        cargaAtualKg,
        sugeridaKg: nova,
        motivo: `Você fechou o topo da faixa em 2 sessões. Pode subir de ${cargaAtualKg} para ${nova} kg.`,
        checklist,
      };
    }
    return {
      acao: "variante",
      cargaAtualKg,
      sugeridaKg: null,
      motivo:
        "Você fechou o topo da faixa em 2 sessões. Sem carga externa: considere uma variante mais difícil.",
      checklist,
    };
  }

  if (sessoes.length >= 3 && sessoes.every((s) => abaixoDoPiso(s, entrada.faixa)) && cargaAtualKg) {
    const menor = cargaReduzida(cargaAtualKg);
    return {
      acao: "reduzir",
      cargaAtualKg,
      sugeridaKg: menor,
      motivo: `Abaixo do mínimo da faixa em 3 sessões. Reduza de ${cargaAtualKg} para ${menor} kg e confira sono e carga.`,
      checklist: [{ texto: "Abaixo de " + entrada.faixa.min + " repetições em 3 sessões", ok: true }],
    };
  }

  return {
    acao: "manter",
    cargaAtualKg,
    sugeridaKg: null,
    motivo: abaixoDoPiso(s1, entrada.faixa)
      ? "Ainda abaixo do mínimo da faixa. Mantenha a carga."
      : "Continue com a mesma carga até fechar o topo da faixa em 2 sessões.",
    checklist,
  };
}
