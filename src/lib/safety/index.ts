// Regras de segurança do tornozelo. Ficam no código; os limites só são editados no Perfil, com confirmação.
import { addDias } from "../tempo";

export type NivelSeguranca = "liberado" | "atencao" | "bloqueio" | "sem_dados";

export type ConfigSeguranca = {
  /** dor igual ou acima deste valor bloqueia o aumento de carga (padrão 6) */
  limiteBloqueio: number;
  /** dor igual ou acima deste valor (e abaixo do bloqueio) mantém a carga (padrão 4) */
  limiteAtencao: number;
  inchacoBloqueia: boolean;
  falhouBloqueia: boolean;
};

export const SEGURANCA_PADRAO: ConfigSeguranca = {
  limiteBloqueio: 6,
  limiteAtencao: 4,
  inchacoBloqueia: true,
  falhouBloqueia: true,
};

export type CheckinSeg = {
  /** AAAA-MM-DD */
  data: string;
  dor: number;
  inchaco: boolean;
  falhou: boolean;
};

export type JogoSeg = {
  /** instante de início (ISO) */
  inicio: string;
  dor: number | null;
};

export type EntradaSeguranca = {
  checkins: CheckinSeg[];
  jogos?: JogoSeg[];
  /** data de hoje (AAAA-MM-DD) */
  hoje: string;
  agora?: Date;
  config?: ConfigSeguranca;
};

export type ResultadoSeguranca = {
  nivel: NivelSeguranca;
  /** só "true" quando o último check-in está liberado e não houve bloqueio nos últimos 7 dias */
  podeProgredir: boolean;
  /** dor de atenção: pode treinar, mas sem aumentar a carga */
  manterCarga: boolean;
  /** 3 check-ins seguidos com dor de atenção ou mais */
  dorPersistente: boolean;
  /** algum check-in dos últimos 7 dias esteve em bloqueio */
  bloqueioNaSemana: boolean;
  mensagem: string;
};

export const MENSAGEM_PROFISSIONAL = "procure ortopedista ou fisioterapeuta";

const ORDEM: Record<Exclude<NivelSeguranca, "sem_dados">, number> = { liberado: 0, atencao: 1, bloqueio: 2 };

export function nivelDoCheckin(
  c: Pick<CheckinSeg, "dor" | "inchaco" | "falhou">,
  config: ConfigSeguranca = SEGURANCA_PADRAO,
): Exclude<NivelSeguranca, "sem_dados"> {
  if (
    c.dor >= config.limiteBloqueio ||
    (config.inchacoBloqueia && c.inchaco) ||
    (config.falhouBloqueia && c.falhou)
  ) {
    return "bloqueio";
  }
  if (c.dor >= config.limiteAtencao || c.inchaco || c.falhou) return "atencao";
  return "liberado";
}

export function nivelDaDorPosJogo(dor: number | null, config: ConfigSeguranca = SEGURANCA_PADRAO) {
  if (dor === null) return "liberado" as const;
  if (dor >= config.limiteBloqueio) return "bloqueio" as const;
  if (dor >= config.limiteAtencao) return "atencao" as const;
  return "liberado" as const;
}

const MS_48H = 48 * 3_600_000;

/** Pior nível entre as dores pós-jogo das últimas 48 h. */
export function nivelPosJogoRecente(jogos: JogoSeg[], agora: Date, config: ConfigSeguranca) {
  let pior: Exclude<NivelSeguranca, "sem_dados"> = "liberado";
  for (const j of jogos) {
    const dt = agora.getTime() - new Date(j.inicio).getTime();
    if (dt < 0 || dt > MS_48H) continue;
    const n = nivelDaDorPosJogo(j.dor, config);
    if (ORDEM[n] > ORDEM[pior]) pior = n;
  }
  return pior;
}

export function avaliarSeguranca(entrada: EntradaSeguranca): ResultadoSeguranca {
  const config = entrada.config ?? SEGURANCA_PADRAO;
  const ordenados = entrada.checkins
    .filter((c) => c.data <= entrada.hoje)
    .sort((a, b) => b.data.localeCompare(a.data));

  const ultimo = ordenados[0];
  const posJogo = entrada.jogos && entrada.agora ? nivelPosJogoRecente(entrada.jogos, entrada.agora, config) : "liberado";

  if (!ultimo && posJogo === "liberado") {
    return {
      nivel: "sem_dados",
      podeProgredir: false,
      manterCarga: true,
      dorPersistente: false,
      bloqueioNaSemana: false,
      mensagem: "Faça o check-in para liberar a progressão de carga.",
    };
  }

  let nivel = ultimo ? nivelDoCheckin(ultimo, config) : "liberado";
  if (ORDEM[posJogo] > ORDEM[nivel]) nivel = posJogo;

  const limiteSemana = addDias(entrada.hoje, -6);
  const bloqueioNaSemana =
    nivel === "bloqueio" ||
    ordenados.some((c) => c.data >= limiteSemana && nivelDoCheckin(c, config) === "bloqueio");

  const ultimos3 = ordenados.slice(0, 3);
  const dorPersistente = ultimos3.length === 3 && ultimos3.every((c) => c.dor >= config.limiteAtencao);

  const podeProgredir = nivel === "liberado" && !bloqueioNaSemana;
  const manterCarga = nivel === "atencao" || (nivel === "liberado" && bloqueioNaSemana);

  let mensagem: string;
  if (nivel === "bloqueio") {
    mensagem = `Hoje não aumente a carga. Se a dor persistir, ${MENSAGEM_PROFISSIONAL}.`;
  } else if (bloqueioNaSemana) {
    mensagem = `Houve alerta nos últimos 7 dias: mantenha a carga. Se a dor voltar, ${MENSAGEM_PROFISSIONAL}.`;
  } else if (nivel === "atencao") {
    mensagem = "Mantenha a carga de hoje e não progrida.";
  } else {
    mensagem = "Tudo certo para progredir, deixando 2 repetições de reserva.";
  }
  if (dorPersistente) {
    mensagem += ` A dor está persistindo em 3 check-ins seguidos: ${MENSAGEM_PROFISSIONAL}.`;
  }

  return { nivel, podeProgredir, manterCarga, dorPersistente, bloqueioNaSemana, mensagem };
}

/** Quantos dias seguidos (até hoje) o último check-in está liberado e sem bloqueio recente. */
export function diasVerdesSeguidos(checkins: CheckinSeg[], hoje: string, config: ConfigSeguranca = SEGURANCA_PADRAO) {
  let dias = 0;
  const porData = new Map(checkins.map((c) => [c.data, c]));
  for (let i = 0; i < 365; i++) {
    const c = porData.get(addDias(hoje, -i));
    if (!c) {
      if (i === 0) continue; // hoje ainda sem check-in não zera a sequência
      break;
    }
    if (nivelDoCheckin(c, config) !== "liberado") break;
    dias++;
  }
  return dias;
}
