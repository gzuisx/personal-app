// Catálogo de regras (seção 4): cada regra olha o contexto e, se disparar, diz o que muda e por quê.
// R01 a R18. Todas são funções puras. Nenhuma regra libera progressão quando a segurança bloqueia.
import { ALERTA_SEGURANCA } from "../safety";
import { CATALOGO_POR_ID, usaCargaExterna } from "../seed/catalogo";
import { nomeDoFoco, treinosPlanejados } from "../seed/plano";
import { addDias, dataISO, diffDias, instanteSP, ultimoJogo } from "../tempo";
import { SONO_ROTULO, type Checkin } from "../tipos";
import { parseAlvo } from "../treino/motor";
import { excecoesParaJogos } from "./agenda";
import { categoriaDoBloco, variacaoDeCarga } from "./carga";
import { avaliarFaseDoFoco, AVISO_FASE } from "./fase";
import { calcularProntidao, modoDaProntidao } from "./prontidao";
import { sugerirProgressao, type SerieHistorica } from "./progressao";
import type { CoachContext, Efeitos, PorQue, Prontidao, PropostaSugerida, RegraDisparada } from "./tipos";

export type ResultadoRegra = { mensagem: string; porque: PorQue; efeitos: Efeitos };
export type RegraDef = {
  id: string;
  titulo: string;
  avaliar: (ctx: CoachContext, p: Prontidao) => ResultadoRegra | null;
};

const MS_HORA = 3_600_000;
const dataBR = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;

function ultimoCheckinAte(ctx: CoachContext): Checkin | null {
  return (
    [...ctx.checkins].filter((c) => c.data <= ctx.hoje).sort((a, b) => b.data.localeCompare(a.data))[0] ??
    null
  );
}

/** Prontidão que o app teria calculado em um dia passado (para a regra R07). */
export function prontidaoDoDia(ctx: CoachContext, iso: string): Prontidao {
  const fimDoDia = instanteSP(iso, 23, 59);
  const ult = ultimoJogo(fimDoDia, excecoesParaJogos(ctx.excecoes));
  return calcularProntidao({
    checkins: ctx.checkins.filter((c) => c.data <= iso),
    hoje: iso,
    config: ctx.config,
    carga: variacaoDeCarga(ctx.sessoes, ctx.jogos, iso),
    horasDesdeUltimoJogo: ult ? (fimDoDia.getTime() - ult.inicio.getTime()) / MS_HORA : null,
  });
}

// ---------------------------------------------------------------- R01 a R18

const R01: RegraDef = {
  id: "R01",
  titulo: "Dor forte, inchaço ou o tornozelo falhou",
  avaliar(ctx) {
    if (ctx.seguranca.nivel !== "bloqueio") return null;
    const c = ultimoCheckinAte(ctx);
    return {
      mensagem:
        "Alerta de segurança: hoje o treino fica em recuperação, sem carga alta, velocidade nem saltos.",
      porque: {
        dados: [
          c
            ? `Check-in de ${dataBR(c.data)}: dor ${c.dor} de 10${c.inchaco ? ", com inchaço" : ""}${c.falhou ? ", o tornozelo cedeu" : ""}`
            : "Dor forte depois do jogo",
          ctx.seguranca.motivoBloqueio ? `Motivo do bloqueio: ${ctx.seguranca.motivoBloqueio}` : "",
        ].filter(Boolean),
        mudaria:
          "Volta ao normal quando um check-in novo vier com dor até 3, sem inchaço e sem falha, e passarem 3 dias sem novo bloqueio.",
      },
      efeitos: {
        modoMax: "recuperacao",
        bloqueiaProgressao: true,
        semPliometria: true,
        semVelocidade: true,
        ajustes: ["Sem saltos, sem velocidade e sem aumento de carga hoje."],
        alertas: [{ regra: "R01", severidade: "alto", texto: ALERTA_SEGURANCA }],
        planoSugerido: "P4",
        acoes: [
          {
            id: "plano_de_retorno",
            regra: "R01",
            titulo: "Plano de retorno",
            texto: "Sete dias leves: tornozelo todo dia, caminhada e mobilidade. Quer ver?",
          },
        ],
      },
    };
  },
};

const R02: RegraDef = {
  id: "R02",
  titulo: "Dor moderada (4 a 5)",
  avaliar(ctx) {
    if (ctx.seguranca.nivel !== "atencao") return null;
    const c = ultimoCheckinAte(ctx);
    if (!c || diffDias(c.data, ctx.hoje) > 1) return null;
    return {
      mensagem: "Dor moderada: treino reduzido, sem aumentar a carga e com menos impacto.",
      porque: {
        dados: [`Check-in de ${dataBR(c.data)}: dor ${c.dor} de 10`],
        mudaria: "Volta ao modo completo quando o check-in vier com dor até 3, sem inchaço e sem falha.",
      },
      efeitos: {
        modoMax: "reduzido",
        bloqueiaProgressao: true,
        substituicoes: ["Troque exercícios de impacto por isometria e equilíbrio no chão."],
        acoes: c.movimentos?.length
          ? []
          : [
              {
                id: "perguntar_movimento",
                regra: "R02",
                titulo: "Qual movimento doeu?",
                texto: "Conte onde e em qual movimento doeu. Isso ajuda a escolher os exercícios de hoje.",
                opcoes: ["Virar para dentro", "Virar para fora", "Chutar", "Correr", "Saltar", "Apoiar"],
              },
            ],
      },
    };
  },
};

const R03: RegraDef = {
  id: "R03",
  titulo: "Sono curto por 2 dias seguidos",
  avaliar(ctx) {
    const lista = [...ctx.checkins].filter((c) => c.sonoFaixa).sort((a, b) => b.data.localeCompare(a.data));
    const [a, b] = lista;
    if (!a || !b) return null;
    if (a.sonoFaixa !== "menos_5" || b.sonoFaixa !== "menos_5") return null;
    if (diffDias(b.data, a.data) !== 1 || diffDias(a.data, ctx.hoje) > 1) return null;
    return {
      mensagem: "Você dormiu menos de 5 h por 2 dias seguidos: treino reduzido e sem sprint máximo.",
      porque: {
        dados: [
          `Sono de ${dataBR(b.data)}: ${SONO_ROTULO.menos_5}`,
          `Sono de ${dataBR(a.data)}: ${SONO_ROTULO.menos_5}`,
        ],
        mudaria: "Volta ao normal depois de uma noite com 7 h ou mais.",
      },
      efeitos: {
        modoMax: "reduzido",
        semSprintMaximo: true,
        ajustes: ["Sem sprint máximo hoje."],
        acoes: [
          {
            id: "priorizar_sono",
            regra: "R03",
            titulo: "Priorize dormir hoje",
            texto: "Meta: ir para a cama no horário combinado e dormir 7 h ou mais.",
          },
        ],
      },
    };
  },
};

const R04: RegraDef = {
  id: "R04",
  titulo: "Jogo pesado e dor depois",
  avaliar(ctx) {
    const j = ctx.ultimoJogoRegistrado;
    if (!j || (j.esforco ?? 0) < 8 || (j.dor ?? 0) < 4) return null;
    if (ctx.horasDesdeUltimoJogo === null || ctx.horasDesdeUltimoJogo > 36) return null;
    return {
      mensagem: "O jogo foi pesado e o tornozelo doeu depois: hoje é recuperação, com foco no tornozelo.",
      porque: {
        dados: [`Último jogo: esforço ${j.esforco} de 10 e dor depois ${j.dor} de 10`],
        mudaria: "Amanhã volta ao normal se o check-in vier com dor até 3.",
      },
      efeitos: {
        modoMax: "recuperacao",
        substituicoes: ["Mobilidade e caminhada leve no lugar dos exercícios fortes."],
        acoes: [
          {
            id: "foco_tornozelo",
            regra: "R04",
            titulo: "Foco no tornozelo",
            texto: "Faça a rotina de tornozelo leve, mobilidade e uma caminhada.",
          },
        ],
      },
    };
  },
};

const R05: RegraDef = {
  id: "R05",
  titulo: "Duas sessões seguidas sem fazer",
  avaliar(ctx) {
    const recentes = [...ctx.sessoes]
      .sort((a, b) => b.data.localeCompare(a.data) || b.bloco.localeCompare(a.bloco))
      .slice(0, 2);
    if (recentes.length < 2 || !recentes.every((s) => s.resultado === "nao_fiz")) return null;
    if (diffDias(recentes[0].data, ctx.hoje) > 7) return null;
    return {
      mensagem: "Você marcou 'não fiz' duas vezes seguidas. O que aconteceu?",
      porque: {
        dados: recentes.map((s) => `Sessão de ${dataBR(s.data)}: não fiz`),
        mudaria: "A pergunta some depois da próxima sessão feita.",
      },
      efeitos: {
        acoes: [
          {
            id: "perguntar_motivo",
            regra: "R05",
            titulo: "O que atrapalhou?",
            texto: "Escolha o motivo e eu ajusto o que for possível.",
            opcoes: ["Sem tempo", "Cansado", "Dor", "Agenda", "Outro"],
          },
        ],
      },
    };
  },
};

/** Aderência da última semana: sessões feitas (parcial vale 0,5) sobre as planejadas. */
export function aderenciaDaSemana(ctx: CoachContext) {
  let planejadas = 0;
  let feitas = 0;
  for (let i = 0; i < 7; i++) {
    const iso = addDias(ctx.hoje, -i);
    const n = treinosPlanejados(iso);
    if (iso === ctx.hoje && !ctx.sessoes.some((s) => s.data === iso)) continue; // hoje ainda pode ser feito
    planejadas += n;
    for (const s of ctx.sessoes.filter((x) => x.data === iso)) {
      feitas += s.resultado === "feito" ? 1 : s.resultado === "parcial" ? 0.5 : 0;
    }
  }
  feitas = Math.min(feitas, planejadas);
  return { planejadas, feitas, taxa: planejadas ? feitas / planejadas : 0 };
}

/** Exercícios com carga que fecharam o topo da faixa em 2 sessões (6.1). */
export function candidatosDeProgressao(ctx: CoachContext, prontidaoOk: boolean): PropostaSugerida[] {
  const slugs = [...new Set(ctx.series.map((s) => s.exercicio))];
  const propostas: PropostaSugerida[] = [];
  for (const slug of slugs) {
    const cat = CATALOGO_POR_ID[slug];
    if (!cat || !usaCargaExterna(cat)) continue;
    const alvo = parseAlvo(cat.reps);
    if (alvo.kind !== "reps") continue;
    const historico: SerieHistorica[] = ctx.series
      .filter((s) => s.exercicio === slug)
      .map((s) => ({
        data: s.data,
        numero: s.numero,
        reps: s.reps,
        cargaKg: s.cargaKg,
        esforco: s.esforco,
        dorDurante: s.dorDurante,
      }));
    const r = sugerirProgressao({
      series: historico,
      faixa: { min: alvo.min, max: alvo.max },
      seriesPlano: cat.series,
      podeProgredir: ctx.seguranca.podeProgredir,
      prontidaoOk,
    });
    if (r.acao !== "subir" || r.sugeridaKg === null) continue;
    propostas.push({
      tipo: "progressao_carga",
      regra: "R06",
      titulo: `Subir a carga: ${cat.nome}`,
      resumo: r.motivo,
      chave: `carga:${slug}:${r.sugeridaKg}`,
      criterios: r.checklist,
      payload: { slug, nome: cat.nome, deKg: r.cargaAtualKg, paraKg: r.sugeridaKg },
    });
  }
  return propostas.slice(0, 3);
}

const R06: RegraDef = {
  id: "R06",
  titulo: "Semana completa: hora de evoluir",
  avaliar(ctx, p) {
    if (!ctx.seguranca.podeProgredir) return null;
    const c = ultimoCheckinAte(ctx);
    if (!c || c.dor > 3 || ctx.diasVerdes < 7) return null;
    const ad = aderenciaDaSemana(ctx);
    if (ad.planejadas === 0 || ad.taxa < 0.9) return null;
    const propostas = candidatosDeProgressao(ctx, p.pontuacao >= 75);
    if (!propostas.length) return null;
    return {
      mensagem: `Semana quase completa (${Math.round(ad.taxa * 100)}% das sessões), tornozelo bem e 7 dias verdes: há ${propostas.length === 1 ? "uma proposta" : `${propostas.length} propostas`} de progressão.`,
      porque: {
        dados: [
          `Sessões da semana: ${ad.feitas} de ${ad.planejadas} planejadas`,
          `Dor do último check-in: ${c.dor} de 10`,
          `Dias verdes seguidos: ${ctx.diasVerdes}`,
        ],
        mudaria: "A proposta some se a segurança bloquear ou se a dor passar de 3.",
      },
      efeitos: { propostas },
    };
  },
};

const R07: RegraDef = {
  id: "R07",
  titulo: "Cansaço acumulado: semana de descarga",
  avaliar(ctx) {
    // a) prontidão média abaixo de 55 por 5 dias
    const dias = Array.from({ length: 5 }, (_, i) => addDias(ctx.hoje, -i));
    const comCheckin = dias.filter((d) => ctx.checkins.some((c) => c.data === d));
    const media = dias.reduce((s, d) => s + prontidaoDoDia(ctx, d).pontuacao, 0) / dias.length;
    const baixa = comCheckin.length >= 3 && media < 55;
    // b) 3 semanas seguidas de carga crescente (> 1,15)
    const j = ctx.carga.janelas;
    const cresce = (a: number, b: number) => b > 0 && a > b * 1.15;
    const crescente =
      j.length >= 4 &&
      cresce(j[0].total, j[1].total) &&
      cresce(j[1].total, j[2].total) &&
      cresce(j[2].total, j[3].total);
    if (!baixa && !crescente) return null;
    const inicio = ctx.hoje;
    const fim = addDias(ctx.hoje, 6);
    const prop: PropostaSugerida = {
      tipo: "descarga",
      regra: "R07",
      titulo: "Semana de descarga",
      resumo: "Uma semana com 40% menos volume, tornozelo mantido, velocidade curta e funcional leve.",
      chave: `descarga:${ctx.hoje.slice(0, 7)}:${baixa ? "prontidao" : "carga"}`,
      criterios: [
        {
          texto: "Prontidão média abaixo de 55 por 5 dias",
          ok: baixa,
          progresso: `média ${Math.round(media)} (pontuação interna)`,
        },
        { texto: "3 semanas seguidas com carga crescendo mais de 15%", ok: crescente },
      ],
      payload: { template: "P3", inicio, fim },
    };
    return {
      mensagem: baixa
        ? "A prontidão ficou baixa por 5 dias seguidos: vale uma semana de descarga."
        : "A carga cresceu mais de 15% por 3 semanas seguidas: vale uma semana de descarga.",
      porque: {
        dados: baixa
          ? [
              `Prontidão média dos últimos 5 dias: ${Math.round(media)} (pontuação interna do app; não é medida fisiológica)`,
            ]
          : [
              `Carga das últimas 4 semanas: ${j
                .map((x) => Math.round(x.total))
                .reverse()
                .join(", ")}`,
            ],
        mudaria: "Some se a prontidão voltar a subir ou se a carga se estabilizar.",
      },
      efeitos: { propostas: [prop], planoSugerido: "P3" },
    };
  },
};

const R08: RegraDef = {
  id: "R08",
  titulo: "Jogo extra ou cancelado",
  avaliar(ctx) {
    const proximas = ctx.excecoes.filter(
      (e) =>
        (e.tipo === "jogo_extra" || e.tipo === "jogo_cancelado") &&
        e.data >= ctx.hoje &&
        e.data <= addDias(ctx.hoje, 7),
    );
    if (!proximas.length) return null;
    return {
      mensagem: proximas
        .map((e) =>
          e.tipo === "jogo_extra" ? `Jogo extra em ${dataBR(e.data)}` : `Jogo cancelado em ${dataBR(e.data)}`,
        )
        .join(". ")
        .concat(": a carga dos dias vizinhos foi recalculada."),
      porque: {
        dados: proximas.map(
          (e) => `${dataBR(e.data)}: ${e.tipo === "jogo_extra" ? "jogo extra" : "jogo cancelado"}`,
        ),
        mudaria: "Volta ao calendário normal se você remover a exceção em Semana > Ajustar semana.",
      },
      efeitos: {
        recalcularCarga: true,
        ajustes: ["O dia antes de um jogo fica mais leve; o dia seguinte, de recuperação."],
      },
    };
  },
};

const R09: RegraDef = {
  id: "R09",
  titulo: "Aquecimento e dor depois do jogo",
  avaliar(ctx) {
    const j = ctx.ultimoJogoRegistrado;
    if (!j || ctx.horasDesdeUltimoJogo === null || ctx.horasDesdeUltimoJogo > 72) return null;
    const data = dataISO(new Date(j.inicio));
    const log = ctx.preJogos.find((p) => p.jogoData === data);
    if (!log) return null;
    return {
      mensagem: `${log.concluido ? "Aquecimento completo" : "Aquecimento incompleto"} antes do último jogo; dor depois: ${j.dor} de 10.`,
      porque: {
        dados: [
          `Aquecimento de ${dataBR(data)}: ${log.concluido ? "completo" : `${log.fasesConcluidas} de 5 fases`}`,
          `Dor depois do jogo: ${j.dor} de 10`,
        ],
        mudaria:
          "Com mais jogos registrados, o app compara a dor com e sem aquecimento completo (aba Insights).",
      },
      efeitos: {},
    };
  },
};

const R10: RegraDef = {
  id: "R10",
  titulo: "Desempenho caiu no teste de campo",
  avaliar(ctx) {
    const grupos = new Map<string, typeof ctx.testes>();
    for (const t of ctx.testes) {
      const chave = `${t.tipo}|${t.pe ?? ""}|${t.subtipo ?? ""}`;
      grupos.set(chave, [...(grupos.get(chave) ?? []), t]);
    }
    const quedas: string[] = [];
    for (const lista of grupos.values()) {
      const [novo, antigo] = [...lista].sort((a, b) => b.data.localeCompare(a.data));
      if (!novo || !antigo || antigo.valor === 0) continue;
      const pior = novo.menorEhMelhor ? novo.valor > antigo.valor * 1.05 : novo.valor < antigo.valor * 0.95;
      if (pior)
        quedas.push(
          `${novo.tipo}${novo.pe ? ` (${novo.pe})` : ""}: ${antigo.valor} → ${novo.valor} ${novo.unidade}`,
        );
    }
    if (!quedas.length) return null;
    return {
      mensagem:
        "O desempenho caiu 5% ou mais em um teste de campo. Confira o sono e a carga antes de evoluir.",
      porque: {
        dados: quedas,
        mudaria: "Some quando o próximo teste voltar a ficar dentro de 5% do anterior.",
      },
      efeitos: {
        bloqueiaProgressao: true,
        alertas: [
          {
            regra: "R10",
            severidade: "aviso",
            texto: "Desempenho caiu em um teste: a progressão fica adiada.",
          },
        ],
        acoes: [
          {
            id: "checar_sono_carga",
            regra: "R10",
            titulo: "Confira sono e carga",
            texto: "Veja se dormiu pouco ou se a carga da semana subiu demais.",
          },
        ],
      },
    };
  },
};

const R11: RegraDef = {
  id: "R11",
  titulo: "Doeu durante um exercício",
  avaliar(ctx) {
    const doeu = ctx.series.filter((s) => s.data === ctx.hoje && (s.dorDurante ?? 0) > 3);
    if (!doeu.length) return null;
    const pior = Math.max(...doeu.map((s) => s.dorDurante ?? 0));
    const nome = CATALOGO_POR_ID[doeu[0].exercicio]?.nome ?? doeu[0].exercicio;
    const jaFezCheckin = ctx.checkins.some((c) => c.data === ctx.hoje);
    return {
      mensagem:
        pior >= 6
          ? `Dor forte (${pior}) em "${nome}": o treino de hoje termina aqui e vale fazer o check-in.`
          : `Doeu em "${nome}" (${pior}): use a versão mais leve nos próximos treinos.`,
      porque: {
        dados: doeu.map(
          (s) =>
            `${CATALOGO_POR_ID[s.exercicio]?.nome ?? s.exercicio}, série ${s.numero}: dor ${s.dorDurante}`,
        ),
        mudaria: "Some amanhã, se o check-in vier com dor até 3.",
      },
      efeitos: {
        ...(pior >= 6
          ? { modoMax: "recuperacao" as const, bloqueiaProgressao: true }
          : { bloqueiaProgressao: true }),
        substituicoes: ["Troque o exercício que doeu pela versão mais leve."],
        acoes:
          pior >= 6 && !jaFezCheckin
            ? [
                {
                  id: "abrir_checkin",
                  regra: "R11",
                  titulo: "Faça o check-in",
                  texto: "Registre a dor e o que aconteceu.",
                },
              ]
            : [],
      },
    };
  },
};

const R12: RegraDef = {
  id: "R12",
  titulo: "Funcional pesado ontem",
  avaliar(ctx) {
    const ontem = addDias(ctx.hoje, -1);
    const pesada = ctx.sessoes.find(
      (s) =>
        s.data === ontem &&
        (s.resultado === "feito" || s.resultado === "parcial") &&
        (s.esforco ?? 0) >= 8 &&
        categoriaDoBloco(s.bloco, s.data).categoria === "Funcional",
    );
    if (!pesada) return null;
    return {
      mensagem: "O funcional de ontem foi pesado (esforço 8 ou mais): hoje o treino fica reduzido.",
      porque: {
        dados: [`Funcional de ${dataBR(ontem)}: esforço ${pesada.esforco} de 10`],
        mudaria: "Amanhã volta ao normal se o esforço do funcional ficar abaixo de 8.",
      },
      efeitos: { modoMax: "reduzido", ajustes: ["Uma série a menos nos exercícios de força."] },
    };
  },
};

const R13: RegraDef = {
  id: "R13",
  titulo: "Meta de sono da semana",
  avaliar(ctx) {
    const desde = addDias(ctx.hoje, -6);
    const noites = ctx.checkins.filter((c) => c.data >= desde && c.data <= ctx.hoje && c.sonoFaixa);
    const boas = noites.filter((c) => c.sonoFaixa === "7_8" || c.sonoFaixa === "mais_8").length;
    if (boas < 5) return null;
    return {
      mensagem: `Meta de sono atingida: ${boas} de 7 noites com 7 h ou mais.`,
      porque: {
        dados: [`${boas} noites com 7 h ou mais nos últimos 7 dias`],
        mudaria: "Aparece de novo toda semana em que você dormir 7 h ou mais em 5 das 7 noites.",
      },
      efeitos: { reconhecimento: `Meta de sono atingida: ${boas} de 7 noites com 7 h ou mais.` },
    };
  },
};

const R14: RegraDef = {
  id: "R14",
  titulo: "Marco da Jornada atingido",
  avaliar(ctx) {
    if (!ctx.marcosDetectados.length) return null;
    return {
      mensagem: "Um marco da sua Jornada foi atingido. Confirme na Evolução para registrar.",
      porque: {
        dados: ctx.marcosDetectados,
        mudaria: "O marco só vira concluído depois que você confirmar.",
      },
      efeitos: { marcos: ctx.marcosDetectados },
    };
  },
};

const R15: RegraDef = {
  id: "R15",
  titulo: "Sem check-in há 3 dias",
  avaliar(ctx) {
    const c = ultimoCheckinAte(ctx);
    if (!c || diffDias(c.data, ctx.hoje) < 3) return null;
    return {
      mensagem: "Faz alguns dias sem check-in. Como está seu tornozelo?",
      porque: {
        dados: [`Último check-in: ${dataBR(c.data)}`],
        mudaria: "Some com um novo check-in.",
      },
      efeitos: {
        acoes: [
          {
            id: "checkin_leve",
            regra: "R15",
            titulo: "Como está seu tornozelo?",
            texto: "Sem pressa: leva 30 segundos.",
          },
        ],
      },
    };
  },
};

const R16: RegraDef = {
  id: "R16",
  titulo: "Foco de lesão apto a avançar de fase",
  avaliar(ctx) {
    const regiao = ctx.foco?.regiao ?? "tornozelo";
    const outro = regiao !== "tornozelo";
    const nome = ctx.foco && outro ? ` (${nomeDoFoco(ctx.foco.regiao, ctx.foco.lado)})` : "";
    const av = avaliarFaseDoFoco({
      regiao,
      fase: ctx.fase.fase,
      diasVerdes: ctx.diasVerdes,
      series: ctx.series,
      jogos: ctx.jogos,
      testes: ctx.testes,
      podeProgredir: ctx.seguranca.podeProgredir,
    });
    if (!av.apto || !av.proxima) return null;
    const prop: PropostaSugerida = {
      tipo: "fase",
      regra: "R16",
      titulo: `Avançar para a fase ${av.proxima}${nome}`,
      resumo: `Todos os critérios da fase ${av.faseAtual} foram atendidos. ${AVISO_FASE}`,
      // o tornozelo mantém a chave e o payload de antes
      chave: outro ? `fase:${regiao}:${av.faseAtual}->${av.proxima}` : `fase:${av.faseAtual}->${av.proxima}`,
      criterios: av.criterios,
      payload: outro
        ? { de: av.faseAtual, para: av.proxima, regiao }
        : { de: av.faseAtual, para: av.proxima },
    };
    return {
      mensagem: `Os critérios da fase ${av.faseAtual} foram atendidos. Quer avançar para a fase ${av.proxima}?`,
      porque: {
        dados: av.criterios.map((c) => `${c.texto}: ${c.progresso ?? (c.ok ? "ok" : "falta")}`),
        mudaria: "A proposta some se a segurança bloquear ou algum critério deixar de ser atendido.",
      },
      efeitos: { propostas: [prop] },
    };
  },
};

const R17: RegraDef = {
  id: "R17",
  titulo: "Como o tornozelo respondeu ao jogo",
  avaliar(ctx) {
    const j = ctx.ultimoJogoRegistrado;
    if (!j?.id || j.dor === null) return null;
    const diaSeguinte = addDias(dataISO(new Date(j.inicio)), 1);
    const c = ctx.checkins.find((x) => x.jogoId === j.id) ?? ctx.checkins.find((x) => x.data === diaSeguinte);
    if (!c || c.data !== ctx.hoje) return null;
    const pesado = (j.esforco ?? 0) >= 8 && c.dor >= 4;
    return {
      mensagem: `Dor depois do jogo: ${j.dor} → hoje: ${c.dor}.${pesado ? " O jogo foi pesado e ainda dói: hoje é recuperação." : ""}`,
      porque: {
        dados: [
          `Jogo: esforço ${j.esforco ?? "—"} de 10, dor depois ${j.dor}`,
          `Check-in do dia seguinte: dor ${c.dor}`,
        ],
        mudaria: pesado
          ? "Amanhã volta ao normal se a dor ficar em 3 ou menos."
          : "Só informativo: a dor do dia seguinte não pede mudança.",
      },
      efeitos: pesado
        ? {
            modoMax: "recuperacao",
            substituicoes: ["Mobilidade e caminhada leve no lugar dos exercícios fortes."],
            acoes: [
              {
                id: "foco_tornozelo",
                regra: "R17",
                titulo: "Foco no tornozelo",
                texto: "Faça a rotina de tornozelo leve e mobilidade.",
              },
            ],
          }
        : {},
    };
  },
};

const R18: RegraDef = {
  id: "R18",
  titulo: "Dia de descanso",
  avaliar(ctx, p) {
    const folga = modoDaProntidao(p.pontuacao) === "folga";
    if (ctx.diaSemana !== 0 && !folga) return null;
    return {
      mensagem:
        ctx.diaSemana === 0
          ? "Domingo é descanso: os anéis ficam sem meta."
          : "Hoje é folga: os anéis ficam sem meta.",
      porque: {
        dados: [ctx.diaSemana === 0 ? "Domingo: folga total no plano" : "Prontidão muito baixa: modo Folga"],
        mudaria:
          ctx.diaSemana === 0 ? "Segunda volta o plano normal." : "Volta ao normal quando a prontidão subir.",
      },
      efeitos: { aneisDescanso: true },
    };
  },
};

export const REGRAS: RegraDef[] = [
  R01,
  R02,
  R03,
  R04,
  R05,
  R06,
  R07,
  R08,
  R09,
  R10,
  R11,
  R12,
  R13,
  R14,
  R15,
  R16,
  R17,
  R18,
];

export function avaliarRegras(ctx: CoachContext, p: Prontidao): RegraDisparada[] {
  const saida: RegraDisparada[] = [];
  for (const r of REGRAS) {
    const res = r.avaliar(ctx, p);
    if (res) saida.push({ id: r.id, titulo: r.titulo, ...res });
  }
  return saida;
}
