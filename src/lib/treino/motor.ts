// Motor do treino guiado (seção 5 e 24.2): máquina de estados pura, serializável e testada.
// A tela só mostra o estado e chama estas funções; tudo que precisa persistir está em EstadoTreino.
import { CATALOGO_POR_ID, exigeAcademia, usaCargaExterna, type ItemCatalogo } from "../seed/catalogo";
import type { Bloco, ExercicioNoBloco } from "../seed/plano";

export type Ajuste = "completo" | "reduzido" | "20min" | "sem_academia" | "recuperacao";

export const AJUSTES: { valor: Ajuste; rotulo: string; descricao: string }[] = [
  { valor: "completo", rotulo: "Completo", descricao: "O treino do plano, como está." },
  {
    valor: "reduzido",
    rotulo: "Reduzido",
    descricao: "Uma série a menos em cada exercício e sem o último acessório.",
  },
  { valor: "20min", rotulo: "Só 20 min", descricao: "O essencial do plano, cabendo em cerca de 20 minutos." },
  {
    valor: "sem_academia",
    rotulo: "Sem academia",
    descricao: "Troca o que precisa de academia por algo sem equipamento.",
  },
  {
    valor: "recuperacao",
    rotulo: "Recuperação",
    descricao: "Só mobilidade, tornozelo leve e core, sem impacto.",
  },
];

// ---------------------------------------------------------------- alvo (série x repetições)

export type Alvo =
  | { kind: "reps"; min: number; max: number; porPerna: boolean }
  | { kind: "tempo"; segundos: number; porPerna: boolean }
  | { kind: "livre"; texto: string };

/** Lê textos do plano como "8", "6 a 8", "12 a 15", "30 s", "30 a 45 s", "8 por perna", "15 min". */
export function parseAlvo(texto: string): Alvo {
  const t = texto.trim().toLowerCase();
  const porPerna = /perna|lado|pé/.test(t);
  // unidades que não são repetições (distância, voltas, giros...): texto livre
  if (/(arrancada|volta|recep|giro|passos|corrida|\d+\s*m\b)/.test(t)) return { kind: "livre", texto };
  const min = t.match(/(\d+)\s*min\b/);
  if (min) return { kind: "tempo", segundos: Number(min[1]) * 60, porPerna };
  const seg = t.match(/(\d+)(?:\s*a\s*(\d+))?\s*s\b/);
  if (seg) return { kind: "tempo", segundos: Number(seg[1]), porPerna };
  const reps = t.match(/^(\d+)(?:\s*a\s*(\d+))?/);
  if (reps) {
    const x = Number(reps[1]);
    const y = reps[2] ? Number(reps[2]) : x;
    return { kind: "reps", min: Math.min(x, y), max: Math.max(x, y), porPerna };
  }
  return { kind: "livre", texto };
}

export const rotuloAlvo = (a: Alvo) =>
  a.kind === "reps"
    ? `${a.min === a.max ? a.min : `${a.min} a ${a.max}`}${a.porPerna ? " por perna" : ""} repetições`
    : a.kind === "tempo"
      ? a.segundos >= 120
        ? `${Math.round(a.segundos / 60)} min`
        : `${a.segundos} s${a.porPerna ? " em cada perna" : ""}`
      : a.texto;

// ---------------------------------------------------------------- itens e estado

export type EsforcoSerie = "facil" | "ok" | "duro";

export type Item = {
  slug: string;
  nome: string;
  tipo: string;
  blocoIdx: number;
  series: number;
  alvo: Alvo;
  descansoS: number;
  usaCarga: boolean;
  passoCarga: 1 | 2.5;
  observacao?: string;
  comoFazer: string[];
  cuidado: string;
  regressao?: string;
  trocadoDe?: string;
};

export type SerieFeita = {
  /** índice do item no treino */
  item: number;
  slug: string;
  bloco: string;
  /** número da série, a partir de 1 */
  numero: number;
  reps: number | null;
  cargaKg: number | null;
  duracaoS: number | null;
  esforco: EsforcoSerie | null;
  dorDurante: number | null;
  /** epoch ms */
  em: number;
};

export type Fase = "executando" | "descanso" | "pronto" | "transicao" | "resumo";

export type BlocoTreino = { id: string; titulo: string; duracaoMin: number; tags: string[] };

export type Valores = {
  reps: number | null;
  cargaKg: number | null;
  duracaoS: number | null;
  esforco: EsforcoSerie | null;
};

export type SugeridoSerie = { reps: number | null; cargaKg: number | null; duracaoS: number | null };

export type EstadoTreino = {
  id: string;
  /** AAAA-MM-DD */
  data: string;
  ajuste: Ajuste;
  /** true quando vários blocos do dia foram encadeados (Sequência do dia) */
  sequencia: boolean;
  blocos: BlocoTreino[];
  itens: Item[];
  feitas: SerieFeita[];
  pulados: { item: number; motivo: string }[];
  blocosPulados: number[];
  idxItem: number;
  /** série atual, a partir de 0 */
  idxSerie: number;
  fase: Fase;
  /** epoch ms em que o descanso termina */
  descansoFimEm: number | null;
  /** valores sugeridos (última sessão) por exercício, uma entrada por série */
  sugeridos: Record<string, SugeridoSerie[]>;
  atual: Valores;
  dorPendente: number | null;
  iniciadoEm: number;
  encerradoPorDor: boolean;
  /** avisos do ajuste (o que foi cortado ou trocado), mostrados antes de começar */
  avisosAjuste: string[];
};

const DEFAULT_ITEM_CAT = (e: ExercicioNoBloco): ItemCatalogo | null => CATALOGO_POR_ID[e.slug] ?? null;

/** Tempos padrão de descanso (5.4): força 90 s, tornozelo e isometria 45 s, velocidade 120 s. */
function descansoDoCatalogo(c: ItemCatalogo) {
  return c.tipo === "tornozelo" ? 45 : c.descansoS;
}

function descansoPadrao(tipo: string) {
  if (tipo === "velocidade") return 120;
  if (tipo === "forca") return 90;
  return 45;
}

// ---------------------------------------------------------------- montagem do treino

function itemDoExercicio(e: ExercicioNoBloco, blocoIdx: number): Item {
  const cat = DEFAULT_ITEM_CAT(e);
  const alvo = parseAlvo(e.repeticoes);
  let series = e.series ? Number(e.series) : (cat?.series ?? 1);
  // arrancadas: uma "série" por arrancada (6 a 8 no plano; usamos 6)
  if (e.slug === "vel-arrancadas") series = 6;
  if (!Number.isFinite(series) || series < 1) series = 1;
  const usaCarga = cat ? usaCargaExterna(cat) : false;
  return {
    slug: e.slug,
    nome: e.nome,
    tipo: cat?.tipo ?? e.tipo,
    blocoIdx,
    series,
    alvo: e.slug === "vel-arrancadas" ? { kind: "livre", texto: "Arrancada de 10 a 20 m" } : alvo,
    descansoS: cat ? descansoDoCatalogo(cat) : descansoPadrao(e.tipo),
    usaCarga,
    passoCarga: usaCarga && /stiff|supino|remada|hip|goblet|puxada|desenvolvimento/.test(e.slug) ? 2.5 : 1,
    observacao: e.observacao ?? e.observacoes,
    comoFazer: cat?.comoFazer ? [...cat.comoFazer] : [],
    cuidado: cat?.cuidado ?? "Pare se a dor passar de 3 em 10.",
    regressao: cat?.regressao,
  };
}

/** Tempo estimado de um item, em segundos (execução ~40 s por série + descansos). */
export function tempoDoItem(i: Item) {
  const exec = i.alvo.kind === "tempo" ? i.alvo.segundos * (i.alvo.porPerna ? 2 : 1) : 40;
  return i.series * exec + Math.max(0, i.series - 1) * i.descansoS;
}

function trocarPorSemAcademia(i: Item): Item | null {
  const cat = CATALOGO_POR_ID[i.slug];
  if (!cat || !exigeAcademia(cat)) return i;
  for (const altId of cat.alternativas) {
    const alt = CATALOGO_POR_ID[altId];
    if (alt && !exigeAcademia(alt)) {
      return {
        ...i,
        slug: alt.id,
        nome: alt.nome,
        tipo: alt.tipo,
        alvo: parseAlvo(alt.reps),
        descansoS: descansoDoCatalogo(alt),
        usaCarga: usaCargaExterna(alt),
        comoFazer: [...alt.comoFazer],
        cuidado: alt.cuidado,
        regressao: alt.regressao,
        trocadoDe: i.slug,
      };
    }
  }
  return null;
}

function aplicarAjuste(itens: Item[], blocos: Bloco[], ajuste: Ajuste): { itens: Item[]; avisos: string[] } {
  const avisos: string[] = [];
  let r = itens;

  if (ajuste === "sem_academia") {
    r = [];
    for (const i of itens) {
      const novo = trocarPorSemAcademia(i);
      if (!novo) avisos.push(`Tirei "${i.nome}": precisa de academia e não achei troca sem equipamento.`);
      else {
        if (novo.trocadoDe) {
          const original = CATALOGO_POR_ID[novo.trocadoDe]?.nome ?? novo.trocadoDe;
          avisos.push(`Troquei "${original}" por "${novo.nome}" (sem academia).`);
        }
        r.push(novo);
      }
    }
  }

  if (ajuste === "reduzido") {
    r = r.map((i) => (i.series > 1 ? { ...i, series: i.series - 1 } : i));
    avisos.push("Uma série a menos em cada exercício.");
    // sem o último acessório de cada bloco de força com mais de 3 exercícios
    const remover = new Set<number>();
    blocos.forEach((b, bi) => {
      const doBloco = r.map((i, idx) => ({ i, idx })).filter((x) => x.i.blocoIdx === bi);
      if (b.tags.includes("Força") && doBloco.length > 3) remover.add(doBloco[doBloco.length - 1].idx);
    });
    if (remover.size) {
      avisos.push("Tirei o último exercício acessório.");
      r = r.filter((_, idx) => !remover.has(idx));
    }
  }

  if (ajuste === "recuperacao") {
    const antes = r.length;
    r = r
      .filter((i) => {
        const c = CATALOGO_POR_ID[i.slug];
        return (
          !!c && c.impacto === "baixo" && c.nivel <= 3 && ["tornozelo", "mobilidade", "core"].includes(c.tipo)
        );
      })
      .map((i) => ({ ...i, series: Math.min(i.series, 2) }));
    if (r.length < antes) avisos.push("Ficaram só exercícios leves e sem impacto, em no máximo 2 séries.");
  }

  if (ajuste === "20min") {
    const limite = 20 * 60;
    let soma = 0;
    const mantidos: Item[] = [];
    for (const i of r) {
      const t = tempoDoItem(i);
      if (mantidos.length > 0 && soma + t > limite) continue;
      mantidos.push(i);
      soma += t;
    }
    if (mantidos.length < r.length)
      avisos.push(`Ficou só o essencial (cerca de ${Math.round(soma / 60)} min).`);
    r = mantidos;
  }

  return { itens: r, avisos };
}

export function criarTreino(entrada: {
  id: string;
  data: string;
  blocos: Bloco[];
  ajuste?: Ajuste;
  sequencia?: boolean;
  agora: number;
  sugeridos?: Record<string, SugeridoSerie[]>;
}): EstadoTreino | null {
  const ajuste = entrada.ajuste ?? "completo";
  const blocosComExercicios = entrada.blocos.filter((b) => b.exercicios.length > 0);
  if (!blocosComExercicios.length) return null;

  const todos: Item[] = blocosComExercicios.flatMap((b, bi) =>
    b.exercicios.map((e) => itemDoExercicio(e, bi)),
  );
  const { itens, avisos } = aplicarAjuste(todos, blocosComExercicios, ajuste);
  if (!itens.length) return null;

  // remove blocos que ficaram sem exercício e reindexa
  const usados = [...new Set(itens.map((i) => i.blocoIdx))].sort((a, b) => a - b);
  const mapa = new Map(usados.map((bi, novo) => [bi, novo]));
  const blocos: BlocoTreino[] = usados.map((bi) => {
    const b = blocosComExercicios[bi];
    return { id: b.id, titulo: b.titulo, duracaoMin: b.duracaoMin, tags: [...b.tags] };
  });
  const reindexados = itens.map((i) => ({ ...i, blocoIdx: mapa.get(i.blocoIdx)! }));

  const estado: EstadoTreino = {
    id: entrada.id,
    data: entrada.data,
    ajuste,
    sequencia: !!entrada.sequencia && blocos.length > 1,
    blocos,
    itens: reindexados,
    feitas: [],
    pulados: [],
    blocosPulados: [],
    idxItem: 0,
    idxSerie: 0,
    fase: "executando",
    descansoFimEm: null,
    sugeridos: entrada.sugeridos ?? {},
    atual: { reps: null, cargaKg: null, duracaoS: null, esforco: null },
    dorPendente: null,
    iniciadoEm: entrada.agora,
    encerradoPorDor: false,
    avisosAjuste: avisos,
  };
  return { ...estado, atual: valoresIniciais(estado) };
}

// ---------------------------------------------------------------- valores iniciais (última sessão)

export function valoresIniciais(
  e: Pick<EstadoTreino, "itens" | "idxItem" | "idxSerie" | "sugeridos">,
): Valores {
  const item = e.itens[e.idxItem];
  if (!item) return { reps: null, cargaKg: null, duracaoS: null, esforco: null };
  const lista = e.sugeridos[item.slug] ?? [];
  const sug = lista[e.idxSerie] ?? lista[lista.length - 1];
  const alvo = item.alvo;
  const repsPadrao = alvo.kind === "reps" ? alvo.max : null;
  const tempoPadrao = alvo.kind === "tempo" ? alvo.segundos : null;
  return {
    reps: sug?.reps ?? repsPadrao,
    cargaKg: item.usaCarga ? (sug?.cargaKg ?? null) : null,
    duracaoS: alvo.kind === "tempo" ? (sug?.duracaoS ?? tempoPadrao) : null,
    esforco: null,
  };
}

// ---------------------------------------------------------------- navegação

const temProximaSerie = (e: EstadoTreino) => e.idxSerie + 1 < e.itens[e.idxItem].series;
const temProximoItem = (e: EstadoTreino) => e.idxItem + 1 < e.itens.length;
const ultimoDeTodos = (e: EstadoTreino) => !temProximaSerie(e) && !temProximoItem(e);

export type BotaoPrincipal = {
  acao:
    | "concluir"
    | "descansando"
    | "proxima_serie"
    | "proximo_exercicio"
    | "finalizar"
    | "iniciar_bloco"
    | "resumo";
  rotulo: string;
  desabilitado: boolean;
};

/** O único botão principal da tela (24.2): concluir série, descansar, próxima série, próximo exercício, finalizar. */
export function botaoPrincipal(e: EstadoTreino): BotaoPrincipal {
  switch (e.fase) {
    case "executando":
      return { acao: "concluir", rotulo: "Concluir série", desabilitado: false };
    case "descanso":
      return { acao: "descansando", rotulo: "Descansar", desabilitado: true };
    case "pronto":
      if (temProximaSerie(e)) return { acao: "proxima_serie", rotulo: "Próxima série", desabilitado: false };
      if (temProximoItem(e)) {
        const mudaBloco = e.itens[e.idxItem + 1].blocoIdx !== e.itens[e.idxItem].blocoIdx;
        return mudaBloco && e.sequencia
          ? { acao: "proximo_exercicio", rotulo: "Próximo bloco", desabilitado: false }
          : { acao: "proximo_exercicio", rotulo: "Próximo exercício", desabilitado: false };
      }
      return { acao: "finalizar", rotulo: "Finalizar treino", desabilitado: false };
    case "transicao":
      return { acao: "iniciar_bloco", rotulo: "Começar bloco", desabilitado: false };
    case "resumo":
      return { acao: "resumo", rotulo: "Ver resumo", desabilitado: false };
  }
}

export function atualizarValores(e: EstadoTreino, patch: Partial<Valores>): EstadoTreino {
  return { ...e, atual: { ...e.atual, ...patch } };
}

export function concluirSerie(e: EstadoTreino, agora: number): { estado: EstadoTreino; serie: SerieFeita } {
  const item = e.itens[e.idxItem];
  const serie: SerieFeita = {
    item: e.idxItem,
    slug: item.slug,
    bloco: e.blocos[item.blocoIdx].id,
    numero: e.idxSerie + 1,
    reps: e.atual.reps,
    cargaKg: e.atual.cargaKg,
    duracaoS: e.atual.duracaoS,
    esforco: e.atual.esforco,
    dorDurante: e.dorPendente,
    em: agora,
  };
  const feitas = [...e.feitas.filter((s) => !(s.item === serie.item && s.numero === serie.numero)), serie];
  const base = { ...e, feitas, dorPendente: null };

  // última série de todo o treino: vai direto para "Finalizar"
  if (ultimoDeTodos(base)) return { estado: { ...base, fase: "pronto", descansoFimEm: null }, serie };

  // se o descanso é zero (ex.: aquecimento) vai direto para "pronto"
  if (item.descansoS <= 0) return { estado: { ...base, fase: "pronto", descansoFimEm: null }, serie };

  return { estado: { ...base, fase: "descanso", descansoFimEm: agora + item.descansoS * 1000 }, serie };
}

export function segundosDeDescanso(e: EstadoTreino, agora: number) {
  if (e.fase !== "descanso" || e.descansoFimEm === null) return 0;
  return Math.max(0, Math.ceil((e.descansoFimEm - agora) / 1000));
}

export function ajustarDescanso(e: EstadoTreino, deltaS: number, agora: number): EstadoTreino {
  if (e.fase !== "descanso" || e.descansoFimEm === null) return e;
  const novo = Math.max(agora, e.descansoFimEm + deltaS * 1000);
  return { ...e, descansoFimEm: novo };
}

export function terminarDescanso(e: EstadoTreino): EstadoTreino {
  if (e.fase !== "descanso") return e;
  return { ...e, fase: "pronto", descansoFimEm: null };
}

/** Passa para a próxima série, o próximo exercício, a transição de bloco ou o resumo. */
export function avancar(e: EstadoTreino): EstadoTreino {
  if (e.fase !== "pronto") return e;
  if (temProximaSerie(e)) {
    const n = { ...e, idxSerie: e.idxSerie + 1, fase: "executando" as Fase, descansoFimEm: null };
    return { ...n, atual: valoresIniciais(n) };
  }
  return irParaProximoItem(e);
}

function irParaProximoItem(e: EstadoTreino): EstadoTreino {
  if (!temProximoItem(e)) return { ...e, fase: "resumo", descansoFimEm: null };
  const proximo = e.itens[e.idxItem + 1];
  const atual = e.itens[e.idxItem];
  if (e.sequencia && proximo.blocoIdx !== atual.blocoIdx) {
    return { ...e, fase: "transicao", descansoFimEm: null };
  }
  const n = { ...e, idxItem: e.idxItem + 1, idxSerie: 0, fase: "executando" as Fase, descansoFimEm: null };
  return { ...n, atual: valoresIniciais(n) };
}

/** Sai da tela de transição e começa o próximo bloco. */
export function iniciarProximoBloco(e: EstadoTreino): EstadoTreino {
  if (e.fase !== "transicao") return e;
  const n = { ...e, idxItem: e.idxItem + 1, idxSerie: 0, fase: "executando" as Fase };
  return { ...n, atual: valoresIniciais(n) };
}

/** Pula o próximo bloco inteiro (botão "Pular bloco" na transição). */
export function pularProximoBloco(e: EstadoTreino): EstadoTreino {
  if (e.fase !== "transicao") return e;
  const proximoBloco = e.itens[e.idxItem + 1].blocoIdx;
  const ultimoDoBloco = e.itens.reduce(
    (acc, it, idx) => (it.blocoIdx === proximoBloco ? idx : acc),
    e.idxItem + 1,
  );
  const pulados = [
    ...e.pulados,
    ...e.itens
      .map((it, idx) => ({ it, idx }))
      .filter((x) => x.it.blocoIdx === proximoBloco)
      .map((x) => ({ item: x.idx, motivo: "bloco pulado" })),
  ];
  const base = {
    ...e,
    idxItem: ultimoDoBloco,
    idxSerie: 0,
    blocosPulados: [...e.blocosPulados, proximoBloco],
    pulados,
    fase: "pronto" as Fase,
  };
  return irParaProximoItem(base);
}

export function pularExercicio(e: EstadoTreino, motivo: string): EstadoTreino {
  if (e.fase === "resumo") return e;
  const base = { ...e, pulados: [...e.pulados, { item: e.idxItem, motivo }], dorPendente: null };
  return irParaProximoItem({ ...base, fase: "pronto" });
}

export function trocarExercicio(e: EstadoTreino, slug: string): EstadoTreino {
  const cat = CATALOGO_POR_ID[slug];
  if (!cat || e.fase === "resumo") return e;
  const antigo = e.itens[e.idxItem];
  const novo: Item = {
    ...antigo,
    slug: cat.id,
    nome: cat.nome,
    tipo: cat.tipo,
    alvo: parseAlvo(cat.reps),
    descansoS: descansoDoCatalogo(cat),
    usaCarga: usaCargaExterna(cat),
    passoCarga: 1,
    observacao: undefined,
    comoFazer: [...cat.comoFazer],
    cuidado: cat.cuidado,
    regressao: cat.regressao,
    trocadoDe: antigo.trocadoDe ?? antigo.slug,
  };
  const itens = e.itens.map((i, idx) => (idx === e.idxItem ? novo : i));
  const feitas = e.feitas.filter((s) => s.item !== e.idxItem);
  const n = {
    ...e,
    itens,
    feitas,
    idxSerie: 0,
    fase: "executando" as Fase,
    descansoFimEm: null,
    dorPendente: null,
  };
  return { ...n, atual: valoresIniciais(n) };
}

// ---------------------------------------------------------------- dor durante o exercício (R11)

export type AvisoDor = {
  nivel: "ok" | "regredir" | "encerrar";
  mensagem: string;
  /** exercício mais leve sugerido, quando houver */
  regressao: string | null;
};

/** R11: dor > 3 pede parar o exercício e sugerir regressão; dor >= 6 encerra o treino e abre o check-in. */
export function registrarDor(e: EstadoTreino, dor: number): { estado: EstadoTreino; aviso: AvisoDor } {
  const item = e.itens[e.idxItem];
  const base = { ...e, dorPendente: dor };
  if (dor >= 6) {
    return {
      estado: { ...base, fase: "resumo", encerradoPorDor: true, descansoFimEm: null },
      aviso: {
        nivel: "encerrar",
        mensagem:
          "Dor forte. Encerre o treino de hoje e faça o check-in. Se o tornozelo falhar, inchar ou não apoiar, procure ortopedista ou fisioterapeuta.",
        regressao: null,
      },
    };
  }
  if (dor > 3) {
    return {
      estado: base,
      aviso: {
        nivel: "regredir",
        mensagem: "Pare este exercício. Troque por uma versão mais leve ou pule.",
        regressao: item.regressao ?? null,
      },
    };
  }
  return {
    estado: base,
    aviso: {
      nivel: "ok",
      mensagem: "Dor leve registrada. Siga com cuidado e pare se passar de 3.",
      regressao: null,
    },
  };
}

// ---------------------------------------------------------------- resumo

export type ResultadoBloco = "feito" | "parcial" | "nao_fiz";

export type ResumoTreino = {
  duracaoMin: number;
  seriesFeitas: number;
  seriesPlanejadas: number;
  volumeKg: number;
  maioresCargas: { slug: string; nome: string; cargaKg: number }[];
  blocos: {
    id: string;
    titulo: string;
    resultado: ResultadoBloco;
    feitas: number;
    planejadas: number;
    duracaoMin: number;
  }[];
  encerradoPorDor: boolean;
};

export function resumoDoTreino(e: EstadoTreino, agora: number): ResumoTreino {
  const planejadas = (blocoIdx: number) =>
    e.itens
      .map((i, idx) => ({ i, idx }))
      .filter((x) => x.i.blocoIdx === blocoIdx && !e.pulados.some((p) => p.item === x.idx))
      .reduce((s, x) => s + x.i.series, 0);

  const blocos = e.blocos.map((b, bi) => {
    const feitas = e.feitas.filter((s) => e.itens[s.item]?.blocoIdx === bi).length;
    const planejado = e.itens.filter((i) => i.blocoIdx === bi).reduce((s, i) => s + i.series, 0);
    const resultado: ResultadoBloco =
      feitas === 0
        ? "nao_fiz"
        : feitas >= planejado && !e.pulados.some((p) => e.itens[p.item]?.blocoIdx === bi)
          ? "feito"
          : "parcial";
    const duracaoMin = feitas > 0 ? b.duracaoMin : 0;
    return {
      id: b.id,
      titulo: b.titulo,
      resultado,
      feitas,
      planejadas: planejadas(bi) || planejado,
      duracaoMin,
    };
  });

  const maiores = new Map<string, { slug: string; nome: string; cargaKg: number }>();
  for (const s of e.feitas) {
    if (s.cargaKg === null || s.cargaKg <= 0) continue;
    const atual = maiores.get(s.slug);
    if (!atual || s.cargaKg > atual.cargaKg)
      maiores.set(s.slug, { slug: s.slug, nome: e.itens[s.item]?.nome ?? s.slug, cargaKg: s.cargaKg });
  }

  return {
    duracaoMin: Math.max(1, Math.round((agora - e.iniciadoEm) / 60000)),
    seriesFeitas: e.feitas.length,
    seriesPlanejadas: e.itens.reduce(
      (s, i, idx) => s + (e.pulados.some((p) => p.item === idx) ? 0 : i.series),
      0,
    ),
    volumeKg: Math.round(e.feitas.reduce((s, x) => s + (x.reps ?? 0) * (x.cargaKg ?? 0), 0)),
    maioresCargas: [...maiores.values()].sort((a, b) => b.cargaKg - a.cargaKg),
    blocos,
    encerradoPorDor: e.encerradoPorDor,
  };
}

/** Progresso para a barra do topo: exercício n de m e série n de m. */
export function progresso(e: EstadoTreino) {
  const ativos = e.itens.map((_, idx) => idx).filter((idx) => !e.pulados.some((p) => p.item === idx));
  const posicao = Math.max(1, ativos.filter((idx) => idx <= e.idxItem).length);
  const item = e.itens[Math.min(e.idxItem, e.itens.length - 1)];
  return {
    exercicio: posicao,
    totalExercicios: ativos.length,
    serie: Math.min(e.idxSerie + 1, item.series),
    totalSeries: item.series,
    fracao: e.itens.length ? Math.min(1, e.feitas.length / e.itens.reduce((s, i) => s + i.series, 0)) : 0,
  };
}

export function itemAtual(e: EstadoTreino): Item {
  return e.itens[Math.min(e.idxItem, e.itens.length - 1)];
}

/** Série atual é a primeira do exercício e o ajuste do modo do dia trocou o exercício? */
export const foiTrocado = (i: Item) => !!i.trocadoDe;
