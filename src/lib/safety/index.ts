// Regras de segurança do tornozelo. Ficam no código; os limites só são editados no Perfil, com confirmação.
import { addDias, dataISO, diffDias } from "../tempo";

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
  /** só "true" quando o último check-in está liberado e a restrição de um bloqueio anterior já saiu */
  podeProgredir: boolean;
  /** dor de atenção, ou liberado mas ainda em restrição: pode treinar, sem aumentar a carga */
  manterCarga: boolean;
  /** 3 check-ins seguidos com dor de atenção ou mais */
  dorPersistente: boolean;
  /** há um bloqueio recente que ainda não foi liberado pela regra adaptativa (C2) */
  restricaoAtiva: boolean;
  /** igual a restricaoAtiva (nome antigo, mantido para compatibilidade) */
  bloqueioNaSemana: boolean;
  /** data (AAAA-MM-DD) do último evento de bloqueio */
  ultimoBloqueio: string | null;
  diasDesdeBloqueio: number | null;
  /** o que causou o último bloqueio, em uma frase */
  motivoBloqueio: string | null;
  /** o que falta para liberar a progressão (vazio quando liberado) */
  falta: string[];
  mensagem: string;
};

export const MENSAGEM_PROFISSIONAL = "procure ortopedista ou fisioterapeuta";

/** Texto padrão de alerta (seção 19.3 da especificação da fase 2). */
export const ALERTA_SEGURANCA =
  "Hoje não aumente a carga. Se a dor persistir, o tornozelo falhar ou houver inchaço, procure um ortopedista ou fisioterapeuta. Se não conseguir apoiar o pé, houver deformidade, dormência ou inchaço rápido, procure atendimento médico agora.";

const ORDEM: Record<Exclude<NivelSeguranca, "sem_dados">, number> = { liberado: 0, atencao: 1, bloqueio: 2 };

/** Dias mínimos desde o bloqueio, liberação automática e check-ins bons exigidos (C2). */
export const DIAS_MINIMOS_APOS_BLOQUEIO = 3;
export const DIAS_LIBERACAO_AUTOMATICA = 7;
export const CHECKINS_BONS_EXIGIDOS = 2;

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

type Evento = { data: string; motivo: string };

const dataBR = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

function motivoDoCheckin(c: CheckinSeg, config: ConfigSeguranca) {
  if (config.falhouBloqueia && c.falhou) return `tornozelo cedeu em ${dataBR(c.data)}`;
  if (config.inchacoBloqueia && c.inchaco) return `inchaço em ${dataBR(c.data)}`;
  return `dor ${c.dor} de 10 em ${dataBR(c.data)}`;
}

/** Eventos de bloqueio: check-in em bloqueio ou dor pós-jogo no limite de bloqueio. */
function eventosDeBloqueio(
  checkins: CheckinSeg[],
  jogos: JogoSeg[],
  hoje: string,
  config: ConfigSeguranca,
): Evento[] {
  const lista: Evento[] = [];
  for (const c of checkins) {
    if (c.data <= hoje && nivelDoCheckin(c, config) === "bloqueio") {
      lista.push({ data: c.data, motivo: motivoDoCheckin(c, config) });
    }
  }
  for (const j of jogos) {
    if (j.dor !== null && j.dor >= config.limiteBloqueio) {
      const data = dataISO(new Date(j.inicio));
      if (data <= hoje) lista.push({ data, motivo: `dor ${j.dor} de 10 depois do jogo de ${dataBR(data)}` });
    }
  }
  return lista.sort((a, b) => b.data.localeCompare(a.data));
}

export function avaliarSeguranca(entrada: EntradaSeguranca): ResultadoSeguranca {
  const config = entrada.config ?? SEGURANCA_PADRAO;
  const jogos = entrada.jogos ?? [];
  const ordenados = entrada.checkins
    .filter((c) => c.data <= entrada.hoje)
    .sort((a, b) => b.data.localeCompare(a.data));

  const ultimo = ordenados[0];
  const posJogo =
    entrada.jogos && entrada.agora ? nivelPosJogoRecente(entrada.jogos, entrada.agora, config) : "liberado";
  const eventos = eventosDeBloqueio(entrada.checkins, jogos, entrada.hoje, config);
  const evento = eventos[0] ?? null;

  const base = {
    ultimoBloqueio: evento?.data ?? null,
    diasDesdeBloqueio: evento ? diffDias(evento.data, entrada.hoje) : null,
    motivoBloqueio: evento?.motivo ?? null,
  };

  if (!ultimo && posJogo === "liberado" && !evento) {
    return {
      ...base,
      nivel: "sem_dados",
      podeProgredir: false,
      manterCarga: true,
      dorPersistente: false,
      restricaoAtiva: false,
      bloqueioNaSemana: false,
      falta: ["Faça o check-in para liberar a progressão de carga."],
      mensagem: "Faça o check-in para liberar a progressão de carga.",
    };
  }

  let nivel: Exclude<NivelSeguranca, "sem_dados"> = ultimo ? nivelDoCheckin(ultimo, config) : "liberado";
  if (ORDEM[posJogo] > ORDEM[nivel]) nivel = posJogo;

  // Regra adaptativa (C2): depois de um bloqueio, a progressão só volta quando
  // (a) passaram 3 dias E os 2 últimos check-ins (dias diferentes) estão bons; ou
  // (b) passaram 7 dias com o check-in mais recente bom.
  let restricaoAtiva = false;
  const falta: string[] = [];
  if (evento) {
    const dias = diffDias(evento.data, entrada.hoje);
    const depois = ordenados.filter((c) => c.data > evento.data);
    const bons = depois.slice(0, CHECKINS_BONS_EXIGIDOS);
    const doisBons =
      bons.length === CHECKINS_BONS_EXIGIDOS && bons.every((c) => nivelDoCheckin(c, config) === "liberado");
    const maisRecenteBom = depois.length > 0 && nivelDoCheckin(depois[0], config) === "liberado";
    const liberaPorPrazo = dias >= DIAS_MINIMOS_APOS_BLOQUEIO && doisBons;
    const liberaAuto = dias >= DIAS_LIBERACAO_AUTOMATICA && maisRecenteBom;
    restricaoAtiva = !(liberaPorPrazo || liberaAuto);

    if (restricaoAtiva) {
      if (dias < DIAS_MINIMOS_APOS_BLOQUEIO) {
        const f = DIAS_MINIMOS_APOS_BLOQUEIO - dias;
        falta.push(`Faltam ${f} ${f === 1 ? "dia" : "dias"} desde o bloqueio de ${dataBR(evento.data)}.`);
      }
      if (!doisBons) {
        falta.push("Faltam 2 check-ins em dias diferentes com dor até 3, sem inchaço e sem falha.");
      }
      if (dias < DIAS_LIBERACAO_AUTOMATICA) {
        const f = DIAS_LIBERACAO_AUTOMATICA - dias;
        falta.push(`Ou ${f} ${f === 1 ? "dia" : "dias"} sem novo bloqueio, com dor até 3.`);
      }
    }
  }

  const ultimos3 = ordenados.slice(0, 3);
  const dorPersistente = ultimos3.length === 3 && ultimos3.every((c) => c.dor >= config.limiteAtencao);

  const podeProgredir = nivel === "liberado" && !restricaoAtiva;
  const manterCarga = nivel === "atencao" || (nivel === "liberado" && restricaoAtiva);

  let mensagem: string;
  if (nivel === "bloqueio") {
    mensagem = ALERTA_SEGURANCA;
  } else if (restricaoAtiva && evento) {
    mensagem = `Houve um alerta (${evento.motivo}): mantenha a carga até liberar. Se a dor voltar, ${MENSAGEM_PROFISSIONAL}.`;
  } else if (nivel === "atencao") {
    mensagem = "Mantenha a carga de hoje e não progrida.";
  } else {
    mensagem = "Tudo certo para progredir, deixando 2 repetições de reserva.";
  }
  if (dorPersistente) {
    mensagem += ` A dor está persistindo em 3 check-ins seguidos: ${MENSAGEM_PROFISSIONAL}.`;
  }

  return {
    ...base,
    nivel,
    podeProgredir,
    manterCarga,
    dorPersistente,
    restricaoAtiva,
    bloqueioNaSemana: restricaoAtiva,
    falta,
    mensagem,
  };
}

/** Quantos dias seguidos (até hoje) o check-in está liberado. Hoje ainda sem check-in não zera a sequência. */
export function diasVerdesSeguidos(
  checkins: CheckinSeg[],
  hoje: string,
  config: ConfigSeguranca = SEGURANCA_PADRAO,
) {
  let dias = 0;
  const porData = new Map(checkins.map((c) => [c.data, c]));
  for (let i = 0; i < 365; i++) {
    const c = porData.get(addDias(hoje, -i));
    if (!c) {
      if (i === 0) continue;
      break;
    }
    if (nivelDoCheckin(c, config) !== "liberado") break;
    dias++;
  }
  return dias;
}
