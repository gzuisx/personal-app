// Evolução por exercício e comparação de sessões (seção 24.7). Só usa séries realmente registradas.
import { addDias } from "../tempo";
import type { SerieLog } from "../tipos";

export const MIN_SESSOES_GRAFICO = 3;
export const MIN_SESSOES_COMPARAR = 2;
/** Semanas sem melhora para dizer que a carga estagnou. */
export const SEMANAS_DE_PLATO = 4;

export type SessaoDeExercicio = {
  data: string;
  series: number;
  /** maior número de repetições de uma série */
  repsMax: number | null;
  /** soma das repetições */
  repsTotal: number | null;
  cargaMaxKg: number | null;
  duracaoMaxS: number | null;
  /** esforço médio: fácil 1, ok 2, duro 3 */
  esforcoMedio: number | null;
  dorMax: number | null;
  /** séries x reps x kg, quando há carga e repetições */
  volume: number | null;
};

const PESO_ESFORCO: Record<NonNullable<SerieLog["esforco"]>, number> = { facil: 1, ok: 2, duro: 3 };

const max = (v: (number | null | undefined)[]) => {
  const n = v.filter((x): x is number => typeof x === "number");
  return n.length ? Math.max(...n) : null;
};

/** Sessões do exercício, da mais antiga para a mais nova. */
export function sessoesDoExercicio(series: SerieLog[], slug: string): SessaoDeExercicio[] {
  const porData = new Map<string, SerieLog[]>();
  for (const s of series) {
    if (s.exercicio !== slug) continue;
    porData.set(s.data, [...(porData.get(s.data) ?? []), s]);
  }
  return [...porData.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([data, lista]) => {
      const esforcos = lista
        .map((s) => (s.esforco ? PESO_ESFORCO[s.esforco] : null))
        .filter((x): x is number => x !== null);
      const comVolume = lista.filter((s) => s.reps !== null && s.cargaKg !== null);
      return {
        data,
        series: lista.length,
        repsMax: max(lista.map((s) => s.reps)),
        repsTotal: lista.some((s) => s.reps !== null) ? lista.reduce((t, s) => t + (s.reps ?? 0), 0) : null,
        cargaMaxKg: max(lista.map((s) => s.cargaKg)),
        duracaoMaxS: max(lista.map((s) => s.duracaoS)),
        esforcoMedio: esforcos.length ? esforcos.reduce((a, b) => a + b, 0) / esforcos.length : null,
        dorMax: max(lista.map((s) => s.dorDurante)),
        volume: comVolume.length ? comVolume.reduce((t, s) => t + (s.reps ?? 0) * (s.cargaKg ?? 0), 0) : null,
      };
    });
}

export type Recordes = {
  cargaKg: number | null;
  reps: number | null;
  duracaoS: number | null;
  volume: number | null;
};

export function recordes(sessoes: SessaoDeExercicio[]): Recordes {
  return {
    cargaKg: max(sessoes.map((s) => s.cargaMaxKg)),
    reps: max(sessoes.map((s) => s.repsMax)),
    duracaoS: max(sessoes.map((s) => s.duracaoMaxS)),
    volume: max(sessoes.map((s) => s.volume)),
  };
}

export type StatusGrafico = { pode: true } | { pode: false; faltam: number; texto: string };

const plural = (n: number) => (n === 1 ? "1 sessão" : `${n} sessões`);

export function statusDoGrafico(sessoes: SessaoDeExercicio[]): StatusGrafico {
  if (sessoes.length >= MIN_SESSOES_GRAFICO) return { pode: true };
  const faltam = MIN_SESSOES_GRAFICO - sessoes.length;
  return {
    pode: false,
    faltam,
    texto: `Faltam ${plural(faltam)} registradas deste exercício para mostrar o gráfico.`,
  };
}

export function statusDaComparacao(sessoes: SessaoDeExercicio[]): StatusGrafico {
  if (sessoes.length >= MIN_SESSOES_COMPARAR) return { pode: true };
  const faltam = MIN_SESSOES_COMPARAR - sessoes.length;
  return {
    pode: false,
    faltam,
    texto: `Faltam ${plural(faltam)} registradas deste exercício para comparar.`,
  };
}

/** Sugestão de par: a última sessão e a mais próxima de 4 semanas antes. */
export function parSugerido(sessoes: SessaoDeExercicio[]): [SessaoDeExercicio, SessaoDeExercicio] | null {
  if (sessoes.length < MIN_SESSOES_COMPARAR) return null;
  const ultima = sessoes[sessoes.length - 1];
  const alvo = addDias(ultima.data, -28);
  const anteriores = sessoes.slice(0, -1);
  const antiga = anteriores.reduce((melhor, s) => {
    const d = Math.abs(Date.parse(s.data) - Date.parse(alvo));
    const dm = Math.abs(Date.parse(melhor.data) - Date.parse(alvo));
    return d < dm ? s : melhor;
  });
  return [antiga, ultima];
}

const fmt = (n: number) => String(n).replace(".", ",");

/** Frase objetiva gerada por regra, só com o que foi registrado (24.7b). */
export function fraseDaComparacao(antes: SessaoDeExercicio, depois: SessaoDeExercicio): string {
  const partes: string[] = [];

  if (antes.cargaMaxKg !== null && depois.cargaMaxKg !== null) {
    if (depois.cargaMaxKg > antes.cargaMaxKg)
      partes.push(`Carga maior (${fmt(antes.cargaMaxKg)} → ${fmt(depois.cargaMaxKg)} kg)`);
    else if (depois.cargaMaxKg < antes.cargaMaxKg)
      partes.push(`Carga menor (${fmt(antes.cargaMaxKg)} → ${fmt(depois.cargaMaxKg)} kg)`);
  }
  if (antes.repsMax !== null && depois.repsMax !== null) {
    if (depois.repsMax === antes.repsMax) partes.push("mesmas repetições");
    else if (depois.repsMax > antes.repsMax)
      partes.push(`mais repetições (${antes.repsMax} → ${depois.repsMax})`);
    else partes.push(`menos repetições (${antes.repsMax} → ${depois.repsMax})`);
  } else if (antes.duracaoMaxS !== null && depois.duracaoMaxS !== null) {
    if (depois.duracaoMaxS === antes.duracaoMaxS) partes.push("mesmo tempo");
    else
      partes.push(
        `tempo ${depois.duracaoMaxS > antes.duracaoMaxS ? "maior" : "menor"} (${antes.duracaoMaxS} → ${depois.duracaoMaxS} s)`,
      );
  }
  if (antes.esforcoMedio !== null && depois.esforcoMedio !== null) {
    const d = depois.esforcoMedio - antes.esforcoMedio;
    if (Math.abs(d) < 0.25) partes.push("esforço parecido");
    else partes.push(`esforço ${d < 0 ? "menor" : "maior"}`);
  }
  if (depois.dorMax !== null && antes.dorMax !== null && depois.dorMax !== antes.dorMax) {
    partes.push(
      `dor durante o exercício ${depois.dorMax > antes.dorMax ? "maior" : "menor"} (${antes.dorMax} → ${depois.dorMax})`,
    );
  }

  if (!partes.length) return "Sem carga, repetições ou esforço registrados para comparar.";
  const frase = partes.join(", ");
  return `${frase.charAt(0).toUpperCase()}${frase.slice(1)}.`;
}

/** Carga parada há `SEMANAS_DE_PLATO` semanas ou mais (sem subir), com pelo menos 3 sessões. */
export function emPlato(sessoes: SessaoDeExercicio[], hoje: string): boolean {
  const comCarga = sessoes.filter((s) => s.cargaMaxKg !== null);
  if (comCarga.length < 3) return false;
  const limite = addDias(hoje, -7 * SEMANAS_DE_PLATO);
  const recentes = comCarga.filter((s) => s.data >= limite);
  const anteriores = comCarga.filter((s) => s.data < limite);
  if (recentes.length < 2 || !anteriores.length) return false;
  const base = Math.max(...anteriores.map((s) => s.cargaMaxKg!));
  return Math.max(...recentes.map((s) => s.cargaMaxKg!)) <= base;
}

/** Exercícios com pelo menos uma série registrada, do mais treinado para o menos. */
export function exerciciosRegistrados(series: SerieLog[]): { slug: string; sessoes: number }[] {
  const datas = new Map<string, Set<string>>();
  for (const s of series) {
    const set = datas.get(s.exercicio) ?? new Set<string>();
    set.add(s.data);
    datas.set(s.exercicio, set);
  }
  return [...datas.entries()]
    .map(([slug, set]) => ({ slug, sessoes: set.size }))
    .sort((a, b) => b.sessoes - a.sessoes || a.slug.localeCompare(b.slug));
}
