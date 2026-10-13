// Biblioteca de exercícios: o catálogo com regiões, como fazer, erros comuns e a demonstração.
import { CATALOGO, CATALOGO_POR_ID, type ItemCatalogo, type TipoCatalogo } from "./seed/catalogo";
import { DETALHES, type DetalheExercicio, type RegiaoCorpo } from "./seed/catalogo-detalhes";
import { PROTOCOLOS, type RegiaoFoco } from "./seed/protocolos";

export const ROTULO_TIPO: Record<TipoCatalogo, string> = {
  tornozelo: "Tornozelo",
  forca: "Força",
  velocidade: "Velocidade",
  potencia: "Potência",
  mobilidade: "Mobilidade",
  core: "Core",
  bola: "Bola",
  visao: "Visão de jogo",
};

export const TIPOS_BIBLIOTECA = Object.keys(ROTULO_TIPO) as TipoCatalogo[];

export type ItemBiblioteca = ItemCatalogo & DetalheExercicio;

const VAZIO: DetalheExercicio = { regioes: [], passos: ["", "", ""], erros: [] };

export const BIBLIOTECA: ItemBiblioteca[] = CATALOGO.map((c) => ({ ...c, ...(DETALHES[c.id] ?? VAZIO) }));

export function itemDaBiblioteca(slug: string): ItemBiblioteca | null {
  const c = CATALOGO_POR_ID[slug];
  return c ? { ...c, ...(DETALHES[slug] ?? VAZIO) } : null;
}

/** Exercícios do protocolo de reabilitação de um foco (todas as fases, na ordem). */
export function exerciciosDoFoco(regiao: RegiaoFoco): string[] {
  const vistos = new Set<string>();
  for (const f of Object.values(PROTOCOLOS[regiao].fases)) for (const e of f.exercicios) vistos.add(e.slug);
  return [...vistos];
}

/** Sem acento e em minúsculas, para a busca. */
export const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export type FiltroBiblioteca = {
  busca?: string;
  regiao?: RegiaoCorpo | null;
  tipo?: TipoCatalogo | null;
  /** só os exercícios da reabilitação deste foco */
  foco?: RegiaoFoco | null;
};

export function filtrarBiblioteca(
  f: FiltroBiblioteca,
  itens: ItemBiblioteca[] = BIBLIOTECA,
): ItemBiblioteca[] {
  const termos = normalizar(f.busca ?? "")
    .split(/\s+/)
    .filter(Boolean);
  const doFoco = f.foco ? new Set(exerciciosDoFoco(f.foco)) : null;
  const lista = itens.filter((i) => {
    if (f.regiao && !i.regioes.includes(f.regiao)) return false;
    if (f.tipo && i.tipo !== f.tipo) return false;
    if (doFoco && !doFoco.has(i.id)) return false;
    if (!termos.length) return true;
    const texto = normalizar(
      [i.nome, i.grupo, ROTULO_TIPO[i.tipo], ...i.regioes, ...i.equipamento].join(" "),
    );
    return termos.every((t) => texto.includes(t));
  });
  if (!doFoco) return lista;
  const ordem = [...doFoco];
  return lista.sort((a, b) => ordem.indexOf(a.id) - ordem.indexOf(b.id));
}

const ROTULO_EQUIP: Record<string, string> = {
  nenhum: "Sem equipamento",
  elastico: "Elástico",
  degrau: "Degrau",
  anilha: "Anilha",
  halter: "Halteres",
  barra: "Barra",
  academia: "Academia",
  campo: "Campo",
  cones: "Cones",
};

export const rotuloEquipamento = (e: string) => ROTULO_EQUIP[e] ?? e;
