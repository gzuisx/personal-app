// Validador de propostas (seção 8): nenhuma proposta passa se ferir a segurança.
// Vale para propostas do motor de regras hoje e para propostas de IA no futuro.
import type { CriterioProposta, TipoProposta } from "../tipos";
import type { Decisao } from "./tipos";

export type PropostaParaValidar = {
  tipo: TipoProposta;
  titulo?: string;
  criterios?: CriterioProposta[];
  payload: Record<string, unknown>;
};

export type ResultadoValidacao = { ok: true } | { ok: false; motivo: string };

/** Limite de aumento de carga por proposta: 5% ou 2,5 kg (o que for menor... mas sempre pelo menos 1 kg). */
export const LIMITE_AUMENTO_PERCENTUAL = 0.1;
export const LIMITE_VOLUME_SEMANAL_PERCENTUAL = 0.2;

const recusa = (motivo: string): ResultadoValidacao => ({ ok: false, motivo });

export function validarProposta(
  p: PropostaParaValidar,
  ctx: {
    decisao: Pick<Decisao, "podeProgredir" | "modo">;
    podeProgredirSeguranca: boolean;
    dorHoje: number | null;
  },
): ResultadoValidacao {
  const { payload } = p;
  const aumentaCarga =
    p.tipo === "progressao_carga" ||
    (typeof payload.paraKg === "number" && typeof payload.deKg === "number" && payload.paraKg > payload.deKg);

  if (aumentaCarga && (!ctx.podeProgredirSeguranca || !ctx.decisao.podeProgredir)) {
    return recusa("A segurança do tornozelo não libera aumento de carga hoje.");
  }
  if (
    aumentaCarga &&
    typeof payload.deKg === "number" &&
    typeof payload.paraKg === "number" &&
    payload.deKg > 0
  ) {
    if (payload.paraKg / payload.deKg - 1 > LIMITE_AUMENTO_PERCENTUAL + 1e-9) {
      return recusa("O aumento de carga passa do limite de 10% por proposta.");
    }
  }

  if (payload.adicionaImpacto === true && (ctx.dorHoje ?? 0) >= 4) {
    return recusa("Com dor de 4 ou mais, não entra exercício de impacto.");
  }
  if (payload.removeAquecimento === true || payload.removeTornozelo === true) {
    return recusa("Aquecimento e rotina de tornozelo não podem ser removidos.");
  }
  if (payload.alteraRegrasDeSeguranca === true) {
    return recusa("Proposta não pode alterar as regras de segurança.");
  }
  if (
    typeof payload.aumentoVolumePercentual === "number" &&
    payload.aumentoVolumePercentual > LIMITE_VOLUME_SEMANAL_PERCENTUAL * 100
  ) {
    return recusa("O volume semanal sobe mais do que o limite de 20%.");
  }

  if (p.tipo === "fase") {
    const criterios = p.criterios ?? [];
    if (!criterios.length || !criterios.every((c) => c.ok)) {
      return recusa("A fase só muda quando todos os critérios estão atendidos.");
    }
    if (!ctx.podeProgredirSeguranca) return recusa("Com a segurança bloqueando, a fase não avança.");
    const de = payload.de;
    const para = payload.para;
    if (typeof de !== "number" || typeof para !== "number" || para !== de + 1) {
      return recusa("A fase só avança uma de cada vez.");
    }
  }

  return { ok: true };
}
