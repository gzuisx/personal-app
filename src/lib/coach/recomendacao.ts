// Recomendador de exercícios (seções 7.2, 7.4 e 7.5): sugere itens do catálogo para a semana.
// Só sugere; entrar no plano depende do Gabriel tocar em Adicionar.
import { CATALOGO, type ItemCatalogo, type TipoCatalogo } from "../seed/catalogo";
import { addDias } from "../tempo";
import type { FaseNum, SerieLog } from "../tipos";
import type { ModoDia } from "./tipos";

export type FocoRecomendacao = "tornozelo" | "forca" | "velocidade" | "mobilidade" | "core";

export const ROTULO_FOCO: Record<FocoRecomendacao, string> = {
  tornozelo: "Tornozelo",
  forca: "Força",
  velocidade: "Velocidade",
  mobilidade: "Mobilidade",
  core: "Core",
};

/** Séries por semana que o plano espera de cada tipo (referência para achar lacunas de volume, 7.5). */
export const VOLUME_ALVO_SEMANAL: Partial<Record<TipoCatalogo, number>> = {
  tornozelo: 15,
  forca: 14,
  core: 6,
  mobilidade: 6,
  velocidade: 4,
  potencia: 4,
};

export type Sugestao = {
  slug: string;
  nome: string;
  grupo: string;
  tipo: TipoCatalogo;
  motivo: string;
};

type Entrada = {
  hoje: string;
  fase: FaseNum;
  modo: ModoDia;
  semPliometria: boolean;
  semVelocidade: boolean;
  dorHoje: number | null;
  series: SerieLog[];
  foco?: FocoRecomendacao | null;
  /** exercícios que o usuário já tem no plano deste período (não repetir) */
  jaNoPlano?: string[];
  limite?: number;
};

const TIPOS_DO_FOCO: Record<FocoRecomendacao, TipoCatalogo[]> = {
  tornozelo: ["tornozelo"],
  forca: ["forca"],
  velocidade: ["velocidade", "potencia"],
  mobilidade: ["mobilidade"],
  core: ["core"],
};

/** Séries feitas nos últimos 7 dias, por tipo do catálogo. */
export function volumeDaSemana(series: SerieLog[], hoje: string): Partial<Record<TipoCatalogo, number>> {
  const desde = addDias(hoje, -6);
  const porTipo: Partial<Record<TipoCatalogo, number>> = {};
  for (const s of series) {
    if (s.data < desde || s.data > hoje) continue;
    const c = CATALOGO.find((x) => x.id === s.exercicio);
    if (!c) continue;
    porTipo[c.tipo] = (porTipo[c.tipo] ?? 0) + 1;
  }
  return porTipo;
}

/** Itens que podem entrar hoje sem ferir a segurança (fase, impacto, velocidade, modo). */
export function permitido(
  c: ItemCatalogo,
  e: Pick<Entrada, "fase" | "modo" | "semPliometria" | "semVelocidade" | "dorHoje">,
) {
  if (c.faseMinima > e.fase) return false;
  if ((e.dorHoje ?? 0) >= 4 && c.impacto !== "baixo") return false;
  if (e.semPliometria && c.impacto === "alto") return false;
  if (e.semVelocidade && (c.tipo === "velocidade" || c.tipo === "potencia")) return false;
  if (e.modo === "recuperacao" || e.modo === "folga") {
    return c.impacto === "baixo" && c.nivel <= 3 && ["tornozelo", "mobilidade", "core"].includes(c.tipo);
  }
  if (e.modo === "reduzido" && c.impacto === "alto") return false;
  return true;
}

export function recomendar(e: Entrada): Sugestao[] {
  const volume = volumeDaSemana(e.series, e.hoje);
  const recentes = new Set(e.series.filter((s) => s.data >= addDias(e.hoje, -1)).map((s) => s.exercicio));
  const noPlano = new Set(e.jaNoPlano ?? []);
  const tiposDoFoco = e.foco ? TIPOS_DO_FOCO[e.foco] : null;

  const pontuados = CATALOGO.filter((c) => permitido(c, e) && !noPlano.has(c.id) && !recentes.has(c.id))
    .filter((c) => !tiposDoFoco || tiposDoFoco.includes(c.tipo))
    .map((c) => {
      const alvo = VOLUME_ALVO_SEMANAL[c.tipo] ?? 0;
      const feito = volume[c.tipo] ?? 0;
      const falta = Math.max(0, alvo - feito);
      // prefere itens do nível da fase (nem fáceis demais, nem difíceis demais)
      const nivelIdeal = Math.min(5, e.fase + 1);
      const ajuste = 1 - Math.min(1, Math.abs(c.nivel - nivelIdeal) / 4);
      return { c, falta, pontos: falta + ajuste * 2 };
    })
    .sort((a, b) => b.pontos - a.pontos || a.c.nome.localeCompare(b.c.nome));

  const porGrupo = new Map<string, number>();
  const saida: Sugestao[] = [];
  for (const { c, falta } of pontuados) {
    // no máximo 2 do mesmo grupo para variar
    const n = porGrupo.get(c.grupo) ?? 0;
    if (n >= 2) continue;
    porGrupo.set(c.grupo, n + 1);
    saida.push({
      slug: c.id,
      nome: c.nome,
      grupo: c.grupo,
      tipo: c.tipo,
      motivo:
        falta > 0
          ? `Faltam ${falta} ${falta === 1 ? "série" : "séries"} de ${ROTULO_TIPO[c.tipo]} esta semana.`
          : `Variação de ${ROTULO_TIPO[c.tipo]} para a sua fase ${e.fase}.`,
    });
    if (saida.length >= (e.limite ?? 5)) break;
  }
  return saida;
}

const ROTULO_TIPO: Record<TipoCatalogo, string> = {
  tornozelo: "tornozelo",
  forca: "força",
  velocidade: "velocidade",
  potencia: "potência",
  mobilidade: "mobilidade",
  core: "core",
  bola: "bola",
  visao: "visão de jogo",
};
