// Demonstrações animadas ("boneco de nós", fase 1). Cada exercício do catálogo tem a sua própria
// demonstração ou usa o modelo da categoria. Sem 3D, sem vídeo e sem IA.
import { CATALOGO_POR_ID, type TipoCatalogo } from "../seed/catalogo";
import { DETALHES } from "../seed/catalogo-detalhes";
import { MODELOS_POR_SLUG } from "./modelos";
import { DEMOS } from "./poses";
import type { Demo } from "./tipos";

export type { Demo, Prop } from "./tipos";
export { DURACAO_DEMO_S } from "./cena";

export const DEMO_POR_ID: Record<string, Demo> = Object.fromEntries(DEMOS.map((d) => [d.id, d]));

/** Modelo usado por categoria quando não há pose própria nem modelo específico. */
export const MODELO_DA_CATEGORIA: Record<TipoCatalogo, string> = {
  tornozelo: "eq-um-pe",
  forca: "agachamento-goblet",
  velocidade: "skipping",
  potencia: "salto-vertical",
  mobilidade: "joelho-parede",
  core: "prancha",
  bola: "conducao-slalom",
  visao: "scan",
};

export type InfoDemonstracao = {
  demo: Demo;
  /** true quando usa a demonstração de outro exercício (modelo da categoria) */
  modelo: boolean;
  /** slug cuja pose foi usada */
  origem: string;
};

/** Demonstração de um exercício: própria, modelo específico ou modelo da categoria. */
export function demonstracaoDe(slug: string): InfoDemonstracao {
  const propria = DEMO_POR_ID[slug];
  const detalhe = DETALHES[slug];
  const comDestaque = (d: Demo): Demo => (detalhe ? { ...d, destaque: detalhe.regioes } : d);
  if (propria) return { demo: propria, modelo: false, origem: slug };
  const especifico = MODELOS_POR_SLUG[slug];
  const cat = CATALOGO_POR_ID[slug];
  const origem =
    (especifico && DEMO_POR_ID[especifico] ? especifico : null) ??
    (cat ? MODELO_DA_CATEGORIA[cat.tipo] : null) ??
    "eq-um-pe";
  const base = DEMO_POR_ID[origem] ?? DEMOS[0];
  return { demo: comDestaque({ ...base, id: `modelo:${origem}` }), modelo: true, origem };
}
