// Regras da tela Hoje: a "próxima melhor ação" (18.2), um único botão dinâmico.
import type { EstadoJogo } from "./jogo";
import { blocoTreinavel, type Bloco, type DiaPlano, type Periodo } from "./seed/plano";
import { partesSP } from "./tempo";
import type { Checkin, Sessao } from "./tipos";

export type AcaoId = "checkin" | "aquecer" | "registrar_jogo" | "treino" | "checkin_jogo";

export type ProximaAcao = {
  id: AcaoId;
  rotulo: string;
  /** bloco de treino a iniciar, quando for o caso */
  blocoId?: string;
  /** data do jogo, quando a ação é sobre o jogo */
  jogoData?: string;
};

const ORDEM_PERIODO: Record<Periodo, number> = { manha: 0, tarde: 1, noite: 2, jogo: 2, dia: 0 };

function periodoAgora(hora: number): Periodo {
  if (hora < 12) return "manha";
  if (hora < 17) return "tarde";
  return "noite";
}

/** Próximo bloco de treino ainda sem registro, respeitando o período do dia. */
export function proximoBlocoPendente(dia: DiaPlano, sessoes: Sessao[], hora: number): Bloco | null {
  const pendentes = dia.blocos
    .filter(blocoTreinavel)
    .filter((b) => !sessoes.some((s) => s.data === dia.iso && s.bloco === b.id));
  if (!pendentes.length) return null;
  const agora = ORDEM_PERIODO[periodoAgora(hora)];
  return pendentes.find((b) => ORDEM_PERIODO[b.periodo] >= agora) ?? pendentes[0];
}

export function proximaMelhorAcao(entrada: {
  agora: Date;
  dia: DiaPlano;
  checkins: Checkin[];
  sessoes: Sessao[];
  jogo: EstadoJogo;
}): ProximaAcao | null {
  const { agora, dia, checkins, sessoes, jogo } = entrada;
  const { hora } = partesSP(agora);
  const feitoCheckin = checkins.some((c) => c.data === dia.iso);

  if (hora >= 6 && !feitoCheckin) return { id: "checkin", rotulo: "Fazer check-in" };

  const [antes, depois, seguinte] = jogo.passos;
  if (antes.estado === "ativo" && jogo.data === dia.iso) {
    return { id: "aquecer", rotulo: "Aquecer para o jogo", jogoData: jogo.data };
  }
  if (depois.estado === "ativo") {
    return { id: "registrar_jogo", rotulo: "Registrar o jogo", jogoData: jogo.data };
  }
  if (seguinte.estado === "ativo" && !jogo.checkinSeguinte) {
    return { id: "checkin_jogo", rotulo: "Como o tornozelo respondeu ao jogo?", jogoData: jogo.data };
  }

  const bloco = proximoBlocoPendente(dia, sessoes, hora);
  if (bloco) return { id: "treino", rotulo: "Iniciar treino", blocoId: bloco.id };
  return null;
}
