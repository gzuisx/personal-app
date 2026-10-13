// Testes de campo T1 a T6 (seção 9.1): definições, melhor tentativa, evolução, simetria e metas.
import type { TesteCampoResumo } from "../coach/tipos";
import type { Meta, PeTeste, TesteCampo, TipoTeste } from "../tipos-testes";

export type Subtipo = { valor: string; rotulo: string };

export type DefTeste = {
  tipo: TipoTeste;
  nome: string;
  resumo: string;
  /** como fazer, em frases curtas */
  passos: string[];
  aquecimento: string;
  unidade: string;
  menorEhMelhor: boolean;
  tentativas: number;
  /** o teste é feito em cada pé */
  porPe: boolean;
  subtipos?: Subtipo[];
  /** o valor vem do cronômetro do app */
  cronometro?: boolean;
  /** conta falhas (T3) */
  contaFalhas?: boolean;
  /** só liberado na fase 3 ou mais e com semáforo verde */
  exigeFase3?: boolean;
  opcional?: boolean;
  descansoS?: number;
};

export const AVISO_PARE = "Pare se doer mais de 3. Não force o teste.";

export const TESTES: DefTeste[] = [
  {
    tipo: "T1",
    nome: "Sprint de 20 m",
    resumo: "Tempo da melhor de 3 tentativas.",
    passos: [
      "Marque 20 m e comece parado, com um pé à frente.",
      "Toque em Iniciar, corra a 100% e toque em Parar ao cruzar a marca (ou digite o tempo).",
      "Descanse 2 min entre as tentativas.",
    ],
    aquecimento: "10 min de aquecimento com corridas progressivas.",
    unidade: "s",
    menorEhMelhor: true,
    tentativas: 3,
    porPe: false,
    cronometro: true,
    descansoS: 120,
  },
  {
    tipo: "T2",
    nome: "Salto vertical",
    resumo: "Altura estimada do salto com contramovimento (melhor de 3).",
    passos: [
      "Em pé ao lado da parede, marque a altura do alcance com o braço esticado.",
      "Agache rápido e salte o mais alto que puder, marcando a parede no ponto mais alto.",
      "A altura do salto é a distância entre as duas marcas, em cm.",
    ],
    aquecimento: "Aquecimento geral e 2 saltos leves.",
    unidade: "cm",
    menorEhMelhor: false,
    tentativas: 3,
    porPe: false,
  },
  {
    tipo: "T3",
    nome: "Equilíbrio em um pé (30 s)",
    resumo: "Segundos mantidos e número de falhas, em cada pé.",
    passos: [
      "Fique em um pé só, mãos na cintura, por até 30 s.",
      "Toque em Iniciar e, se o pé de fora tocar o chão ou você se segurar, conte uma falha.",
      "Repita com os olhos fechados e depois no outro pé.",
    ],
    aquecimento: "Mobilidade de tornozelo por 3 min.",
    unidade: "s",
    menorEhMelhor: false,
    tentativas: 1,
    porPe: true,
    cronometro: true,
    contaFalhas: true,
    subtipos: [
      { valor: "olhos_abertos", rotulo: "Olhos abertos" },
      { valor: "olhos_fechados", rotulo: "Olhos fechados" },
    ],
  },
  {
    tipo: "T4",
    nome: "Panturrilha em um pé",
    resumo: "Repetições até a falha controlada, em cada pé.",
    passos: [
      "Em um pé só, segurando de leve numa parede, suba nas pontas até o topo.",
      "Faça no ritmo de 2 s para subir e 2 s para descer.",
      "Pare quando a técnica falhar. Anote as repetições de cada pé.",
    ],
    aquecimento: "10 subidas bilaterais leves.",
    unidade: "reps",
    menorEhMelhor: false,
    tentativas: 1,
    porPe: true,
  },
  {
    tipo: "T5",
    nome: "Salto horizontal em um pé",
    resumo: "Distância do salto (horizontal ou triplo), em cada pé. Calcula a simetria.",
    passos: [
      "Parta em um pé só e salte para a frente, aterrissando no mesmo pé e segurando 2 s.",
      "Meça da ponta do pé de partida até o calcanhar de chegada, em cm.",
      "Repita no outro pé. No triplo, some os três saltos seguidos.",
    ],
    aquecimento: "Aquecimento completo e saltinhos no lugar.",
    unidade: "cm",
    menorEhMelhor: false,
    tentativas: 3,
    porPe: true,
    exigeFase3: true,
    subtipos: [
      { valor: "horizontal", rotulo: "Horizontal" },
      { valor: "triplo", rotulo: "Triplo" },
    ],
  },
  {
    tipo: "T6",
    nome: "Alcance multidirecional",
    resumo: "Distância do alcance à frente, lateral e atrás, em cada pé (opcional).",
    passos: [
      "Em um pé só, empurre uma marca no chão o mais longe que conseguir, sem apoiar o outro pé.",
      "Meça em cm a cada direção e volte à posição inicial com controle.",
      "Repita no outro pé.",
    ],
    aquecimento: "Mobilidade de quadril e tornozelo.",
    unidade: "cm",
    menorEhMelhor: false,
    tentativas: 3,
    porPe: true,
    opcional: true,
    subtipos: [
      { valor: "frente", rotulo: "À frente" },
      { valor: "lateral", rotulo: "Lateral" },
      { valor: "atras", rotulo: "Atrás" },
    ],
  },
];

export const TESTE_POR_TIPO = Object.fromEntries(TESTES.map((t) => [t.tipo, t])) as Record<
  TipoTeste,
  DefTeste
>;

export const ROTULO_PE: Record<PeTeste, string> = { direito: "Pé direito", esquerdo: "Pé esquerdo" };

/** Melhor tentativa de um grupo (mesmo teste, pé, subtipo e data). */
export function melhorTentativa(lista: TesteCampo[]): TesteCampo | null {
  if (!lista.length) return null;
  const def = TESTE_POR_TIPO[lista[0].tipo];
  return [...lista].sort((a, b) => {
    const dv = def.menorEhMelhor ? a.valor - b.valor : b.valor - a.valor;
    if (dv !== 0) return dv;
    return (a.falhas ?? 0) - (b.falhas ?? 0);
  })[0];
}

/** Um resultado por teste, pé, subtipo e data: a melhor tentativa. */
export function resumirTestes(testes: TesteCampo[]): TesteCampoResumo[] {
  const grupos = new Map<string, TesteCampo[]>();
  for (const t of testes) {
    const chave = `${t.tipo}|${t.pe ?? ""}|${t.subtipo ?? ""}|${t.data}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), t]);
  }
  const saida: TesteCampoResumo[] = [];
  for (const lista of grupos.values()) {
    const m = melhorTentativa(lista);
    if (!m) continue;
    saida.push({
      tipo: m.tipo,
      pe: m.pe ?? null,
      subtipo: m.subtipo ?? null,
      valor: m.valor,
      unidade: m.unidade,
      data: m.data,
      menorEhMelhor: TESTE_POR_TIPO[m.tipo].menorEhMelhor,
      falhas: m.falhas ?? null,
    });
  }
  return saida.sort((a, b) => a.data.localeCompare(b.data));
}

export type SerieDoTeste = { chave: string; rotulo: string; pontos: { data: string; valor: number }[] };

/** Séries para o gráfico de evolução: uma linha por pé e subtipo. */
export function seriesDoTeste(resumos: TesteCampoResumo[], tipo: TipoTeste): SerieDoTeste[] {
  const def = TESTE_POR_TIPO[tipo];
  const mapa = new Map<string, SerieDoTeste>();
  for (const r of resumos.filter((x) => x.tipo === tipo)) {
    const chave = `${r.pe ?? "-"}|${r.subtipo ?? "-"}`;
    const sub = def.subtipos?.find((s) => s.valor === r.subtipo)?.rotulo;
    const partes = [r.pe ? ROTULO_PE[r.pe] : null, sub ?? null].filter(Boolean);
    const s = mapa.get(chave) ?? { chave, rotulo: partes.join(" · ") || def.nome, pontos: [] };
    s.pontos.push({ data: r.data, valor: r.valor });
    mapa.set(chave, s);
  }
  return [...mapa.values()];
}

/** Simetria (menor / maior, em %) dos dois pés na data mais recente em que ambos foram testados. */
export function simetriaRecente(resumos: TesteCampoResumo[], tipo: TipoTeste, subtipo?: string | null) {
  const doTipo = resumos.filter(
    (r) => r.tipo === tipo && (subtipo === undefined || (r.subtipo ?? null) === subtipo),
  );
  const ultimo = (pe: PeTeste) =>
    doTipo.filter((r) => r.pe === pe).sort((a, b) => b.data.localeCompare(a.data))[0];
  const d = ultimo("direito");
  const e = ultimo("esquerdo");
  if (!d || !e || d.valor <= 0 || e.valor <= 0) return null;
  return {
    percentual: (Math.min(d.valor, e.valor) / Math.max(d.valor, e.valor)) * 100,
    maisFraco: d.valor < e.valor ? ("direito" as const) : ("esquerdo" as const),
  };
}

/** Variação (%) entre os dois testes mais recentes de um mesmo grupo; positivo = melhorou. */
export function variacaoDoTeste(resumos: TesteCampoResumo[]): number | null {
  if (resumos.length < 2) return null;
  const [novo, antigo] = [...resumos].sort((a, b) => b.data.localeCompare(a.data));
  if (antigo.valor === 0) return null;
  const mudanca = ((novo.valor - antigo.valor) / antigo.valor) * 100;
  return novo.menorEhMelhor ? -mudanca : mudanca;
}

// ---------------------------------------------------------------- metas (8.4 e 9.2)

export type ProgressoMeta = {
  meta: Meta;
  atual: number | null;
  /** 0 a 100 */
  percentual: number | null;
  atingida: boolean;
};

/** Último valor do teste ligado à meta (mesmo pé e subtipo, se a meta os definir). */
export function valorAtualDaMeta(meta: Meta, resumos: TesteCampoResumo[]): number | null {
  if (!meta.tipoTeste) return null;
  const lista = resumos
    .filter(
      (r) =>
        r.tipo === meta.tipoTeste &&
        (!meta.pe || r.pe === meta.pe) &&
        (meta.subtipo === undefined || meta.subtipo === null || r.subtipo === meta.subtipo),
    )
    .sort((a, b) => b.data.localeCompare(a.data));
  return lista[0]?.valor ?? null;
}

export function progressoDaMeta(meta: Meta, resumos: TesteCampoResumo[]): ProgressoMeta {
  const atual = valorAtualDaMeta(meta, resumos);
  if (atual === null || meta.inicial === null) return { meta, atual, percentual: null, atingida: false };
  const total = meta.alvo - meta.inicial;
  const atingida = meta.menorEhMelhor ? atual <= meta.alvo : atual >= meta.alvo;
  if (total === 0) return { meta, atual, percentual: atingida ? 100 : 0, atingida };
  const feito = (atual - meta.inicial) / total;
  return { meta, atual, percentual: Math.max(0, Math.min(100, Math.round(feito * 100))), atingida };
}

/** Metas de partida sugeridas a partir do primeiro teste (8.4). O Gabriel edita depois; são referência, não promessa. */
export function metasSugeridas(resumos: TesteCampoResumo[], novoId: () => string, hoje: string): Meta[] {
  const primeiro = (tipo: TipoTeste, filtro: (r: TesteCampoResumo) => boolean = () => true) =>
    resumos.filter((r) => r.tipo === tipo && filtro(r)).sort((a, b) => a.data.localeCompare(b.data))[0];
  const prazo = (dias: number) => {
    const d = new Date(`${hoje}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + dias);
    return d.toISOString().slice(0, 10);
  };
  const metas: Meta[] = [];

  const t1 = primeiro("T1");
  if (t1) {
    metas.push({
      id: novoId(),
      chave: "sprint-20m",
      titulo: "Sprint de 20 m mais rápido",
      tipoTeste: "T1",
      inicial: t1.valor,
      alvo: Math.round(t1.valor * 0.96 * 100) / 100,
      unidade: "s",
      menorEhMelhor: true,
      prazo: prazo(56),
    });
  }
  const t2 = primeiro("T2");
  if (t2) {
    metas.push({
      id: novoId(),
      chave: "salto-vertical",
      titulo: "Salto vertical +5%",
      tipoTeste: "T2",
      inicial: t2.valor,
      alvo: Math.round(t2.valor * 1.05 * 10) / 10,
      unidade: "cm",
      menorEhMelhor: false,
      prazo: prazo(56),
    });
  }
  const t3 = primeiro("T3", (r) => r.subtipo === "olhos_fechados");
  if (t3) {
    metas.push({
      id: novoId(),
      chave: "equilibrio-olhos-fechados",
      titulo: "Equilíbrio de 30 s com os olhos fechados, sem falha",
      tipoTeste: "T3",
      subtipo: "olhos_fechados",
      inicial: t3.valor,
      alvo: 30,
      unidade: "s",
      menorEhMelhor: false,
      prazo: prazo(56),
    });
  }
  const sim = simetriaRecente(resumos, "T4");
  if (sim) {
    const fraco = resumos
      .filter((r) => r.tipo === "T4" && r.pe === sim.maisFraco)
      .sort((a, b) => a.data.localeCompare(b.data))[0];
    const forte = Math.max(...resumos.filter((r) => r.tipo === "T4").map((r) => r.valor));
    if (fraco) {
      metas.push({
        id: novoId(),
        chave: "panturrilha-simetria",
        titulo: `Panturrilha: pé ${sim.maisFraco} com 90% do outro`,
        tipoTeste: "T4",
        pe: sim.maisFraco,
        inicial: fraco.valor,
        alvo: Math.ceil(forte * 0.9),
        unidade: "reps",
        menorEhMelhor: false,
        prazo: prazo(56),
      });
    }
  }
  return metas;
}
