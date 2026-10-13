// Card de jogo com 3 etapas (seção 24.4): antes, depois e dia seguinte.
import {
  DURACAO_JOGO_MIN,
  JANELA_POS_JOGO_H,
  JANELA_PRE_JOGO_H,
  JOGOS_SEMANAIS,
  jogosNoPeriodo,
  addDias,
  dataISO,
  instanteSP,
  proximoJogo,
  ultimoJogo,
  type ExcecoesDeJogo,
  type OcorrenciaJogo,
} from "../tempo";
import type { Checkin, Jogo, PreJogoLog } from "../tipos";

export type IdPasso = "antes" | "depois" | "dia_seguinte";

/**
 * bloqueado: ainda não chegou a hora;
 * pendente: vai abrir mais tarde (só o "antes");
 * ativo: é o momento de fazer;
 * concluido: feito;
 * expirado: a janela passou sem registro (ainda dá para registrar atrasado nas telas do jogo).
 */
export type EstadoPasso = "bloqueado" | "pendente" | "ativo" | "concluido" | "expirado";

export type Passo = { id: IdPasso; estado: EstadoPasso };

export type DadosDoJogo = { jogos: Jogo[]; preJogos: PreJogoLog[]; checkins: Checkin[] };

export type EstadoJogo = {
  /** data local do jogo, AAAA-MM-DD (também é o id usado na rota /jogo/[id]) */
  data: string;
  ocorrencia: OcorrenciaJogo;
  registro: Jogo | null;
  preLog: PreJogoLog | null;
  /** check-in do dia seguinte (vinculado ou do mesmo dia) */
  checkinSeguinte: Checkin | null;
  passos: [Passo, Passo, Passo];
  /** o passo em destaque (ativo, ou o próximo a abrir); null quando tudo terminou */
  foco: IdPasso | null;
  completo: boolean;
};

const MS_HORA = 3_600_000;
const MS_MIN = 60_000;

export function ocorrenciaDaData(
  data: string,
  jogos: Jogo[] = [],
  excecoes?: ExcecoesDeJogo,
): OcorrenciaJogo | null {
  // jogos fixos (terça e sábado), com jogo extra e jogo cancelado aplicados
  const doCalendario = jogosNoPeriodo(data, data, excecoes)[0];
  if (doCalendario) return doCalendario;
  // jogo cancelado que já tinha sido registrado: mostra o registro
  const slot = JOGOS_SEMANAIS.find((j) => j.diaSemana === new Date(`${data}T12:00:00Z`).getUTCDay());
  if (slot && !excecoes?.cancelados?.includes(data)) {
    return { slot, data, inicio: instanteSP(data, slot.hora, slot.min) };
  }
  // jogo extra já registrado em um dia sem jogo fixo
  const extra = jogos.find((j) => dataISO(new Date(j.inicio)) === data);
  if (extra) {
    const ini = new Date(extra.inicio);
    return { slot: JOGOS_SEMANAIS[0], data, inicio: ini };
  }
  return null;
}

export function estadoDoJogo(agora: Date, ocorrencia: OcorrenciaJogo, dados: DadosDoJogo): EstadoJogo {
  const { data, inicio } = ocorrencia;
  const registro = dados.jogos.find((j) => j.inicio === inicio.toISOString()) ?? null;
  const registrado = !!registro && registro.dor !== null;
  const preLog = dados.preJogos.find((p) => p.jogoData === data) ?? null;
  const diaSeguinte = addDias(data, 1);
  const checkinSeguinte =
    dados.checkins.find((c) => !!registro?.id && c.jogoId === registro.id) ??
    dados.checkins.find((c) => c.data === diaSeguinte) ??
    null;

  const t = agora.getTime();
  const ini = inicio.getTime();
  const fim = ini + DURACAO_JOGO_MIN * MS_MIN;
  const hoje = dataISO(agora);

  // 1) antes
  let antes: EstadoPasso;
  if (preLog?.concluido) antes = "concluido";
  else if (t >= ini) antes = "expirado";
  else if (ini - t <= JANELA_PRE_JOGO_H * MS_HORA) antes = "ativo";
  else antes = "pendente";

  // 2) depois
  let depois: EstadoPasso;
  if (registrado) depois = "concluido";
  else if (t < fim) depois = "bloqueado";
  else if (t <= ini + JANELA_POS_JOGO_H * MS_HORA) depois = "ativo";
  else depois = "expirado";

  // 3) dia seguinte
  let seguinte: EstadoPasso;
  if (checkinSeguinte) seguinte = "concluido";
  else if (hoje < diaSeguinte) seguinte = "bloqueado";
  else if (hoje === diaSeguinte) seguinte = "ativo";
  else seguinte = "expirado";

  const passos: [Passo, Passo, Passo] = [
    { id: "antes", estado: antes },
    { id: "depois", estado: depois },
    { id: "dia_seguinte", estado: seguinte },
  ];

  const foco =
    passos.find((p) => p.estado === "ativo")?.id ??
    passos.find((p) => p.estado === "pendente")?.id ??
    passos.find((p) => p.estado === "bloqueado")?.id ??
    null;

  return {
    data,
    ocorrencia,
    registro,
    preLog,
    checkinSeguinte,
    passos,
    foco,
    completo: passos.every((p) => p.estado === "concluido" || p.estado === "expirado"),
  };
}

/** O jogo que o card da Hoje deve mostrar agora. */
export function jogoEmFoco(agora: Date, dados: DadosDoJogo, excecoes?: ExcecoesDeJogo): EstadoJogo {
  const prox = proximoJogo(agora, excecoes);
  const ult = ultimoJogo(agora, excecoes);
  if (ult && ult.inicio.getTime() !== prox.inicio.getTime()) {
    const estado = estadoDoJogo(agora, ult, dados);
    const hoje = dataISO(agora);
    const aindaNoCiclo = hoje <= addDias(ult.data, 1);
    const pendente = estado.passos[1].estado === "ativo" || estado.passos[2].estado === "ativo";
    if (aindaNoCiclo && (pendente || !estado.completo)) return estado;
  }
  return estadoDoJogo(agora, prox, dados);
}
