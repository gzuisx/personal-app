import {
  SEGURANCA_PADRAO,
  avaliarSeguranca,
  nivelDoCheckin,
  nivelPosJogoRecente,
  type CheckinSeg,
  type ConfigSeguranca,
  type JogoSeg,
  type NivelSeguranca,
} from "../safety";
import { diffDias } from "../tempo";

export type CorSemaforo = "verde" | "amarelo" | "vermelho" | "neutro";

export type ResultadoSemaforo = {
  cor: CorSemaforo;
  /** frase curta com o motivo, gerada do dado real */
  motivo: string;
  /** aviso quando ainda não há check-in de hoje */
  avisoCheckin: string | null;
  nivel: NivelSeguranca;
};

const COR: Record<NivelSeguranca, CorSemaforo> = {
  liberado: "verde",
  atencao: "amarelo",
  bloqueio: "vermelho",
  sem_dados: "neutro",
};

function quando(dias: number) {
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

export type EntradaSemaforo = {
  checkins: CheckinSeg[];
  jogos?: JogoSeg[];
  hoje: string;
  agora: Date;
  config?: ConfigSeguranca;
};

export function avaliarSemaforo(entrada: EntradaSemaforo): ResultadoSemaforo {
  const config = entrada.config ?? SEGURANCA_PADRAO;
  const seg = avaliarSeguranca({
    checkins: entrada.checkins,
    jogos: entrada.jogos,
    hoje: entrada.hoje,
    agora: entrada.agora,
    config,
  });
  const cor = COR[seg.nivel];

  const ultimo = [...entrada.checkins]
    .filter((c) => c.data <= entrada.hoje)
    .sort((a, b) => b.data.localeCompare(a.data))[0];

  if (!ultimo) {
    const posJogo = entrada.jogos?.find((j) => j.dor !== null);
    return {
      cor,
      nivel: seg.nivel,
      motivo:
        cor === "neutro"
          ? "Faça o primeiro check-in para ativar o semáforo."
          : `Dor ${posJogo?.dor ?? 0} de 10 depois do jogo.`,
      avisoCheckin: "Faça o check-in de hoje.",
    };
  }

  const idade = diffDias(ultimo.data, entrada.hoje);
  const q = quando(idade);
  const nivelCheckin = nivelDoCheckin(ultimo, config);
  const nivelJogo = entrada.jogos ? nivelPosJogoRecente(entrada.jogos, entrada.agora, config) : "liberado";
  const ordem = { liberado: 0, atencao: 1, bloqueio: 2 } as const;
  const jogoPesa = ordem[nivelJogo] > ordem[nivelCheckin];

  let motivo: string;
  if (jogoPesa) {
    const recente = (entrada.jogos ?? [])
      .filter((j) => j.dor !== null)
      .sort((a, b) => b.inicio.localeCompare(a.inicio))[0];
    motivo = `Dor ${recente?.dor ?? 0} de 10 depois do jogo.`;
  } else if (config.falhouBloqueia && ultimo.falhou) {
    motivo = `Tornozelo cedeu ${q}.`;
  } else if (config.inchacoBloqueia && ultimo.inchaco) {
    motivo = `Inchaço relatado ${q}.`;
  } else {
    motivo = `Dor ${ultimo.dor} de 10 ${q}.`;
  }

  return {
    cor,
    nivel: seg.nivel,
    motivo,
    avisoCheckin: ultimo.data === entrada.hoje ? null : "Faça o check-in de hoje.",
  };
}
