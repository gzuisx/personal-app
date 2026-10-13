// Função única do dia (seção 24.5): planejado x realizado. Hoje, Semana, Evolução e anéis contam a mesma história.
import { itensDeCarga, somaCarga, type ItemCarga } from "../coach/carga";
import { buildCoachContext } from "../coach/contexto";
import { diaPlanejado } from "../coach/dia";
import { definirModoDoDia } from "../coach/modo";
import type { Decisao } from "../coach/tipos";
import { nivelDoCheckin } from "../safety";
import { blocoTreinavel, type Bloco } from "../seed/plano";
import { dataISO, diaSemanaISO, instanteSP } from "../tempo";
import type { Checkin, DadosApp, Jogo, Sessao, TesteCampo } from "../tipos";

export type StatusBloco = "feito" | "parcial" | "nao_fiz" | "pendente" | "sem_registro";

export type BlocoDoDia = {
  id: string;
  titulo: string;
  periodo: Bloco["periodo"];
  tags: string[];
  status: StatusBloco;
  sessao: Sessao | null;
};

export type CorDor = "verde" | "amarelo" | "vermelho";

export type DiaResumo = {
  data: string;
  diaSemana: number;
  hoje: boolean;
  futuro: boolean;
  /** domingo ou dia sem nenhum bloco treinável */
  descanso: boolean;
  blocos: BlocoDoDia[];
  planejados: number;
  feitos: number;
  checkin: Checkin | null;
  corDor: CorDor | null;
  jogoPlanejado: boolean;
  jogo: Jogo | null;
  testes: TesteCampo[];
  avisos: string[];
  carga: ItemCarga[];
  cargaTotal: number;
};

export function statusDoBloco(sessao: Sessao | undefined, data: string, hoje: string): StatusBloco {
  if (sessao)
    return sessao.resultado === "feito" ? "feito" : sessao.resultado === "parcial" ? "parcial" : "nao_fiz";
  return data < hoje ? "sem_registro" : "pendente";
}

export function getDiaResumo(data: string, dados: DadosApp, hoje: string): DiaResumo {
  const planejado = diaPlanejado(data, dados);
  const dia = planejado.dia;
  const treinaveis = dia.blocos.filter(blocoTreinavel);
  const sessoes = dados.sessoes.filter((s) => s.data === data);

  const blocos: BlocoDoDia[] = treinaveis.map((b) => {
    const sessao = sessoes.find((s) => s.bloco === b.id) ?? null;
    return {
      id: b.id,
      titulo: b.titulo,
      periodo: b.periodo,
      tags: [...b.tags],
      status: statusDoBloco(sessao ?? undefined, data, hoje),
      sessao,
    };
  });

  const checkin = dados.checkins.find((c) => c.data === data) ?? null;
  let corDor: CorDor | null = null;
  if (checkin) {
    const nivel = nivelDoCheckin(checkin, dados.seguranca);
    corDor = nivel === "bloqueio" ? "vermelho" : nivel === "atencao" ? "amarelo" : "verde";
  }

  const jogo =
    dados.jogos.find((j) => dataISO(new Date(j.inicio)) === data && j.status !== "cancelado") ?? null;
  const carga = itensDeCarga(dados.sessoes, dados.jogos, data, data);

  return {
    data,
    diaSemana: diaSemanaISO(data),
    hoje: data === hoje,
    futuro: data > hoje,
    descanso: diaSemanaISO(data) === 0 || treinaveis.length === 0,
    blocos,
    planejados: blocos.length,
    feitos: blocos.filter((b) => b.status === "feito" || b.status === "parcial").length,
    checkin,
    corDor,
    jogoPlanejado: !!dia.jogo,
    jogo,
    testes: dados.testes.filter((t) => t.data === data),
    avisos: planejado.avisos,
    carga,
    cargaTotal: somaCarga(carga),
  };
}

/** Decisão do coach daquele dia, recalculada só com os registros até o fim do dia (nada é guardado). */
export function decisaoDoDia(data: string, dados: DadosApp): Decisao {
  const ate = (d: string) => d <= data;
  const recorte: DadosApp = {
    ...dados,
    checkins: dados.checkins.filter((c) => ate(c.data)),
    sessoes: dados.sessoes.filter((s) => ate(s.data)),
    series: dados.series.filter((s) => ate(s.data)),
    jogos: dados.jogos.filter((j) => ate(dataISO(new Date(j.inicio)))),
    testes: dados.testes.filter((t) => ate(t.data)),
  };
  return definirModoDoDia(buildCoachContext(instanteSP(data, 9, 0), recorte));
}
