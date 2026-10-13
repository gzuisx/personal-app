import { createClient } from "@/lib/supabase/client";
import { SEGURANCA_PADRAO } from "@/lib/safety";
import {
  INICIO_PLANO,
  MARCOS_DEFINICOES,
  PERFIL_PADRAO,
  RESTRICAO_TORNOZELO,
  ROTINA_PADRAO,
  type Checkin,
  type DadosApp,
  type DuracaoDor,
  type Execucao,
  type ExcecaoAgenda,
  type PlanoVersao,
  type Proposta,
  type RegistroAuditoria,
  type Rotina,
  type FaseNum,
  type FaseTornozelo,
  type Gatilho,
  type Jogo,
  type Marco,
  type MarcoDef,
  type MovimentoDor,
  type Perfil,
  type PreJogoLog,
  type RegiaoDor,
  type Resultado,
  type Restricao,
  type SerieLog,
  type Sessao,
  type SonoFaixa,
  type StatusJogo,
} from "@/lib/tipos";
import type { EsforcoSerie, EstadoTreino } from "@/lib/treino/motor";
import type { Repo } from "./tipos";

function erro(contexto: string, e: { message: string } | null) {
  if (e) throw new Error(`${contexto}: ${e.message}`);
}

function novoId() {
  return crypto.randomUUID();
}

type LinhaRestricao = {
  chave: string | null;
  regiao: string;
  lado: string | null;
  tipo: string | null;
  nivel_dor: number | null;
  status: string | null;
};

function restricaoDaLinha(r: LinhaRestricao): Restricao {
  return {
    id: r.chave ?? r.regiao,
    regiao: r.regiao,
    lado: (r.lado as Restricao["lado"] | null) ?? "não se aplica",
    tipo: (r.tipo as Restricao["tipo"] | null) ?? "ponto fraco",
    nivelDor: r.nivel_dor ?? 0,
    status: r.status ?? "Em avaliação",
  };
}

export function criarSupabaseRepo(): Repo {
  const supabase = createClient();
  let uid: string | null = null;

  async function userId() {
    if (uid) return uid;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Sessão expirada. Entre de novo.");
    uid = data.user.id;
    return uid;
  }

  async function carregar(desdeISO: string): Promise<DadosApp> {
    const [
      perfilR,
      restR,
      checkinsR,
      sessoesR,
      jogosR,
      preR,
      segR,
      marcosR,
      defsR,
      seriesR,
      execR,
      excR,
      rotR,
      propR,
      audR,
      verR,
    ] = await Promise.all([
      supabase.from("profiles").select("nome, dados, fase_tornozelo, fase_inicio").maybeSingle(),
      supabase
        .from("restrictions")
        .select("chave, regiao, lado, tipo, nivel_dor, status, ativa")
        .eq("ativa", true),
      supabase
        .from("checkins")
        .select(
          "data, dor_tornozelo, inchaco, falhou, energia, sono_faixa, gatilho, notas, regioes, movimentos, duracao_dor, posterior_apertou, jogo_id",
        )
        .gte("data", desdeISO)
        .order("data"),
      supabase
        .from("session_logs")
        .select("data, bloco, resultado, esforco, duracao_min, notas")
        .gte("data", desdeISO)
        .not("bloco", "is", null),
      supabase
        .from("games")
        .select("id, data_hora, minutos_jogados, esforco_pos_jogo, dor_tornozelo, gatilho, notas, status")
        .gte("data_hora", `${desdeISO}T00:00:00Z`)
        .order("data_hora"),
      supabase
        .from("pre_game_logs")
        .select("jogo_data, aquecimento_concluido, fases_concluidas, duracao_s, tornozeleira")
        .gte("jogo_data", desdeISO),
      supabase.from("safety_settings").select("*").maybeSingle(),
      supabase.from("milestones").select("chave, concluido_em"),
      supabase.from("milestone_defs").select("chave, titulo, criterio, auto, ordem").order("ordem"),
      supabase
        .from("set_logs")
        .select(
          "execucao_id, data, bloco, exercicio, numero_serie, carga_kg, reps, duracao_s, rir, esforco, dor_durante, criado_em",
        )
        .gte("data", desdeISO)
        .order("data"),
      supabase.from("execution_state").select("execucao_id, tipo, estado, atualizado_em").maybeSingle(),
      supabase
        .from("calendar_overrides")
        .select("id, data, tipo, hora, nota, slug, substitui, bloco")
        .gte("data", desdeISO)
        .order("data"),
      supabase.from("routine").select("dados").maybeSingle(),
      supabase
        .from("coach_proposals")
        .select(
          "id, chave_unica, tipo, status, regra, titulo, resumo, criterios, payload, adiada_ate, criada_em, decidida_em",
        )
        .order("criada_em", { ascending: false })
        .limit(100),
      supabase
        .from("audit_log")
        .select("id, evento, detalhes, criado_em")
        .order("criado_em", { ascending: false })
        .limit(100),
      supabase
        .from("plan_versions")
        .select("id, chave_template, inicio, fim, origem, ativo, conteudo")
        .order("inicio", { ascending: false }),
    ]);

    erro("perfil", perfilR.error);
    erro("restrições", restR.error);
    erro("check-ins", checkinsR.error);
    erro("sessões", sessoesR.error);
    erro("jogos", jogosR.error);
    erro("pré-jogo", preR.error);
    erro("regras de segurança", segR.error);
    erro("marcos", marcosR.error);
    erro("definição dos marcos", defsR.error);
    erro("séries", seriesR.error);
    erro("treino em andamento", execR.error);
    erro("exceções de agenda", excR.error);
    erro("rotina", rotR.error);
    erro("propostas", propR.error);
    erro("registro de decisões", audR.error);
    erro("versões do plano", verR.error);

    const dados = (perfilR.data?.dados ?? {}) as Partial<Perfil>;
    const doBanco = (restR.data ?? []).map((r) => restricaoDaLinha(r as LinhaRestricao));
    const perfil: Perfil = {
      ...PERFIL_PADRAO,
      ...dados,
      nome: perfilR.data?.nome || PERFIL_PADRAO.nome,
      // restrições: tabela primeiro; se estiver vazia, lê o JSON antigo e, por fim, o padrão
      restricoes: doBanco.length
        ? doBanco
        : dados.restricoes?.length
          ? dados.restricoes
          : [RESTRICAO_TORNOZELO],
    };

    const seg = segR.data;
    const defs: MarcoDef[] = (defsR.data ?? []).map((d) => ({
      chave: d.chave as string,
      titulo: d.titulo as string,
      criterio: (d.criterio as string | null) ?? "",
      auto: (d.auto as string | null) ?? undefined,
    }));

    return {
      perfil,
      faseTornozelo: {
        fase: ((perfilR.data?.fase_tornozelo as number | null) ?? 1) as FaseNum,
        inicio: (perfilR.data?.fase_inicio as string | null) ?? INICIO_PLANO,
      },
      checkins: (checkinsR.data ?? []).map((r) => ({
        data: r.data as string,
        dor: (r.dor_tornozelo as number | null) ?? 0,
        inchaco: !!r.inchaco,
        falhou: !!r.falhou,
        energia: (r.energia as number | null) ?? null,
        sonoFaixa: (r.sono_faixa as SonoFaixa | null) ?? null,
        gatilho: (r.gatilho as Gatilho | null) ?? null,
        observacao: (r.notas as string | null) ?? null,
        regioes: ((r.regioes as string[] | null) ?? []) as RegiaoDor[],
        movimentos: ((r.movimentos as string[] | null) ?? []) as MovimentoDor[],
        duracaoDor: (r.duracao_dor as DuracaoDor | null) ?? null,
        posteriorApertou: (r.posterior_apertou as boolean | null) ?? null,
        jogoId: (r.jogo_id as string | null) ?? null,
      })),
      sessoes: (sessoesR.data ?? []).map((r) => ({
        data: r.data as string,
        bloco: r.bloco as string,
        resultado: ((r.resultado as Resultado | null) ?? "feito") as Resultado,
        esforco: (r.esforco as number | null) ?? null,
        duracaoMin: (r.duracao_min as number | null) ?? null,
        notas: (r.notas as string | null) ?? null,
      })),
      jogos: (jogosR.data ?? []).map((r) => ({
        id: r.id as string,
        inicio: new Date(r.data_hora as string).toISOString(),
        minutosJogados: (r.minutos_jogados as number | null) ?? null,
        esforco: (r.esforco_pos_jogo as number | null) ?? null,
        dor: (r.dor_tornozelo as number | null) ?? null,
        gatilho: (r.gatilho as Gatilho | null) ?? null,
        notas: (r.notas as string | null) ?? null,
        status: ((r.status as StatusJogo | null) ?? "jogado") as StatusJogo,
      })),
      preJogos: (preR.data ?? []).map((r) => ({
        jogoData: r.jogo_data as string,
        concluido: !!r.aquecimento_concluido,
        fasesConcluidas: (r.fases_concluidas as number | null) ?? 0,
        duracaoS: (r.duracao_s as number | null) ?? 0,
        tornozeleira: (r.tornozeleira as boolean | null) ?? null,
      })),
      seguranca: seg
        ? {
            limiteBloqueio: seg.limite_bloqueio as number,
            limiteAtencao: seg.limite_atencao as number,
            inchacoBloqueia: !!seg.inchaco_bloqueia,
            falhouBloqueia: !!seg.falhou_bloqueia,
          }
        : SEGURANCA_PADRAO,
      marcos: (marcosR.data ?? []).map((r) => ({
        chave: r.chave as string,
        concluidoEm: (r.concluido_em as string | null) ?? null,
      })),
      marcosDefs: defs.length ? defs : MARCOS_DEFINICOES,
      excecoes: (excR.data ?? []).map((r) => ({
        id: r.id as string,
        data: r.data as string,
        tipo: r.tipo as ExcecaoAgenda["tipo"],
        hora: (r.hora as string | null) ?? null,
        nota: (r.nota as string | null) ?? null,
        slug: (r.slug as string | null) ?? null,
        substitui: (r.substitui as string | null) ?? null,
        bloco: (r.bloco as string | null) ?? null,
      })),
      rotina: { ...ROTINA_PADRAO, ...((rotR.data?.dados as Partial<Rotina> | null) ?? {}) },
      propostas: (propR.data ?? []).map((r) => ({
        id: r.id as string,
        chaveUnica: r.chave_unica as string,
        tipo: r.tipo as Proposta["tipo"],
        status: r.status as Proposta["status"],
        regra: (r.regra as string | null) ?? "",
        titulo: r.titulo as string,
        resumo: (r.resumo as string | null) ?? "",
        criterios: ((r.criterios as Proposta["criterios"] | null) ?? []) as Proposta["criterios"],
        payload: ((r.payload as Record<string, unknown> | null) ?? {}) as Record<string, unknown>,
        adiadaAte: (r.adiada_ate as string | null) ?? null,
        criadaEm: r.criada_em as string,
        decididaEm: (r.decidida_em as string | null) ?? null,
      })),
      versoes: (verR.data ?? []).map((r) => ({
        id: r.id as string,
        chaveTemplate: (r.chave_template as string | null) ?? null,
        inicio: r.inicio as string,
        fim: (r.fim as string | null) ?? null,
        origem: r.origem as PlanoVersao["origem"],
        ativo: !!r.ativo,
        conteudo: ((r.conteudo as Record<string, unknown> | null) ?? {}) as Record<string, unknown>,
      })),
      auditoria: (audR.data ?? []).map((r) => ({
        id: r.id as string,
        evento: r.evento as string,
        detalhes: ((r.detalhes as Record<string, unknown> | null) ?? {}) as Record<string, unknown>,
        criadoEm: r.criado_em as string,
      })),
      series: (seriesR.data ?? []).map((r) => ({
        execucaoId: r.execucao_id as string,
        data: r.data as string,
        bloco: r.bloco as string,
        exercicio: r.exercicio as string,
        numero: r.numero_serie as number,
        cargaKg: r.carga_kg === null || r.carga_kg === undefined ? null : Number(r.carga_kg),
        reps: (r.reps as number | null) ?? null,
        duracaoS: (r.duracao_s as number | null) ?? null,
        rir: (r.rir as number | null) ?? null,
        esforco: (r.esforco as EsforcoSerie | null) ?? null,
        dorDurante: (r.dor_durante as number | null) ?? null,
        criadoEm: r.criado_em as string,
      })),
      execucao: execR.data
        ? {
            id: execR.data.execucao_id as string,
            tipo: ((execR.data.tipo as string | null) ?? "bloco") as "bloco" | "sequencia",
            data: ((execR.data.estado as EstadoTreino | null)?.data ?? "") as string,
            estado: execR.data.estado as EstadoTreino,
            atualizadoEm: execR.data.atualizado_em as string,
          }
        : null,
    };
  }

  return {
    modo: "supabase",
    carregar,

    async salvarCheckin(c: Checkin) {
      const user_id = await userId();
      const { error } = await supabase.from("checkins").upsert(
        {
          user_id,
          data: c.data,
          dor_tornozelo: c.dor,
          inchaco: c.inchaco,
          falhou: c.falhou,
          energia: c.energia,
          sono_faixa: c.sonoFaixa,
          gatilho: c.gatilho,
          notas: c.observacao,
          regioes: c.regioes ?? [],
          movimentos: c.movimentos ?? [],
          duracao_dor: c.duracaoDor ?? null,
          posterior_apertou: c.posteriorApertou ?? null,
          jogo_id: c.jogoId ?? null,
        },
        { onConflict: "user_id,data" },
      );
      erro("salvar check-in", error);
    },

    async salvarSessao(s: Sessao) {
      const user_id = await userId();
      const { error } = await supabase.from("session_logs").upsert(
        {
          user_id,
          data: s.data,
          bloco: s.bloco,
          resultado: s.resultado,
          concluido: s.resultado !== "nao_fiz",
          esforco: s.esforco,
          duracao_min: s.duracaoMin,
          notas: s.notas,
        },
        { onConflict: "user_id,data,bloco" },
      );
      erro("salvar sessão", error);
    },

    async salvarJogo(j: Jogo) {
      const user_id = await userId();
      const { error } = await supabase.from("games").upsert(
        {
          id: j.id ?? novoId(),
          user_id,
          data_hora: j.inicio,
          minutos_jogados: j.minutosJogados,
          esforco_pos_jogo: j.esforco ?? null,
          dor_tornozelo: j.dor,
          gatilho: j.gatilho,
          notas: j.notas,
          status: j.status ?? "jogado",
        },
        { onConflict: "user_id,data_hora" },
      );
      erro("salvar jogo", error);
    },

    async salvarPreJogo(p: PreJogoLog) {
      const user_id = await userId();
      const { error } = await supabase.from("pre_game_logs").upsert(
        {
          user_id,
          jogo_data: p.jogoData,
          aquecimento_concluido: p.concluido,
          fases_concluidas: p.fasesConcluidas,
          duracao_s: p.duracaoS,
          tornozeleira: p.tornozeleira,
        },
        { onConflict: "user_id,jogo_data" },
      );
      erro("salvar pré-jogo", error);
    },

    async salvarSerie(sl: SerieLog) {
      const user_id = await userId();
      const { error } = await supabase.from("set_logs").upsert(
        {
          user_id,
          execucao_id: sl.execucaoId,
          data: sl.data,
          bloco: sl.bloco,
          exercicio: sl.exercicio,
          numero_serie: sl.numero,
          carga_kg: sl.cargaKg,
          reps: sl.reps,
          duracao_s: sl.duracaoS,
          rir: sl.rir,
          esforco: sl.esforco,
          dor_durante: sl.dorDurante,
          criado_em: sl.criadoEm,
        },
        { onConflict: "user_id,execucao_id,exercicio,numero_serie" },
      );
      erro("salvar série", error);
    },

    async salvarExecucao(e: Execucao) {
      const user_id = await userId();
      const { error } = await supabase.from("execution_state").upsert(
        {
          user_id,
          execucao_id: e.id,
          tipo: e.tipo,
          passo_atual: e.estado.fase,
          estado: e.estado,
          atualizado_em: e.atualizadoEm,
        },
        { onConflict: "user_id" },
      );
      erro("salvar treino em andamento", error);
    },

    async limparExecucao() {
      const user_id = await userId();
      const { error } = await supabase.from("execution_state").delete().eq("user_id", user_id);
      erro("limpar treino em andamento", error);
    },

    async salvarExcecao(e: ExcecaoAgenda) {
      const user_id = await userId();
      const { error } = await supabase.from("calendar_overrides").upsert({
        id: e.id,
        user_id,
        data: e.data,
        tipo: e.tipo,
        hora: e.hora ?? null,
        nota: e.nota ?? null,
        slug: e.slug ?? null,
        substitui: e.substitui ?? null,
        bloco: e.bloco ?? null,
      });
      erro("salvar exceção de agenda", error);
    },

    async removerExcecao(id: string) {
      const { error } = await supabase.from("calendar_overrides").delete().eq("id", id);
      erro("remover exceção de agenda", error);
    },

    async salvarRotina(r: Rotina) {
      const user_id = await userId();
      const { error } = await supabase
        .from("routine")
        .upsert({ user_id, dados: r, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      erro("salvar rotina", error);
    },

    async salvarProposta(p: Proposta) {
      const user_id = await userId();
      const { error } = await supabase.from("coach_proposals").upsert(
        {
          id: p.id,
          user_id,
          chave_unica: p.chaveUnica,
          tipo: p.tipo,
          status: p.status,
          regra: p.regra,
          titulo: p.titulo,
          resumo: p.resumo,
          criterios: p.criterios,
          payload: p.payload,
          adiada_ate: p.adiadaAte ?? null,
          criada_em: p.criadaEm,
          decidida_em: p.decididaEm ?? null,
        },
        { onConflict: "user_id,chave_unica" },
      );
      erro("salvar proposta", error);
    },

    async salvarVersao(v: PlanoVersao) {
      const user_id = await userId();
      const { error } = await supabase.from("plan_versions").upsert({
        id: v.id,
        user_id,
        chave_template: v.chaveTemplate,
        inicio: v.inicio,
        fim: v.fim,
        origem: v.origem,
        ativo: v.ativo,
        conteudo: v.conteudo,
      });
      erro("salvar versão do plano", error);
    },

    async registrarAuditoria(a: RegistroAuditoria) {
      const user_id = await userId();
      const { error } = await supabase
        .from("audit_log")
        .insert({ id: a.id, user_id, evento: a.evento, detalhes: a.detalhes, criado_em: a.criadoEm });
      erro("registrar decisão", error);
    },

    async salvarSeguranca(c) {
      const user_id = await userId();
      const { error } = await supabase.from("safety_settings").upsert(
        {
          user_id,
          limite_bloqueio: c.limiteBloqueio,
          limite_atencao: c.limiteAtencao,
          inchaco_bloqueia: c.inchacoBloqueia,
          falhou_bloqueia: c.falhouBloqueia,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      erro("salvar regras de segurança", error);
    },

    async salvarPerfil(p: Perfil) {
      const user_id = await userId();
      const { nome, restricoes, ...dados } = p;
      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id, nome, dados }, { onConflict: "user_id" });
      erro("salvar perfil", error);

      // restrições na tabela própria; o que você removeu no app sai da lista
      const linhas = restricoes.map((r) => ({
        user_id,
        chave: r.id,
        regiao: r.regiao,
        lado: r.lado,
        tipo: r.tipo,
        nivel_dor: r.nivelDor,
        status: r.status,
        ativa: true,
      }));
      if (linhas.length) {
        const { error: e2 } = await supabase
          .from("restrictions")
          .upsert(linhas, { onConflict: "user_id,chave" });
        erro("salvar restrições", e2);
      }
      const { data: existentes, error: e3 } = await supabase.from("restrictions").select("chave");
      erro("conferir restrições", e3);
      const manter = new Set(restricoes.map((r) => r.id));
      const remover = (existentes ?? [])
        .map((x) => x.chave as string | null)
        .filter((c): c is string => !!c && !manter.has(c));
      if (remover.length) {
        const { error: e4 } = await supabase.from("restrictions").delete().in("chave", remover);
        erro("remover restrições", e4);
      }
    },

    async salvarMarco(m: Marco) {
      const user_id = await userId();
      const { error } = await supabase
        .from("milestones")
        .upsert({ user_id, chave: m.chave, concluido_em: m.concluidoEm }, { onConflict: "user_id,chave" });
      erro("salvar marco", error);
    },

    async salvarFase(f: FaseTornozelo) {
      const user_id = await userId();
      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id, fase_tornozelo: f.fase, fase_inicio: f.inicio }, { onConflict: "user_id" });
      erro("salvar fase do tornozelo", error);
    },

    async exportar() {
      return { exportadoEm: new Date().toISOString(), ...(await carregar("2000-01-01")) };
    },
  };
}
