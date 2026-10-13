import { createClient } from "@/lib/supabase/client";
import { SEGURANCA_PADRAO } from "@/lib/safety";
import {
  PERFIL_PADRAO,
  type Checkin,
  type DadosApp,
  type Gatilho,
  type Jogo,
  type Marco,
  type Perfil,
  type Resultado,
  type Sessao,
  type SonoFaixa,
} from "@/lib/tipos";
import type { Repo } from "./tipos";

function erro(contexto: string, e: { message: string } | null) {
  if (e) throw new Error(`${contexto}: ${e.message}`);
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
    const [perfilR, checkinsR, sessoesR, jogosR, segR, marcosR] = await Promise.all([
      supabase.from("profiles").select("nome, dados").maybeSingle(),
      supabase
        .from("checkins")
        .select("data, dor_tornozelo, inchaco, falhou, energia, sono_faixa, gatilho, notas")
        .gte("data", desdeISO)
        .order("data"),
      supabase
        .from("session_logs")
        .select("data, bloco, resultado, esforco, duracao_min, notas")
        .gte("data", desdeISO)
        .not("bloco", "is", null),
      supabase
        .from("games")
        .select("data_hora, minutos_jogados, dor_tornozelo, gatilho, notas")
        .gte("data_hora", `${desdeISO}T00:00:00Z`)
        .order("data_hora"),
      supabase.from("safety_settings").select("*").maybeSingle(),
      supabase.from("milestones").select("chave, concluido_em"),
    ]);

    erro("perfil", perfilR.error);
    erro("check-ins", checkinsR.error);
    erro("sessões", sessoesR.error);
    erro("jogos", jogosR.error);
    erro("regras de segurança", segR.error);
    erro("marcos", marcosR.error);

    const dados = (perfilR.data?.dados ?? {}) as Partial<Perfil>;
    const perfil: Perfil = {
      ...PERFIL_PADRAO,
      ...dados,
      nome: perfilR.data?.nome || PERFIL_PADRAO.nome,
    };

    const seg = segR.data;
    return {
      perfil,
      checkins: (checkinsR.data ?? []).map((r) => ({
        data: r.data as string,
        dor: (r.dor_tornozelo as number | null) ?? 0,
        inchaco: !!r.inchaco,
        falhou: !!r.falhou,
        energia: (r.energia as number | null) ?? null,
        sonoFaixa: (r.sono_faixa as SonoFaixa | null) ?? null,
        gatilho: (r.gatilho as Gatilho | null) ?? null,
        observacao: (r.notas as string | null) ?? null,
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
        inicio: new Date(r.data_hora as string).toISOString(),
        minutosJogados: (r.minutos_jogados as number | null) ?? null,
        dor: (r.dor_tornozelo as number | null) ?? null,
        gatilho: (r.gatilho as Gatilho | null) ?? null,
        notas: (r.notas as string | null) ?? null,
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
          user_id,
          data_hora: j.inicio,
          minutos_jogados: j.minutosJogados,
          dor_tornozelo: j.dor,
          gatilho: j.gatilho,
          notas: j.notas,
        },
        { onConflict: "user_id,data_hora" },
      );
      erro("salvar jogo", error);
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
      const { nome, ...dados } = p;
      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id, nome, dados }, { onConflict: "user_id" });
      erro("salvar perfil", error);
    },

    async salvarMarco(m: Marco) {
      const user_id = await userId();
      const { error } = await supabase
        .from("milestones")
        .upsert({ user_id, chave: m.chave, concluido_em: m.concluidoEm }, { onConflict: "user_id,chave" });
      erro("salvar marco", error);
    },

    async exportar() {
      return { exportadoEm: new Date().toISOString(), ...(await carregar("2000-01-01")) };
    },
  };
}
