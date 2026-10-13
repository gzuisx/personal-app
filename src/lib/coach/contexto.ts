// CoachContext (seção 3.2): tudo que o motor "sabe" a cada instante. Telas e regras usam o MESMO contexto.
import { avaliarSeguranca, diasVerdesSeguidos } from "../safety";
import { resumirTestes } from "../testes";
import { diaPlanejado } from "./dia";
import { faseGuardada } from "../seed/fase";
import { avaliarSemaforo } from "../semaforo";
import { addDias, dataISO, diaSemanaISO, proximoJogo, ultimoJogo, type ExcecoesDeJogo } from "../tempo";
import type { DadosApp } from "../tipos";
import { excecoesParaJogos } from "./agenda";
import { variacaoDeCarga } from "./carga";
import { detectarMarcos } from "./marcos";
import type { CoachContext, TesteCampoResumo } from "./tipos";

const JANELA_DIAS = 28;
const MS_HORA = 3_600_000;

/** Testes de campo do app, no formato que o motor usa. A etapa 9 preenche; até lá a lista vai vazia. */
export type FonteDeTestes = TesteCampoResumo[];

export function buildCoachContext(
  agora: Date,
  dados: DadosApp,
  testes: FonteDeTestes = resumirTestes(dados.testes ?? []),
): CoachContext {
  const hoje = dataISO(agora);
  const desde = addDias(hoje, -(JANELA_DIAS - 1));
  const config = dados.seguranca;
  const jogosExcecao: ExcecoesDeJogo = excecoesParaJogos(dados.excecoes);

  const checkins = dados.checkins.filter((c) => c.data >= desde && c.data <= hoje);
  const sessoes = dados.sessoes.filter((s) => s.data >= desde && s.data <= hoje);
  const series = dados.series.filter((s) => s.data >= desde && s.data <= hoje);
  const jogos = dados.jogos.filter((j) => dataISO(new Date(j.inicio)) >= desde);

  const seguranca = avaliarSeguranca({ checkins, jogos, hoje, agora, config });
  const semaforo = avaliarSemaforo({ checkins, jogos, hoje, agora, config });
  const carga = variacaoDeCarga(dados.sessoes, dados.jogos, hoje);

  const ult = ultimoJogo(agora, jogosExcecao);
  const prox = proximoJogo(agora, jogosExcecao);
  const horasDesdeUltimoJogo = ult ? (agora.getTime() - ult.inicio.getTime()) / MS_HORA : null;
  const horasAteProximoJogo = (prox.inicio.getTime() - agora.getTime()) / MS_HORA;

  const ultimoJogoRegistrado =
    [...dados.jogos]
      .filter(
        (j) => j.dor !== null && new Date(j.inicio).getTime() <= agora.getTime() && j.status !== "cancelado",
      )
      .sort((a, b) => b.inicio.localeCompare(a.inicio))[0] ?? null;

  const plano = diaPlanejado(hoje, dados).dia;

  return {
    agora,
    hoje,
    diaSemana: diaSemanaISO(hoje),
    perfil: dados.perfil,
    fase: dados.faseTornozelo,
    semanaDaFase: faseGuardada(dados.faseTornozelo, hoje).semanaNaFase,
    diasVerdes: diasVerdesSeguidos(checkins, hoje, config),
    checkins,
    sessoes,
    series,
    jogos,
    preJogos: dados.preJogos.filter((p) => p.jogoData >= desde),
    testes,
    excecoes: dados.excecoes,
    propostas: dados.propostas,
    marcos: dados.marcos,
    plano,
    config,
    seguranca,
    semaforo,
    carga,
    horasDesdeUltimoJogo,
    horasAteProximoJogo,
    ultimoJogoRegistrado,
    marcosDetectados: detectarMarcos({
      hoje,
      checkins: dados.checkins,
      sessoes: dados.sessoes,
      jogos: dados.jogos,
      testes,
      marcos: dados.marcos,
      config,
    }),
  };
}
