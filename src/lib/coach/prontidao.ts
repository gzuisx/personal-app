// Prontidão do dia (seção 3.3): pontuação INTERNA de 0 a 100, usada só para escolher o modo do dia.
// Os pesos são um ponto de partida razoável, não ciência exata: precisam de calibração com dados reais.
import { dorDoCheckin, nivelDoCheckin, type ConfigSeguranca } from "../safety";
import { diffDias } from "../tempo";
import { SONO_ROTULO, type Checkin, type SonoFaixa } from "../tipos";
import type { VariacaoCarga } from "./carga";
import type { ComponenteProntidao, ModoDia, Prontidao } from "./tipos";

/** Pontos descontados por faixa de sono. */
export const DESCONTO_SONO: Record<SonoFaixa, number> = { menos_5: -20, "5_6": -12, "7_8": 0, mais_8: 0 };

export const BASE = 100;
export const TETO_SOBRESCRITA = 40;
export const DESCONTO_SEM_CHECKIN_HOJE = -10;
/** Pontuação assumida quando não há nenhum check-in (nem antigo). */
export const PRONTIDAO_SEM_DADOS = 70;

export type EntradaProntidao = {
  checkins: Checkin[];
  hoje: string;
  config: ConfigSeguranca;
  carga: Pick<VariacaoCarga, "variacao" | "suficiente">;
  horasDesdeUltimoJogo: number | null;
};

const arredonda = (n: number) => Math.round(n);

export function calcularProntidao(e: EntradaProntidao): Prontidao {
  const ultimo =
    [...e.checkins].filter((c) => c.data <= e.hoje).sort((a, b) => b.data.localeCompare(a.data))[0] ?? null;

  const componentes: ComponenteProntidao[] = [];

  if (!ultimo) {
    return {
      pontuacao: PRONTIDAO_SEM_DADOS,
      componentes: [
        {
          id: "sem_dados",
          rotulo: "Sem check-in",
          pontos: PRONTIDAO_SEM_DADOS - BASE,
          detalhe: "Nenhum check-in ainda: pontuação estimada.",
        },
      ],
      sobrescrita: null,
      checkinDeHoje: false,
      dataDoCheckin: null,
    };
  }

  const deHoje = ultimo.data === e.hoje;

  // dor: -4 por ponto (0 a -40)
  // com outro foco de lesão, vale a pior dor entre o foco e o tornozelo
  const dor = dorDoCheckin(ultimo);
  componentes.push({
    id: "dor",
    rotulo: ultimo.dorTornozelo === null || ultimo.dorTornozelo === undefined ? "Dor no tornozelo" : "Dor",
    pontos: -(dor * 4),
    detalhe: `Dor ${dor} de 10`,
  });

  // sono
  if (ultimo.sonoFaixa) {
    componentes.push({
      id: "sono",
      rotulo: "Sono",
      pontos: DESCONTO_SONO[ultimo.sonoFaixa],
      detalhe: `Sono ${SONO_ROTULO[ultimo.sonoFaixa]}`,
    });
  }

  // energia: -3,75 por ponto abaixo de 5 (0 a -15)
  if (ultimo.energia !== null) {
    componentes.push({
      id: "energia",
      rotulo: "Energia",
      pontos: -((5 - ultimo.energia) * 3.75),
      detalhe: `Energia ${ultimo.energia} de 5`,
    });
  }

  // carga dos últimos 7 dias contra a média das 4 semanas anteriores
  if (e.carga.suficiente && e.carga.variacao !== null) {
    const v = e.carga.variacao;
    const pontos = v > 1.3 ? -15 : v >= 1.15 ? -8 : 0;
    if (pontos !== 0) {
      componentes.push({
        id: "carga",
        rotulo: "Carga da semana",
        pontos,
        detalhe: `Carga ${String(v.toFixed(2)).replace(".", ",")} vez(es) a média das 4 semanas anteriores`,
      });
    }
  }

  // tempo desde o último jogo
  if (e.horasDesdeUltimoJogo !== null && e.horasDesdeUltimoJogo >= 0) {
    const h = e.horasDesdeUltimoJogo;
    const pontos = h < 24 ? -10 : h < 48 ? -5 : 0;
    if (pontos !== 0) {
      componentes.push({
        id: "jogo",
        rotulo: "Jogo recente",
        pontos,
        detalhe: `Último jogo há ${Math.floor(h)} h`,
      });
    }
  }

  if (!deHoje) {
    const dias = diffDias(ultimo.data, e.hoje);
    componentes.push({
      id: "sem_checkin",
      rotulo: "Sem check-in hoje",
      pontos: DESCONTO_SEM_CHECKIN_HOJE,
      detalhe: `Usei o último check-in (${dias === 1 ? "ontem" : `há ${dias} dias`}) com 10 pontos a menos`,
    });
  }

  let pontuacao = BASE + componentes.reduce((s, c) => s + c.pontos, 0);

  // sobrescrita de segurança: inchaço, falha ou dor no limite de bloqueio
  let sobrescrita: Prontidao["sobrescrita"] = null;
  if (nivelDoCheckin(ultimo, e.config) === "bloqueio") {
    const motivo =
      e.config.falhouBloqueia && ultimo.falhou
        ? "o tornozelo cedeu"
        : e.config.inchacoBloqueia && ultimo.inchaco
          ? "houve inchaço"
          : `a dor chegou a ${dor}`;
    sobrescrita = { motivo, teto: TETO_SOBRESCRITA };
    pontuacao = Math.min(pontuacao, TETO_SOBRESCRITA);
  }

  return {
    pontuacao: Math.max(0, Math.min(100, arredonda(pontuacao))),
    componentes,
    sobrescrita,
    checkinDeHoje: deHoje,
    dataDoCheckin: ultimo.data,
  };
}

/** Faixas do modo do dia (3.5): 75+ Completo, 55 a 74 Reduzido, 35 a 54 Recuperação, abaixo de 35 Folga. */
export function modoDaProntidao(pontuacao: number): ModoDia {
  if (pontuacao >= 75) return "completo";
  if (pontuacao >= 55) return "reduzido";
  if (pontuacao >= 35) return "recuperacao";
  return "folga";
}
