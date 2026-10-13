import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERFIL_PADRAO } from "../tipos";

type Resposta = { data: unknown; error: { message: string } | null };
type Chamada = { tabela: string; op: string; args: unknown[] };

const estado = vi.hoisted(() => ({
  chamadas: [] as Chamada[],
  respostas: {} as Record<string, Resposta>,
  usuario: { id: "u1" } as { id: string } | null,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () =>
        estado.usuario
          ? { data: { user: estado.usuario }, error: null }
          : { data: { user: null }, error: { message: "sem sessão" } },
    },
    from: (tabela: string) => {
      const resposta = () => estado.respostas[tabela] ?? { data: [], error: null };
      const q: Record<string, unknown> = {};
      const registrar =
        (op: string) =>
        (...args: unknown[]) => {
          estado.chamadas.push({ tabela, op, args });
          return q;
        };
      for (const op of ["select", "eq", "gte", "order", "limit", "not", "in", "delete"])
        q[op] = registrar(op);
      q.upsert = (...args: unknown[]) => {
        estado.chamadas.push({ tabela, op: "upsert", args });
        return Promise.resolve(
          resposta().error ? { data: null, error: resposta().error } : { data: null, error: null },
        );
      };
      q.maybeSingle = () => {
        const r = resposta();
        return Promise.resolve({
          data: Array.isArray(r.data) ? (r.data[0] ?? null) : r.data,
          error: r.error,
        });
      };
      q.then = (ok: (v: Resposta) => unknown) => Promise.resolve(resposta()).then(ok);
      return q;
    },
  }),
}));

import { criarSupabaseRepo } from "./supabase";

const upserts = (tabela: string) => estado.chamadas.filter((c) => c.tabela === tabela && c.op === "upsert");

beforeEach(() => {
  estado.chamadas = [];
  estado.respostas = {};
  estado.usuario = { id: "u1" };
});

describe("supabaseRepo: leitura", () => {
  it("mapeia as linhas do banco para o formato do app", async () => {
    estado.respostas = {
      profiles: {
        data: { nome: "Gabriel", dados: { idade: 22 }, fase_tornozelo: 2, fase_inicio: "2026-11-03" },
        error: null,
      },
      restrictions: {
        data: [
          {
            chave: "tornozelo-direito",
            regiao: "Tornozelo direito",
            lado: "direito",
            tipo: "lesão",
            nivel_dor: 2,
            status: "Em recuperação",
          },
        ],
        error: null,
      },
      checkins: {
        data: [
          {
            data: "2026-10-14",
            dor_tornozelo: 3,
            inchaco: false,
            falhou: false,
            energia: 4,
            sono_faixa: "7_8",
            gatilho: "chute",
            notas: null,
            regioes: ["lateral"],
            movimentos: ["chutar"],
            duracao_dor: "5_10min",
            posterior_apertou: false,
            jogo_id: "j1",
          },
        ],
        error: null,
      },
      session_logs: {
        data: [
          {
            data: "2026-10-14",
            bloco: "qua-forca",
            resultado: "parcial",
            esforco: 6,
            duracao_min: 30,
            notas: "ok",
          },
        ],
        error: null,
      },
      games: {
        data: [
          {
            id: "j1",
            data_hora: "2026-10-13T23:30:00+00:00",
            minutos_jogados: 80,
            esforco_pos_jogo: 7,
            dor_tornozelo: 3,
            gatilho: null,
            notas: null,
            status: "jogado",
          },
        ],
        error: null,
      },
      pre_game_logs: {
        data: [
          {
            jogo_data: "2026-10-13",
            aquecimento_concluido: true,
            fases_concluidas: 5,
            duracao_s: 600,
            tornozeleira: true,
          },
        ],
        error: null,
      },
      safety_settings: {
        data: { limite_bloqueio: 7, limite_atencao: 5, inchaco_bloqueia: true, falhou_bloqueia: false },
        error: null,
      },
      milestones: { data: [{ chave: "30-dias-sem-dor", concluido_em: "2026-11-20" }], error: null },
      milestone_defs: {
        data: [{ chave: "x", titulo: "Marco X", criterio: "c", auto: null, ordem: 1 }],
        error: null,
      },
    };
    const d = await criarSupabaseRepo().carregar("2026-09-01");

    expect(d.faseTornozelo).toEqual({ fase: 2, inicio: "2026-11-03" });
    expect(d.perfil.idade).toBe(22);
    expect(d.perfil.restricoes).toEqual([
      {
        id: "tornozelo-direito",
        regiao: "Tornozelo direito",
        lado: "direito",
        tipo: "lesão",
        nivelDor: 2,
        status: "Em recuperação",
      },
    ]);
    expect(d.checkins[0]).toMatchObject({
      data: "2026-10-14",
      dor: 3,
      sonoFaixa: "7_8",
      regioes: ["lateral"],
      movimentos: ["chutar"],
      duracaoDor: "5_10min",
      jogoId: "j1",
    });
    expect(d.sessoes[0]).toMatchObject({ bloco: "qua-forca", resultado: "parcial", duracaoMin: 30 });
    expect(d.jogos[0]).toMatchObject({
      id: "j1",
      inicio: "2026-10-13T23:30:00.000Z",
      esforco: 7,
      status: "jogado",
    });
    expect(d.preJogos[0]).toMatchObject({ jogoData: "2026-10-13", concluido: true, tornozeleira: true });
    expect(d.seguranca).toEqual({
      limiteBloqueio: 7,
      limiteAtencao: 5,
      inchacoBloqueia: true,
      falhouBloqueia: false,
    });
    expect(d.marcos).toEqual([{ chave: "30-dias-sem-dor", concluidoEm: "2026-11-20" }]);
    expect(d.marcosDefs[0].titulo).toBe("Marco X");
  });

  it("sem linhas no banco usa os padrões (fase 1, tornozelo direito, marcos do código)", async () => {
    estado.respostas = { profiles: { data: null, error: null } };
    const d = await criarSupabaseRepo().carregar("2026-09-01");
    expect(d.faseTornozelo.fase).toBe(1);
    expect(d.perfil.restricoes[0].id).toBe("tornozelo-direito");
    expect(d.perfil.nome).toBe(PERFIL_PADRAO.nome);
    expect(d.marcosDefs.length).toBeGreaterThan(3);
    expect(d.seguranca.limiteBloqueio).toBe(6);
  });

  it("um erro do banco vira exceção com o contexto", async () => {
    estado.respostas = { checkins: { data: null, error: { message: "permission denied" } } };
    await expect(criarSupabaseRepo().carregar("2026-09-01")).rejects.toThrow(/check-ins: permission denied/);
  });
});

describe("supabaseRepo: escrita", () => {
  it("check-in: mapeia colunas e usa a chave (user_id, data)", async () => {
    await criarSupabaseRepo().salvarCheckin({
      data: "2026-10-14",
      dor: 4,
      inchaco: true,
      falhou: false,
      energia: 3,
      sonoFaixa: "5_6",
      gatilho: "giro",
      observacao: "nota",
      regioes: ["lateral", "frente"],
      movimentos: ["correr"],
      duracaoDor: "dia_todo",
      posteriorApertou: true,
      jogoId: "j1",
    });
    const [linha, opcoes] = upserts("checkins")[0].args as [Record<string, unknown>, { onConflict: string }];
    expect(linha).toMatchObject({
      user_id: "u1",
      data: "2026-10-14",
      dor_tornozelo: 4,
      inchaco: true,
      sono_faixa: "5_6",
      notas: "nota",
      regioes: ["lateral", "frente"],
      duracao_dor: "dia_todo",
      posterior_apertou: true,
      jogo_id: "j1",
    });
    expect(opcoes.onConflict).toBe("user_id,data");
  });

  it("sessão 'não fiz' grava concluido = false", async () => {
    await criarSupabaseRepo().salvarSessao({
      data: "2026-10-14",
      bloco: "qua-forca",
      resultado: "nao_fiz",
      esforco: null,
      duracaoMin: null,
      notas: null,
    });
    const [linha, opcoes] = upserts("session_logs")[0].args as [
      Record<string, unknown>,
      { onConflict: string },
    ];
    expect(linha).toMatchObject({ resultado: "nao_fiz", concluido: false, bloco: "qua-forca" });
    expect(opcoes.onConflict).toBe("user_id,data,bloco");
  });

  it("jogo: gera id estável quando falta e grava esforço e status", async () => {
    await criarSupabaseRepo().salvarJogo({
      inicio: "2026-10-13T23:30:00.000Z",
      minutosJogados: 75,
      esforco: 8,
      dor: 2,
      gatilho: null,
      notas: null,
    });
    const [linha, opcoes] = upserts("games")[0].args as [Record<string, unknown>, { onConflict: string }];
    expect(typeof linha.id).toBe("string");
    expect(linha).toMatchObject({
      esforco_pos_jogo: 8,
      dor_tornozelo: 2,
      status: "jogado",
      data_hora: "2026-10-13T23:30:00.000Z",
    });
    expect(opcoes.onConflict).toBe("user_id,data_hora");
  });

  it("pré-jogo e fase do tornozelo", async () => {
    const repo = criarSupabaseRepo();
    await repo.salvarPreJogo({
      jogoData: "2026-10-13",
      concluido: false,
      fasesConcluidas: 3,
      duracaoS: 300,
      tornozeleira: null,
    });
    expect(upserts("pre_game_logs")[0].args[0]).toMatchObject({
      jogo_data: "2026-10-13",
      aquecimento_concluido: false,
      fases_concluidas: 3,
      tornozeleira: null,
    });
    await repo.salvarFase({ fase: 3, inicio: "2026-12-01" });
    expect(upserts("profiles")[0].args[0]).toMatchObject({
      user_id: "u1",
      fase_tornozelo: 3,
      fase_inicio: "2026-12-01",
    });
  });

  it("perfil: restrições removidas no app saem da tabela", async () => {
    estado.respostas = {
      restrictions: { data: [{ chave: "tornozelo-direito" }, { chave: "r-velha" }], error: null },
    };
    await criarSupabaseRepo().salvarPerfil({ ...PERFIL_PADRAO });
    const remocao = estado.chamadas.find((c) => c.tabela === "restrictions" && c.op === "in");
    expect(remocao?.args).toEqual(["chave", ["r-velha"]]);
    expect(upserts("restrictions")[0].args[0]).toHaveLength(1);
  });

  it("sem sessão, a gravação falha com mensagem clara", async () => {
    estado.usuario = null;
    await expect(criarSupabaseRepo().salvarFase({ fase: 2, inicio: "2026-11-03" })).rejects.toThrow(
      /Sessão expirada/,
    );
  });
});
