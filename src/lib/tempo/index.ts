// Toda a lógica de datas do app usa o fuso America/Sao_Paulo.
// O Brasil não tem horário de verão desde 2019: o fuso é fixo em UTC-3.

export const TZ = "America/Sao_Paulo";
const OFFSET_HORAS = 3; // horas a somar à hora local de Brasília para obter UTC
const MS_MIN = 60_000;
const MS_HORA = 3_600_000;

export const DURACAO_JOGO_MIN = 80;
export const JANELA_PRE_JOGO_H = 4;
export const JANELA_POS_JOGO_H = 12;

export const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"] as const;

export const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

const MAPA_DIA_SEMANA: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export type PartesSP = {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  min: number;
  /** 0 = domingo ... 6 = sábado */
  diaSemana: number;
};

const formatador = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
  weekday: "short",
});

export function partesSP(d: Date): PartesSP {
  const p: Record<string, string> = {};
  for (const parte of formatador.formatToParts(d)) p[parte.type] = parte.value;
  return {
    ano: Number(p.year),
    mes: Number(p.month),
    dia: Number(p.day),
    hora: Number(p.hour) % 24,
    min: Number(p.minute),
    diaSemana: MAPA_DIA_SEMANA[p.weekday] ?? 0,
  };
}

const dois = (n: number) => String(n).padStart(2, "0");

export function paraISO(ano: number, mes: number, dia: number) {
  return `${ano}-${dois(mes)}-${dois(dia)}`;
}

/** Data (AAAA-MM-DD) em São Paulo para um instante. */
export function dataISO(d: Date) {
  const p = partesSP(d);
  return paraISO(p.ano, p.mes, p.dia);
}

export function parseISO(iso: string) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return { ano, mes, dia };
}

function utcDoDia(iso: string) {
  const { ano, mes, dia } = parseISO(iso);
  return Date.UTC(ano, mes - 1, dia);
}

export function addDias(iso: string, n: number) {
  const d = new Date(utcDoDia(iso) + n * 86_400_000);
  return paraISO(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Diferença em dias (b - a). */
export function diffDias(a: string, b: string) {
  return Math.round((utcDoDia(b) - utcDoDia(a)) / 86_400_000);
}

/** 0 = domingo ... 6 = sábado, para uma data AAAA-MM-DD. */
export function diaSemanaISO(iso: string) {
  return new Date(utcDoDia(iso)).getUTCDay();
}

/** Instante (UTC) correspondente a uma data e hora locais de São Paulo. */
export function instanteSP(iso: string, hora: number, min = 0) {
  const { ano, mes, dia } = parseISO(iso);
  return new Date(Date.UTC(ano, mes - 1, dia, hora + OFFSET_HORAS, min));
}

/** Segunda-feira da semana que contém a data. */
export function inicioSemana(iso: string) {
  const dow = diaSemanaISO(iso);
  return addDias(iso, -((dow + 6) % 7));
}

/** Os 7 dias (segunda a domingo) da semana que contém a data. */
export function diasDaSemana(iso: string) {
  const seg = inicioSemana(iso);
  return Array.from({ length: 7 }, (_, i) => addDias(seg, i));
}

export function saudacao(d: Date, nome = "Gabriel") {
  const { hora } = partesSP(d);
  const periodo = hora >= 5 && hora < 12 ? "Bom dia" : hora >= 12 && hora < 18 ? "Boa tarde" : "Boa noite";
  return `${periodo}, ${nome}`;
}

/** Ex.: "terça, 13 de outubro". */
export function dataExtensoISO(iso: string) {
  const { mes, dia } = parseISO(iso);
  return `${DIAS_SEMANA[diaSemanaISO(iso)]}, ${dia} de ${MESES[mes - 1]}`;
}

export function dataExtenso(d: Date) {
  return dataExtensoISO(dataISO(d));
}

export function horaTexto(hora: number, min: number) {
  return min === 0 ? `${hora}h` : `${hora}h${dois(min)}`;
}

// ---------------------------------------------------------------- jogos

export type LembretesJogo = {
  /** refeição principal */
  refeicao: string;
  lanche: string;
  ativacao: string;
  aquecimento: string;
};

export type JogoSlot = {
  diaSemana: number;
  /** "Terça", "Sábado" */
  nome: string;
  hora: number;
  min: number;
  lembretes: LembretesJogo;
};

export const JOGOS_SEMANAIS: JogoSlot[] = [
  {
    diaSemana: 2,
    nome: "Terça",
    hora: 20,
    min: 30,
    lembretes: { refeicao: "17:30", lanche: "19:15", ativacao: "19:30", aquecimento: "19:45" },
  },
  {
    diaSemana: 6,
    nome: "Sábado",
    hora: 14,
    min: 30,
    lembretes: { refeicao: "11:30", lanche: "13:15", ativacao: "13:00", aquecimento: "13:45" },
  },
];

export type OcorrenciaJogo = {
  slot: JogoSlot;
  /** data local do jogo (AAAA-MM-DD) */
  data: string;
  inicio: Date;
};

function ocorrencia(slot: JogoSlot, data: string): OcorrenciaJogo {
  return { slot, data, inicio: instanteSP(data, slot.hora, slot.min) };
}

/** Todas as ocorrências de jogo entre duas datas (inclusive), em ordem. */
export function jogosNoPeriodo(de: string, ate: string): OcorrenciaJogo[] {
  const lista: OcorrenciaJogo[] = [];
  for (let d = de; d <= ate; d = addDias(d, 1)) {
    const slot = JOGOS_SEMANAIS.find((j) => j.diaSemana === diaSemanaISO(d));
    if (slot) lista.push(ocorrencia(slot, d));
  }
  return lista;
}

/** Próximo jogo (ou o que está em andamento). */
export function proximoJogo(agora: Date): OcorrenciaJogo & { ms: number } {
  const hoje = dataISO(agora);
  for (const o of jogosNoPeriodo(addDias(hoje, -1), addDias(hoje, 8))) {
    const fim = o.inicio.getTime() + DURACAO_JOGO_MIN * MS_MIN;
    if (fim > agora.getTime()) return { ...o, ms: o.inicio.getTime() - agora.getTime() };
  }
  throw new Error("sem jogos configurados");
}

/** Jogo mais recente que já começou (até 8 dias atrás). */
export function ultimoJogo(agora: Date): OcorrenciaJogo | null {
  const hoje = dataISO(agora);
  const lista = jogosNoPeriodo(addDias(hoje, -8), hoje).filter((o) => o.inicio.getTime() <= agora.getTime());
  return lista.length ? lista[lista.length - 1] : null;
}

/** "em 1 d 3 h", "em 2 h 15 min", "em 40 min" ou "agora". */
export function contagemRegressiva(ms: number) {
  if (ms <= 0) return "agora";
  const totalMin = Math.floor(ms / MS_MIN);
  if (totalMin < 1) return "em menos de 1 min";
  const dias = Math.floor(totalMin / 1440);
  const horas = Math.floor((totalMin % 1440) / 60);
  const min = totalMin % 60;
  if (dias > 0) return horas > 0 ? `em ${dias} d ${horas} h` : `em ${dias} d`;
  if (horas > 0) return min > 0 ? `em ${horas} h ${min} min` : `em ${horas} h`;
  return `em ${min} min`;
}

/** O botão "Modo pré-jogo" fica ativo a partir de 4 h antes e até o início do jogo. */
export function preJogoAtivo(agora: Date, jogo: { inicio: Date }) {
  const ms = jogo.inicio.getTime() - agora.getTime();
  return ms > 0 && ms <= JANELA_PRE_JOGO_H * MS_HORA;
}

/** O "Como foi o jogo?" aparece quando o jogo acabou e fica por até 12 h após o início. */
export function posJogoDisponivel(agora: Date, jogo: { inicio: Date }) {
  const dep = agora.getTime() - jogo.inicio.getTime();
  return dep >= DURACAO_JOGO_MIN * MS_MIN && dep <= JANELA_POS_JOGO_H * MS_HORA;
}

export type Lembrete = { id: string; hora: string; titulo: string; texto: string };

/** Lembretes pré-jogo já "liberados" pelo horário e ainda antes do início do jogo. */
export function lembretesPreJogo(agora: Date, jogo: OcorrenciaJogo): Lembrete[] {
  if (agora.getTime() >= jogo.inicio.getTime()) return [];
  const l = jogo.slot.lembretes;
  const todos: Lembrete[] = [
    {
      id: "refeicao",
      hora: l.refeicao,
      titulo: "Refeição principal",
      texto: "Faça a refeição principal agora. Não pule a refeição antes do jogo.",
    },
    { id: "lanche", hora: l.lanche, titulo: "Lanche leve", texto: "Hora do lanche leve antes do jogo." },
    {
      id: "ativacao",
      hora: l.ativacao,
      titulo: "Ativação do tornozelo",
      texto: "Faça a ativação do tornozelo (10 a 12 min). Use a tornozeleira nas primeiras semanas.",
    },
    {
      id: "aquecimento",
      hora: l.aquecimento,
      titulo: "Aquecimento em campo",
      texto: "Vá para o aquecimento em campo: corrida leve e progressivas.",
    },
  ];
  return todos
    .filter((x) => {
      const [h, m] = x.hora.split(":").map(Number);
      return instanteSP(jogo.data, h, m).getTime() <= agora.getTime();
    })
    .sort((a, b) => a.hora.localeCompare(b.hora));
}
