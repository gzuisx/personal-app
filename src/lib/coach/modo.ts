// Decisão do dia (seções 3.5, 3.6 e 3.7): une prontidão, regras e segurança em um único resultado.
import { calcularProntidao, modoDaProntidao } from "./prontidao";
import { avaliarRegras } from "./regras";
import {
  ROTULO_MODO,
  SEVERIDADE_MODO,
  type AcaoCard,
  type Alerta,
  type CoachContext,
  type ComponenteProntidao,
  type Decisao,
  type ModoDia,
  type Prontidao,
} from "./tipos";

export function maisConservador(a: ModoDia, b: ModoDia): ModoDia {
  return SEVERIDADE_MODO[a] >= SEVERIDADE_MODO[b] ? a : b;
}

/** Ajuste do treino guiado que corresponde ao modo do dia. */
export function ajusteDoModo(modo: ModoDia): "completo" | "reduzido" | "recuperacao" {
  if (modo === "completo") return "completo";
  if (modo === "reduzido") return "reduzido";
  return "recuperacao";
}

const PROXIMO_MELHOR: Partial<Record<ModoDia, ModoDia>> = {
  reduzido: "completo",
  recuperacao: "reduzido",
  folga: "recuperacao",
};

/** O que mudaria a decisão, em palavras (sem porcentagem). */
export function oQueMudaria(p: Prontidao, modo: ModoDia, temBloqueio: boolean): string {
  if (p.sobrescrita || temBloqueio) {
    return "Volta ao normal quando um check-in novo vier sem inchaço, sem falha e com dor abaixo do limite de bloqueio.";
  }
  if (modo === "completo") {
    return "Continua completo se o próximo check-in mantiver a dor até 3 e o sono em 7 h ou mais.";
  }
  const sugestoes: string[] = [];
  for (const c of [...p.componentes].sort((a, b) => a.pontos - b.pontos)) {
    if (c.pontos >= 0) continue;
    if (c.id === "sono") sugestoes.push("dormir 7 h ou mais");
    else if (c.id === "dor") sugestoes.push("a dor ficar em 2 ou menos");
    else if (c.id === "energia") sugestoes.push("a energia subir");
    else if (c.id === "carga") sugestoes.push("a carga da semana ficar mais leve");
    else if (c.id === "jogo") sugestoes.push("passar mais tempo desde o jogo");
    else if (c.id === "sem_checkin") sugestoes.push("fazer o check-in de hoje");
    if (sugestoes.length >= 2) break;
  }
  const alvo = PROXIMO_MELHOR[modo];
  if (!alvo) return "Continua assim enquanto os dados não mudarem.";
  return sugestoes.length
    ? `Volta ao modo ${ROTULO_MODO[alvo]} se ${sugestoes.join(" e ")}.`
    : `Volta ao modo ${ROTULO_MODO[alvo]} quando os próximos dados melhorarem.`;
}

function motivosResumidos(componentes: ComponenteProntidao[]): string {
  const piores = componentes
    .filter((c) => c.pontos < 0)
    .sort((a, b) => a.pontos - b.pontos)
    .slice(0, 2);
  if (!piores.length) return "";
  return piores.map((c) => c.detalhe.charAt(0).toLowerCase() + c.detalhe.slice(1)).join("; ");
}

export function definirModoDoDia(ctx: CoachContext): Decisao {
  const prontidao = calcularProntidao({
    checkins: ctx.checkins,
    hoje: ctx.hoje,
    config: ctx.config,
    carga: ctx.carga,
    horasDesdeUltimoJogo: ctx.horasDesdeUltimoJogo,
  });
  const regras = avaliarRegras(ctx, prontidao);

  let modo = modoDaProntidao(prontidao.pontuacao);
  if (prontidao.sobrescrita) modo = maisConservador(modo, "recuperacao");
  // Regra de ouro: com bloqueio de segurança, o modo nunca é Completo nem Reduzido.
  if (ctx.seguranca.nivel === "bloqueio") modo = maisConservador(modo, "recuperacao");
  for (const r of regras) if (r.efeitos.modoMax) modo = maisConservador(modo, r.efeitos.modoMax);

  const efeitos = regras.map((r) => r.efeitos);
  const alguma = (f: (e: (typeof efeitos)[number]) => boolean | undefined) => efeitos.some((e) => !!f(e));

  const bloqueioPorRegra = alguma((e) => e.bloqueiaProgressao);
  // A progressão exige: segurança liberada, modo Completo e nenhuma regra segurando.
  const podeProgredir = ctx.seguranca.podeProgredir && modo === "completo" && !bloqueioPorRegra;

  let motivoBloqueio: string | undefined;
  if (!podeProgredir) {
    if (!ctx.seguranca.podeProgredir) motivoBloqueio = ctx.seguranca.mensagem;
    else if (modo !== "completo")
      motivoBloqueio = `Hoje o modo é ${ROTULO_MODO[modo]}: sem aumentar a carga.`;
    else motivoBloqueio = regras.find((r) => r.efeitos.bloqueiaProgressao)?.mensagem;
  }

  const ajustesBase: string[] = [];
  if (modo === "reduzido") {
    ajustesBase.push(
      "Uma série a menos em cada exercício e sem o último acessório.",
      "Sem esforço máximo, sem saltos e sem mudança de direção intensa.",
    );
  } else if (modo === "recuperacao") {
    ajustesBase.push("Só mobilidade, tornozelo leve e caminhada.", "Sem sprint e sem carga alta.");
  } else if (modo === "folga") {
    ajustesBase.push("Descanse hoje.");
  }
  const ajustesDoTreino = [...new Set([...ajustesBase, ...efeitos.flatMap((e) => e.ajustes ?? [])])];
  const substituicoes = [...new Set(efeitos.flatMap((e) => e.substituicoes ?? []))];

  const alertas: Alerta[] = efeitos.flatMap((e) => e.alertas ?? []);
  if (modo === "folga" && (ctx.seguranca.nivel === "bloqueio" || prontidao.sobrescrita)) {
    alertas.push({
      regra: "R01",
      severidade: "alto",
      texto:
        "Se a dor persistir, o tornozelo falhar ou houver inchaço, procure ortopedista ou fisioterapeuta.",
    });
  }
  // Dia de jogo: o app não cancela o jogo, mas avisa quando o risco é maior (3.5).
  const perto = ctx.horasAteProximoJogo !== null && ctx.horasAteProximoJogo <= 24;
  if (perto && (ctx.seguranca.nivel === "bloqueio" || modo === "recuperacao" || modo === "folga")) {
    alertas.push({
      regra: "JOGO",
      severidade: "alto",
      texto:
        "Hoje o risco no jogo é maior. A decisão de jogar é sua; considere ajustar o aquecimento e o esforço.",
    });
  }

  const vistas = new Set<string>();
  const proximasAcoes: AcaoCard[] = [];
  for (const a of efeitos.flatMap((e) => e.acoes ?? [])) {
    if (vistas.has(a.id)) continue;
    vistas.add(a.id);
    proximasAcoes.push(a);
  }

  const propostas = efeitos.flatMap((e) => e.propostas ?? []);
  const sugestaoDePlano = efeitos.find((e) => e.planoSugerido)?.planoSugerido;

  const motivos = motivosResumidos(prontidao.componentes);
  const frase =
    modo === "completo"
      ? "Tudo certo: siga o treino do plano."
      : modo === "folga"
        ? `Hoje é dia de descanso${motivos ? `: ${motivos}` : ""}.`
        : `${motivos ? motivos.charAt(0).toUpperCase() + motivos.slice(1) : (regras[0]?.mensagem ?? "Alguns sinais pedem cuidado")}. O treino de hoje fica mais ${modo === "reduzido" ? "leve" : "suave"}.`;

  return {
    modo,
    prontidao,
    componentes: prontidao.componentes,
    ajustesDoTreino,
    substituicoes,
    alertas,
    proximasAcoes,
    podeProgredir,
    motivoBloqueio,
    sugestaoDePlano,
    sugestaoDeFase: propostas.some((p) => p.tipo === "fase"),
    propostas,
    regras,
    semPliometria: alguma((e) => e.semPliometria) || modo !== "completo",
    semVelocidade: alguma((e) => e.semVelocidade) || modo === "recuperacao" || modo === "folga",
    semSprintMaximo: alguma((e) => e.semSprintMaximo) || modo !== "completo",
    aneisDescanso: alguma((e) => e.aneisDescanso) || modo === "folga",
    frase,
    oQueMudaria: oQueMudaria(prontidao, modo, ctx.seguranca.nivel === "bloqueio"),
    reconhecimentos: efeitos.flatMap((e) => (e.reconhecimento ? [e.reconhecimento] : [])),
    marcosDetectados: efeitos.flatMap((e) => e.marcos ?? []),
  };
}
