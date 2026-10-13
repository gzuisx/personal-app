// Foco de lesão: a rotina gira em torno da lesão principal do momento (hoje, o tornozelo direito).
// Só o Gabriel troca o foco (Perfil, com confirmação). Nem a IA nem o motor trocam sozinhos.
import { ALERTA_SEGURANCA } from "../safety";
import { nomeDoFoco, type FocoDoPlano } from "../seed/plano";
import { PROTOCOLOS, faseDoProtocolo, type LadoFoco, type RegiaoFoco } from "../seed/protocolos";

export type { LadoFoco, RegiaoFoco } from "../seed/protocolos";

export type FaseFoco = 1 | 2 | 3 | 4;

export type FocoLesao = {
  id: string;
  regiao: RegiaoFoco;
  lado: LadoFoco;
  /** AAAA-MM-DD */
  inicio: string;
  fase: FaseFoco;
  /** AAAA-MM-DD em que a fase atual começou */
  faseInicio: string;
  ativo: boolean;
  notas: string | null;
};

export const ID_FOCO_PADRAO = "foco-tornozelo-direito";
/** Início do plano: o tornozelo é o foco desde o primeiro dia. */
const INICIO_FOCO_PADRAO = "2026-10-13";

/** Foco usado quando o banco ainda não tem nenhum: o tornozelo direito, com a fase guardada no perfil. */
export function focoPadrao(fase: { fase: FaseFoco; inicio: string }): FocoLesao {
  return {
    id: ID_FOCO_PADRAO,
    regiao: "tornozelo",
    lado: "direito",
    inicio: INICIO_FOCO_PADRAO,
    fase: fase.fase,
    faseInicio: fase.inicio,
    ativo: true,
    notas: null,
  };
}

export const ehTornozelo = (f: Pick<FocoLesao, "regiao">) => f.regiao === "tornozelo";

export const focoDoPlano = (f: FocoLesao): FocoDoPlano => ({ regiao: f.regiao, lado: f.lado, fase: f.fase });

/** Fase do foco no formato da fase do tornozelo (fase e quando começou). */
export const faseDoFoco = (f: FocoLesao) => ({ fase: f.fase, inicio: f.faseInicio });

/** Fase em que um foco novo começa: o tornozelo volta na fase guardada; as outras regiões começam na 1. */
export function faseInicialDoFoco(regiao: RegiaoFoco, faseTornozelo: FaseFoco): FaseFoco {
  return regiao === "tornozelo" ? faseTornozelo : 1;
}

/** Monta o foco novo para gravar. O anterior fica no histórico como inativo (nada é apagado). */
export function novoFoco(e: {
  regiao: RegiaoFoco;
  lado: LadoFoco;
  hoje: string;
  faseTornozelo: { fase: FaseFoco; inicio: string };
  notas?: string | null;
  id: string;
}): FocoLesao {
  return {
    id: e.id,
    regiao: e.regiao,
    lado: e.lado,
    inicio: e.hoje,
    fase: faseInicialDoFoco(e.regiao, e.faseTornozelo.fase),
    faseInicio: e.regiao === "tornozelo" ? e.faseTornozelo.inicio : e.hoje,
    ativo: true,
    notas: e.notas?.trim() || null,
  };
}

/** Lista de focos depois da troca: no máximo um ativo. */
export function trocarFocoNaLista(focos: FocoLesao[], novo: FocoLesao): FocoLesao[] {
  return [...focos.map((f) => (f.ativo ? { ...f, ativo: false } : f)), novo];
}

const ARTIGO: Record<RegiaoFoco, "o" | "a"> = { tornozelo: "o", posterior_coxa: "o", panturrilha: "a" };
const noNa = (r: RegiaoFoco) => (ARTIGO[r] === "a" ? "na" : "no");

export type RotulosFoco = {
  /** "tornozelo direito", "posterior de coxa direito" */
  nome: string;
  /** "Tornozelo", "Posterior de coxa" */
  regiao: string;
  pergunta: string;
  dor: string;
  falhou: string;
  /** título do bloco de reabilitação */
  rotina: string;
};

/** Textos da interface para o foco. Com o tornozelo, são exatamente os textos de antes. */
export function rotulosDoFoco(f: Pick<FocoLesao, "regiao" | "lado">): RotulosFoco {
  if (f.regiao === "tornozelo" && f.lado === "direito") {
    return {
      nome: "tornozelo direito",
      regiao: "Tornozelo",
      pergunta: "Como está seu tornozelo?",
      dor: "Dor no tornozelo direito",
      falhou: "Falhou (cedeu ou virou)",
      rotina: "Rotina de tornozelo",
    };
  }
  const nome = nomeDoFoco(f.regiao, f.lado);
  const regiao = PROTOCOLOS[f.regiao].nome;
  return {
    nome,
    regiao,
    pergunta: `Como está ${ARTIGO[f.regiao] === "a" ? "sua" : "seu"} ${regiao.toLowerCase()}?`,
    dor: `Dor ${noNa(f.regiao)} ${nome}`,
    falhou: f.regiao === "tornozelo" ? "Falhou (cedeu ou virou)" : "Falhou (fisgou ou travou)",
    rotina: f.regiao === "tornozelo" ? "Rotina de tornozelo" : `Reabilitação: ${nome}`,
  };
}

/**
 * Texto padrão de segurança da troca de foco (seção 19.3), adaptado à região e sempre
 * sugerindo avaliação profissional.
 */
export function textoSegurancaTroca(f: Pick<FocoLesao, "regiao" | "lado">): string {
  if (ehTornozelo(f)) return ALERTA_SEGURANCA;
  const nome = nomeDoFoco(f.regiao, f.lado);
  return `Hoje não aumente a carga. Se a dor ${noNa(f.regiao)} ${nome} persistir, voltar a fisgar ou houver inchaço, procure um ortopedista ou fisioterapeuta. Se não conseguir andar ou apoiar a perna, houver deformidade, hematoma grande, dormência ou inchaço rápido, procure atendimento médico agora.`;
}

export const AVISO_TROCA_FOCO =
  "Trocar o foco muda a reabilitação, os exercícios e as demonstrações. Força e velocidade continuam, adaptadas às restrições. Antes de mudar, faça uma avaliação com um ortopedista ou fisioterapeuta.";

/** Resumo da fase atual do protocolo do foco. */
export function faseDoProtocoloDoFoco(f: FocoLesao) {
  return PROTOCOLOS[f.regiao].fases[faseDoProtocolo(f.fase)];
}

/**
 * Deixa o foco coerente com o que veio do banco ou do aparelho: sem nenhum foco gravado, usa o tornozelo
 * direito; com o tornozelo como foco, a fase vem do perfil (profiles.fase_tornozelo continua valendo).
 */
export function normalizarFocos(
  focos: FocoLesao[] | undefined,
  faseTornozelo: { fase: FaseFoco; inicio: string },
): { foco: FocoLesao; focos: FocoLesao[] } {
  const lista = focos?.length ? focos : [focoPadrao(faseTornozelo)];
  const ativos = lista.filter((f) => f.ativo);
  // mais de um ativo não deveria acontecer (índice único no banco); vale o mais recente
  const ativo = [...ativos].sort((a, b) => b.inicio.localeCompare(a.inicio))[0] ?? focoPadrao(faseTornozelo);
  const foco = ehTornozelo(ativo)
    ? { ...ativo, fase: faseTornozelo.fase, faseInicio: faseTornozelo.inicio }
    : ativo;
  const resto = lista.filter((f) => f.id !== ativo.id).map((f) => (f.ativo ? { ...f, ativo: false } : f));
  return { foco, focos: [...resto, foco] };
}
