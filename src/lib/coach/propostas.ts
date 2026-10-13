// Propostas do motor de regras (seção 8): gerar, aceitar, adiar e recusar.
// Nada muda no plano sem o Gabriel aceitar; aceitar sempre cria uma versão do plano e um registro de auditoria.
import { TEMPLATE_POR_CHAVE, type ChaveTemplate } from "../seed/templates";
import { addDias } from "../tempo";
import type { FaseNum, PlanoVersao, Proposta, RegistroAuditoria } from "../tipos";
import type { PropostaSugerida } from "./tipos";
import { validarProposta, type ResultadoValidacao } from "./validador";
import type { Decisao } from "./tipos";

/** Dias que uma proposta adiada fica sem aparecer. */
export const DIAS_DE_ADIAMENTO = 7;
/** Uma proposta pode ser adiada só uma vez; depois é aceitar ou recusar. */
export const MAX_ADIAMENTOS = 1;

export function visivel(p: Proposta, hoje: string): boolean {
  if (p.status === "pendente") return true;
  if (p.status === "adiada") return !p.adiadaAte || p.adiadaAte <= hoje;
  return false;
}

/** Propostas novas: as sugeridas pelas regras que ainda não existem (mesma chave única). */
export function novasPropostas(
  existentes: Proposta[],
  sugeridas: PropostaSugerida[],
  hoje: string,
  novoId: () => string,
): Proposta[] {
  const chaves = new Set(existentes.map((p) => p.chaveUnica));
  const saida: Proposta[] = [];
  for (const s of sugeridas) {
    // Fase: só uma proposta por transição; progressão: uma por exercício e semana.
    const chave =
      s.tipo === "progressao_carga" || s.tipo === "descarga" || s.tipo === "plano"
        ? `${s.chave}:${semanaDe(hoje)}`
        : s.chave;
    if (chaves.has(chave)) continue;
    chaves.add(chave);
    saida.push({
      id: novoId(),
      chaveUnica: chave,
      tipo: s.tipo,
      status: "pendente",
      regra: s.regra,
      titulo: s.titulo,
      resumo: s.resumo,
      criterios: s.criterios,
      payload: s.payload,
      criadaEm: hoje,
    });
  }
  return saida;
}

/** Segunda-feira da semana de `iso` (identifica a semana na chave única). */
function semanaDe(iso: string): string {
  const dow = (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7;
  return addDias(iso, -dow);
}

export type ResultadoDecisao =
  | { ok: false; motivo: string }
  | {
      ok: true;
      proposta: Proposta;
      versao?: PlanoVersao;
      auditoria: RegistroAuditoria;
      /** só quando uma proposta de fase é aceita */
      novaFase?: { fase: FaseNum; inicio: string };
    };

type Contexto = {
  hoje: string;
  decisao: Pick<Decisao, "podeProgredir" | "modo">;
  podeProgredirSeguranca: boolean;
  dorHoje: number | null;
  novoId: () => string;
  agora: string;
};

function auditoria(
  c: Contexto,
  evento: string,
  p: Proposta,
  extra: Record<string, unknown> = {},
): RegistroAuditoria {
  return {
    id: c.novoId(),
    evento,
    detalhes: {
      propostaId: p.id,
      tipo: p.tipo,
      regra: p.regra,
      titulo: p.titulo,
      payload: p.payload,
      ...extra,
    },
    criadoEm: c.agora,
  };
}

function duracaoDoTemplate(p: Proposta): number | null {
  const chave = typeof p.payload.template === "string" ? (p.payload.template as ChaveTemplate) : null;
  return chave ? (TEMPLATE_POR_CHAVE[chave]?.duracaoDias ?? null) : null;
}

/** Cartão "Sugestão de plano" (8.2): transforma a sugestão de uma regra em proposta com Aceitar, Adiar e Recusar. */
export function propostaDePlano(chave: string, motivo: string): PropostaSugerida | null {
  const t = TEMPLATE_POR_CHAVE[chave as ChaveTemplate];
  if (!t || !t.aplicavel || t.chave === "P1") return null;
  return {
    tipo: "plano",
    regra: "PLANO",
    titulo: `Plano ${t.chave}: ${t.nome}`,
    resumo:
      `${t.descricao} ${motivo} Dura ${t.duracaoDias ?? 7} dias e depois volta ao plano Base. ${t.naoFazer.length ? "Evite: " + t.naoFazer.join(" ") : ""}`.trim(),
    chave: `plano:${t.chave}`,
    criterios: [],
    payload: { template: t.chave },
  };
}

export function aceitarProposta(p: Proposta, c: Contexto): ResultadoDecisao {
  if (p.status !== "pendente" && p.status !== "adiada")
    return { ok: false, motivo: "Essa proposta já foi decidida." };
  const v: ResultadoValidacao = validarProposta(p, c);
  if (!v.ok) return { ok: false, motivo: v.motivo };

  const aceita: Proposta = { ...p, status: "aceita", decididaEm: c.hoje };
  const versao: PlanoVersao = {
    id: c.novoId(),
    chaveTemplate: typeof p.payload.template === "string" ? p.payload.template : null,
    inicio: c.hoje,
    fim: duracaoDoTemplate(p) ? addDias(c.hoje, duracaoDoTemplate(p)!) : null,
    origem: "proposta",
    ativo: true,
    conteudo: { propostaId: p.id, tipo: p.tipo, regra: p.regra, payload: p.payload },
  };
  const novaFase =
    p.tipo === "fase" && typeof p.payload.para === "number"
      ? { fase: p.payload.para as FaseNum, inicio: c.hoje }
      : undefined;
  return { ok: true, proposta: aceita, versao, auditoria: auditoria(c, "proposta_aceita", p), novaFase };
}

export function adiarProposta(p: Proposta, c: Contexto): ResultadoDecisao {
  if (p.status === "adiada")
    return { ok: false, motivo: "Essa proposta já foi adiada uma vez: aceite ou recuse." };
  if (p.status !== "pendente") return { ok: false, motivo: "Essa proposta já foi decidida." };
  const adiada: Proposta = { ...p, status: "adiada", adiadaAte: addDias(c.hoje, DIAS_DE_ADIAMENTO) };
  return {
    ok: true,
    proposta: adiada,
    auditoria: auditoria(c, "proposta_adiada", p, { ate: adiada.adiadaAte }),
  };
}

export function recusarProposta(p: Proposta, c: Contexto): ResultadoDecisao {
  if (p.status !== "pendente" && p.status !== "adiada")
    return { ok: false, motivo: "Essa proposta já foi decidida." };
  const recusada: Proposta = { ...p, status: "recusada", decididaEm: c.hoje };
  return { ok: true, proposta: recusada, auditoria: auditoria(c, "proposta_recusada", p) };
}

/**
 * Cargas das progressões aceitas que ainda não foram treinadas (5.5): o treino guiado já abre com esse valor.
 * Quando o exercício é treinado depois da aceitação, a última sessão passa a valer.
 */
export function cargasAceitas(
  propostas: Proposta[],
  series: { exercicio: string; data: string }[],
): Record<string, number> {
  const saida: Record<string, { kg: number; desde: string }> = {};
  for (const p of propostas) {
    if (p.tipo !== "progressao_carga" || p.status !== "aceita" || !p.decididaEm) continue;
    const slug = p.payload.slug;
    const kg = p.payload.paraKg;
    if (typeof slug !== "string" || typeof kg !== "number") continue;
    const atual = saida[slug];
    if (!atual || p.decididaEm >= atual.desde) saida[slug] = { kg, desde: p.decididaEm };
  }
  const final: Record<string, number> = {};
  for (const [slug, { kg, desde }] of Object.entries(saida)) {
    const treinouDepois = series.some((s) => s.exercicio === slug && s.data > desde);
    if (!treinouDepois) final[slug] = kg;
  }
  return final;
}
