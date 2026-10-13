// Anéis do plano (seção 24.1): atalhos de ação baseados no PLANO do dia, sem criar meta extra.
import { diaSemanaISO } from "../tempo";
import { blocoPrincipal, blocoTornozeloTag, type Bloco, type DiaPlano } from "../seed/plano";
import type { Checkin, Sessao } from "../tipos";

export type AnelId = "treinos" | "tornozelo" | "checkin";
export type ModoDiaAnel = "completo" | "reduzido" | "recuperacao" | "folga";

/**
 * pendente: falta registrar algo;
 * completo: tudo do plano registrado;
 * descanso: domingo ou modo Folga (sem meta);
 * jogo: dia de jogo sem bloco principal (abre o card de jogo).
 */
export type EstadoAnel = "pendente" | "completo" | "descanso" | "jogo";

export type Anel = {
  id: AnelId;
  rotulo: string;
  feitos: number;
  total: number;
  /** 0 a 1, usado no desenho */
  valor: number;
  estado: EstadoAnel;
  /** texto no centro, ex.: "1/2" */
  centro: string;
  /** blocos pendentes, em ordem do plano */
  pendentes: Bloco[];
};

export type ProximaAcao = {
  anel: AnelId;
  texto: string;
  blocoId?: string;
};

export type EntradaAneis = {
  dia: DiaPlano;
  sessoes: Sessao[];
  checkins: Checkin[];
  modo?: ModoDiaAnel;
  /** blocos que o ajuste do modo do dia removeu (modo Recuperação) */
  blocosRemovidos?: string[];
};

const peso = { feito: 1, parcial: 0.5, nao_fiz: 0 } as const;

function sessaoDoBlocoNoDia(sessoes: Sessao[], iso: string, id: string) {
  return sessoes.find((s) => s.data === iso && s.bloco === id);
}

function somar(blocos: Bloco[], sessoes: Sessao[], iso: string) {
  let feitos = 0;
  const pendentes: Bloco[] = [];
  for (const b of blocos) {
    const s = sessaoDoBlocoNoDia(sessoes, iso, b.id);
    if (!s) pendentes.push(b);
    else feitos += peso[s.resultado];
  }
  return { feitos, pendentes };
}

const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));

function montar(
  id: AnelId,
  rotulo: string,
  blocos: Bloco[],
  sessoes: Sessao[],
  iso: string,
  descanso: boolean,
  tipoVazio: EstadoAnel,
): Anel {
  if (descanso) {
    return {
      id,
      rotulo,
      feitos: 0,
      total: 0,
      valor: 0,
      estado: "descanso",
      centro: "Descanso",
      pendentes: [],
    };
  }
  if (!blocos.length) {
    return { id, rotulo, feitos: 0, total: 0, valor: 0, estado: tipoVazio, centro: "—", pendentes: [] };
  }
  const { feitos, pendentes } = somar(blocos, sessoes, iso);
  return {
    id,
    rotulo,
    feitos,
    total: blocos.length,
    valor: feitos / blocos.length,
    estado: pendentes.length ? "pendente" : "completo",
    centro: `${num(feitos)}/${blocos.length}`,
    pendentes,
  };
}

/** Os 3 anéis do dia. */
export function computeAneis(e: EntradaAneis): { aneis: Anel[]; proxima: ProximaAcao | null } {
  const { dia, sessoes, checkins } = e;
  const descanso = diaSemanaISO(dia.iso) === 0 || e.modo === "folga";
  const removidos = new Set(e.blocosRemovidos ?? []);

  const principais = dia.blocos.filter((b) => blocoPrincipal(b) && !removidos.has(b.id));
  const tornozelo = dia.blocos.filter(blocoTornozeloTag);

  const temJogo = !!dia.jogo;
  const treinos = montar(
    "treinos",
    "Treinos",
    principais,
    sessoes,
    dia.iso,
    descanso,
    temJogo ? "jogo" : "completo",
  );
  const torn = montar("tornozelo", "Tornozelo", tornozelo, sessoes, dia.iso, descanso, "completo");

  const feitoCheckin = checkins.some((c) => c.data === dia.iso);
  const checkin: Anel = descanso
    ? {
        id: "checkin",
        rotulo: "Check-in",
        feitos: 0,
        total: 0,
        valor: 0,
        estado: "descanso",
        centro: "Descanso",
        pendentes: [],
      }
    : {
        id: "checkin",
        rotulo: "Check-in",
        feitos: feitoCheckin ? 1 : 0,
        total: 1,
        valor: feitoCheckin ? 1 : 0,
        estado: feitoCheckin ? "completo" : "pendente",
        centro: feitoCheckin ? "1/1" : "0/1",
        pendentes: [],
      };

  // Quando o dia só tem jogo e nada de treino principal, o anel TREINOS vira o ícone do jogo.
  const aneis = [treinos, torn, checkin];

  // "Falta fazer": check-in, depois tornozelo, depois o próximo bloco principal.
  let proxima: ProximaAcao | null = null;
  if (!descanso) {
    if (checkin.estado === "pendente") {
      proxima = { anel: "checkin", texto: "Falta: check-in de hoje - 30 s" };
    } else if (torn.pendentes[0]) {
      const b = torn.pendentes[0];
      proxima = {
        anel: "tornozelo",
        texto: `Falta: ${b.titulo.toLowerCase()} - ${b.duracaoMin} min`,
        blocoId: b.id,
      };
    } else if (treinos.pendentes[0]) {
      const b = treinos.pendentes[0];
      proxima = {
        anel: "treinos",
        texto: `Falta: ${b.titulo.toLowerCase()} - ${b.duracaoMin} min`,
        blocoId: b.id,
      };
    }
  }
  return { aneis, proxima };
}

/** Anéis da semana: feitos e planejados nos 7 dias (check-ins contam 7). */
export function computeAneisSemana(
  dias: DiaPlano[],
  sessoes: Sessao[],
  checkins: Checkin[],
  hoje: string,
): Anel[] {
  let tf = 0;
  let tt = 0;
  let nf = 0;
  let nt = 0;
  let cf = 0;
  for (const dia of dias) {
    const principais = dia.blocos.filter(blocoPrincipal);
    const torn = dia.blocos.filter(blocoTornozeloTag);
    tt += principais.length;
    nt += torn.length;
    tf += somar(principais, sessoes, dia.iso).feitos;
    nf += somar(torn, sessoes, dia.iso).feitos;
    if (checkins.some((c) => c.data === dia.iso)) cf++;
  }
  const mk = (id: AnelId, rotulo: string, feitos: number, total: number): Anel => ({
    id,
    rotulo,
    feitos,
    total,
    valor: total ? feitos / total : 0,
    estado: total === 0 ? "completo" : feitos >= total ? "completo" : "pendente",
    centro: `${num(feitos)}/${total}`,
    pendentes: [],
  });
  void hoje;
  return [
    mk("treinos", "Treinos", tf, tt),
    mk("tornozelo", "Tornozelo", nf, nt),
    mk("checkin", "Check-in", cf, 7),
  ];
}
