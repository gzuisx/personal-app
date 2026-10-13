// Agenda inteligente (seção 11): exceções do calendário e "só tenho X minutos".
import { CATALOGO_POR_ID, type ItemCatalogo } from "../seed/catalogo";
import {
  ehBlocoDeReabilitacao,
  type Bloco,
  type DiaPlano,
  type ExercicioNoBloco,
  type TipoExercicio,
} from "../seed/plano";
import { horaTexto, jogosNoPeriodo, type ExcecoesDeJogo } from "../tempo";
import { ROTULO_EXCECAO, type ExcecaoAgenda } from "../tipos";

/** Só as exceções que mexem em jogos, no formato que a lib de tempo entende. */
export function excecoesParaJogos(excecoes: ExcecaoAgenda[]): ExcecoesDeJogo {
  return {
    extras: excecoes
      .filter((e) => e.tipo === "jogo_extra")
      .map((e) => ({ data: e.data, hora: e.hora ?? null })),
    cancelados: excecoes.filter((e) => e.tipo === "jogo_cancelado").map((e) => e.data),
  };
}

export type DiaComExcecoes = {
  dia: DiaPlano;
  /** frases curtas para mostrar ao usuário ("Funcional cancelado hoje") */
  avisos: string[];
  /** ajuste do treino que a exceção pede (ex.: dia sem academia) */
  ajusteSugerido?: "sem_academia";
};

const TIPO_DO_CATALOGO: Record<ItemCatalogo["tipo"], TipoExercicio> = {
  tornozelo: "tornozelo",
  forca: "forca",
  core: "forca",
  velocidade: "velocidade",
  potencia: "velocidade",
  mobilidade: "mobilidade",
  bola: "funcional",
  visao: "funcional",
};

export function exercicioDoCatalogo(slug: string): ExercicioNoBloco | null {
  const c = CATALOGO_POR_ID[slug];
  if (!c) return null;
  return {
    slug: c.id,
    nome: c.nome,
    grupo: c.grupo,
    tipo: TIPO_DO_CATALOGO[c.tipo],
    observacoes: c.cuidado,
    mediaUrl: c.midia,
    series: String(c.series),
    repeticoes: c.reps,
  };
}

/** Aplica as exceções de um dia (funcional cancelado, jogo extra ou cancelado, exercícios acrescentados ou trocados). */
export function aplicarExcecoesAoDia(dia: DiaPlano, excecoes: ExcecaoAgenda[]): DiaComExcecoes {
  const doDia = excecoes.filter((e) => e.data === dia.iso);
  if (!doDia.length) return { dia, avisos: [] };

  let blocos = dia.blocos.map((b) => ({ ...b, exercicios: [...b.exercicios] }));
  let jogo = dia.jogo;
  const avisos: string[] = [];
  let ajusteSugerido: DiaComExcecoes["ajusteSugerido"];

  for (const e of doDia) {
    switch (e.tipo) {
      case "funcional_cancelado":
        if (blocos.some((b) => b.instrutor)) {
          blocos = blocos.filter((b) => !b.instrutor);
          avisos.push("Funcional cancelado hoje.");
        }
        break;
      case "sem_academia":
      case "viagem":
        ajusteSugerido = "sem_academia";
        avisos.push(e.tipo === "viagem" ? "Viagem: treino sem academia." : "Dia sem academia.");
        break;
      case "trabalho_presencial_extra":
        avisos.push("Trabalho presencial extra: treino de manhã ou à noite, com menos tempo.");
        break;
      case "feriado":
        avisos.push("Feriado.");
        break;
      case "jogo_cancelado":
        if (blocos.some((b) => b.tags.includes("Jogo")) || jogo) {
          blocos = blocos.filter((b) => !b.tags.includes("Jogo"));
          jogo = null;
          avisos.push("Jogo cancelado.");
        }
        break;
      case "jogo_extra": {
        const o = jogosNoPeriodo(dia.iso, dia.iso, { extras: [{ data: dia.iso, hora: e.hora }] })[0];
        if (o) {
          jogo = o.slot;
          if (!blocos.some((b) => b.tags.includes("Jogo"))) {
            blocos.push({
              id: `${dia.iso}-jogo-extra`,
              periodo: "jogo",
              titulo: "Jogo extra",
              duracaoMin: 80,
              horario: horaTexto(o.slot.hora, o.slot.min),
              tags: ["Jogo"],
              exercicios: [],
              observacao: "Jogo extra no calendário.",
            });
          }
          avisos.push(`Jogo extra às ${horaTexto(o.slot.hora, o.slot.min)}.`);
        }
        break;
      }
      case "exercicio_extra":
      case "exercicio_trocado": {
        const novo = e.slug ? exercicioDoCatalogo(e.slug) : null;
        if (!novo) break;
        const alvo =
          blocos.find((b) => b.id === e.bloco) ??
          blocos.find((b) => b.tags.includes("Força") && b.exercicios.length) ??
          blocos.find((b) => b.exercicios.length);
        if (!alvo) break;
        if (e.tipo === "exercicio_extra") {
          if (!alvo.exercicios.some((x) => x.slug === novo.slug)) alvo.exercicios.push(novo);
          avisos.push(`Acrescentado: ${novo.nome}.`);
        } else if (e.substitui) {
          const i = alvo.exercicios.findIndex((x) => x.slug === e.substitui);
          if (i >= 0) {
            alvo.exercicios[i] = { ...novo, series: alvo.exercicios[i].series ?? novo.series };
            avisos.push(`Trocado por ${novo.nome}.`);
          }
        }
        break;
      }
    }
  }

  return { dia: { ...dia, blocos, jogo }, avisos, ajusteSugerido };
}

// ---------------------------------------------------------------- "só tenho X minutos" (11.2)

export const MINUTOS_DISPONIVEIS = [15, 20, 30, 45] as const;

const tempoDoItem = (series: number, descansoS: number, exec = 40) =>
  series * exec + Math.max(0, series - 1) * descansoS;

/**
 * Monta o essencial do dia para o tempo disponível: tornozelo (até cerca de 40% do tempo, mínimo de 6 a 8 min
 * quando couber), 1 exercício principal e 1 acessório. Usa só exercícios que já estão no plano.
 */
export function montarEssencial(blocos: Bloco[], minutos: number): Bloco[] {
  const orcamento = minutos * 60;
  const tornozelo = blocos.filter((b) => ehBlocoDeReabilitacao(b) && b.exercicios.length);
  const principais = blocos.filter(
    (b) => !ehBlocoDeReabilitacao(b) && b.exercicios.length && !b.instrutor && !b.tags.includes("Jogo"),
  );
  const saida: Bloco[] = [];
  let usado = 0;

  const estimativa = (e: ExercicioNoBloco) => {
    const c = CATALOGO_POR_ID[e.slug];
    const series = Math.max(1, Math.min(Number(e.series ?? c?.series ?? 1), 2));
    return tempoDoItem(series, c?.descansoS ?? 45, c?.tempoS ?? 40);
  };

  const reduz = (e: ExercicioNoBloco): ExercicioNoBloco => ({
    ...e,
    series: String(Math.max(1, Math.min(Number(e.series ?? 1), 2))),
  });

  const limiteTornozelo = Math.max(6 * 60, orcamento * 0.4);
  for (const b of tornozelo) {
    const itens: ExercicioNoBloco[] = [];
    let soma = 0;
    for (const e of b.exercicios) {
      const t = estimativa(e);
      if (itens.length > 0 && (soma + t > limiteTornozelo || usado + soma + t > orcamento)) continue;
      itens.push(reduz(e));
      soma += t;
    }
    if (itens.length) {
      saida.push({
        ...b,
        titulo: `${b.titulo} (essencial)`,
        exercicios: itens,
        duracaoMin: Math.max(1, Math.round(soma / 60)),
      });
      usado += soma;
    }
  }

  for (const b of principais) {
    const itens: ExercicioNoBloco[] = [];
    let soma = 0;
    for (const e of b.exercicios.slice(0, 2)) {
      const t = estimativa(e);
      if (itens.length > 0 && usado + soma + t > orcamento) break;
      itens.push(reduz(e));
      soma += t;
    }
    if (itens.length) {
      saida.push({
        ...b,
        titulo: `${b.titulo} (essencial)`,
        exercicios: itens,
        duracaoMin: Math.max(1, Math.round(soma / 60)),
      });
      usado += soma;
    }
    if (usado >= orcamento) break;
  }

  return saida;
}

export const rotuloExcecao = (e: ExcecaoAgenda) =>
  e.tipo === "jogo_extra" && e.hora ? `${ROTULO_EXCECAO[e.tipo]} às ${e.hora}` : ROTULO_EXCECAO[e.tipo];
