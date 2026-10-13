import { describe, expect, it } from "vitest";
import { instanteSP } from "../tempo";
import type { ExcecaoAgenda } from "../tipos";
import { ck, contexto, jogo, QUARTA, serie, sess, ultimosDias } from "./ajudas-teste";
import { definirModoDoDia } from "./modo";
import type { RegraDisparada } from "./tipos";

const regras = (
  agora: string,
  dados: Parameters<typeof contexto>[1] = {},
  testes: Parameters<typeof contexto>[2] = [],
) => definirModoDoDia(contexto(agora, dados, testes)).regras;
const ids = (r: RegraDisparada[]) => r.map((x) => x.id);
const tem = (r: RegraDisparada[], id: string) => ids(r).includes(id);
const porId = (r: RegraDisparada[], id: string) => r.find((x) => x.id === id)!;

const H = "2026-10-14";
const ONTEM = "2026-10-13";
const ANTEONTEM = "2026-10-12";

describe("R01: dor forte, inchaço ou falha", () => {
  it("dispara com dor 7: Recuperação, sem progressão, alerta e plano de retorno", () => {
    const r = regras(QUARTA, { checkins: [ck(H, 7)] });
    expect(tem(r, "R01")).toBe(true);
    const e = porId(r, "R01").efeitos;
    expect(e.modoMax).toBe("recuperacao");
    expect(e.bloqueiaProgressao).toBe(true);
    expect(e.semPliometria && e.semVelocidade).toBe(true);
    expect(e.planoSugerido).toBe("P4");
    expect(e.alertas?.[0].texto).toContain("ortopedista ou fisioterapeuta");
  });
  it("dispara com inchaço ou falha mesmo com dor 0", () => {
    expect(tem(regras(QUARTA, { checkins: [ck(H, 0, { inchaco: true })] }), "R01")).toBe(true);
    expect(tem(regras(QUARTA, { checkins: [ck(H, 0, { falhou: true })] }), "R01")).toBe(true);
  });
  it("não dispara com dor 2", () => {
    expect(tem(regras(QUARTA, { checkins: [ck(H, 2)] }), "R01")).toBe(false);
  });
});

describe("R02: dor moderada (4 a 5)", () => {
  it("dispara com dor 5: Reduzido, sem progressão, troca impacto e pergunta o movimento", () => {
    const r = regras(QUARTA, { checkins: [ck(H, 5)] });
    const e = porId(r, "R02").efeitos;
    expect(e.modoMax).toBe("reduzido");
    expect(e.bloqueiaProgressao).toBe(true);
    expect(e.substituicoes?.[0]).toContain("impacto");
    expect(e.acoes?.[0].id).toBe("perguntar_movimento");
  });
  it("não pergunta o movimento se o check-in já informou", () => {
    const r = regras(QUARTA, { checkins: [ck(H, 4, { movimentos: ["chutar"] })] });
    expect(porId(r, "R02").efeitos.acoes).toEqual([]);
  });
  it("não dispara com dor 2 nem com dor 7 (esse é o R01)", () => {
    expect(tem(regras(QUARTA, { checkins: [ck(H, 2)] }), "R02")).toBe(false);
    expect(tem(regras(QUARTA, { checkins: [ck(H, 7)] }), "R02")).toBe(false);
  });
});

describe("R03: sono menor que 5 h por 2 dias seguidos", () => {
  it("dispara: Reduzido, sem sprint máximo e cartão para dormir", () => {
    const r = regras(QUARTA, {
      checkins: [ck(ONTEM, 0, { sonoFaixa: "menos_5" }), ck(H, 0, { sonoFaixa: "menos_5" })],
    });
    const e = porId(r, "R03").efeitos;
    expect(e.modoMax).toBe("reduzido");
    expect(e.semSprintMaximo).toBe(true);
    expect(e.acoes?.[0].id).toBe("priorizar_sono");
  });
  it("não dispara com um dia só, nem com dias não seguidos", () => {
    expect(tem(regras(QUARTA, { checkins: [ck(H, 0, { sonoFaixa: "menos_5" })] }), "R03")).toBe(false);
    expect(
      tem(
        regras(QUARTA, {
          checkins: [ck("2026-10-11", 0, { sonoFaixa: "menos_5" }), ck(H, 0, { sonoFaixa: "menos_5" })],
        }),
        "R03",
      ),
    ).toBe(false);
    expect(
      tem(
        regras(QUARTA, {
          checkins: [ck(ONTEM, 0, { sonoFaixa: "5_6" }), ck(H, 0, { sonoFaixa: "menos_5" })],
        }),
        "R03",
      ),
    ).toBe(false);
  });
});

describe("R04: jogo pesado com dor depois", () => {
  const inicio = instanteSP(ONTEM, 20, 30).toISOString();
  it("dispara no dia seguinte: Recuperação e foco no tornozelo", () => {
    const r = regras(QUARTA, { jogos: [jogo(inicio, { esforco: 9, dor: 5 })], checkins: [ck(H, 1)] });
    expect(porId(r, "R04").efeitos.modoMax).toBe("recuperacao");
    expect(porId(r, "R04").efeitos.acoes?.[0].id).toBe("foco_tornozelo");
  });
  it("não dispara com esforço 7 ou dor 3, nem muito depois", () => {
    expect(tem(regras(QUARTA, { jogos: [jogo(inicio, { esforco: 7, dor: 5 })] }), "R04")).toBe(false);
    expect(tem(regras(QUARTA, { jogos: [jogo(inicio, { esforco: 9, dor: 3 })] }), "R04")).toBe(false);
    expect(
      tem(regras("2026-10-16T09:00:00-03:00", { jogos: [jogo(inicio, { esforco: 9, dor: 5 })] }), "R04"),
    ).toBe(false);
  });
});

describe("R05: duas sessões seguidas 'não fiz'", () => {
  it("dispara e pergunta o motivo com chips", () => {
    const r = regras(QUARTA, {
      sessoes: [sess(ANTEONTEM, "seg-forca", "nao_fiz"), sess(ONTEM, "ter-mobilidade", "nao_fiz")],
    });
    const a = porId(r, "R05").efeitos.acoes?.[0];
    expect(a?.id).toBe("perguntar_motivo");
    expect(a?.opcoes).toEqual(["Sem tempo", "Cansado", "Dor", "Agenda", "Outro"]);
  });
  it("não dispara se a mais recente foi feita", () => {
    const r = regras(QUARTA, {
      sessoes: [sess(ANTEONTEM, "seg-forca", "nao_fiz"), sess(ONTEM, "ter-mobilidade", "feito")],
    });
    expect(tem(r, "R05")).toBe(false);
    expect(tem(regras(QUARTA, { sessoes: [sess(ONTEM, "ter-mobilidade", "nao_fiz")] }), "R05")).toBe(false);
  });
});

describe("R06: semana completa propõe progressão", () => {
  const dias = ultimosDias(H, 7);
  const checkins = dias.map((d) => ck(d, 1));
  const blocosDaSemana: [string, string][] = [
    ["2026-10-08", "qui-tornozelo"],
    ["2026-10-08", "qui-noite"],
    ["2026-10-09", "sex-tornozelo"],
    ["2026-10-09", "sex-mobilidade"],
    ["2026-10-09", "sex-noite"],
    ["2026-10-10", "sab-ativacao"],
    ["2026-10-12", "seg-tornozelo"],
    ["2026-10-12", "seg-forca"],
    ["2026-10-12", "seg-noite"],
    ["2026-10-13", "ter-tornozelo"],
    ["2026-10-13", "ter-mobilidade"],
  ];
  const semanaCompleta = blocosDaSemana.map(([d, b]) => sess(d, b));
  const topo = ["2026-10-05", "2026-09-30"].flatMap((d) =>
    [1, 2, 3].map((n) => serie(d, "stiff", n, { reps: 8, cargaKg: 40 })),
  );

  it("dispara com 90%+ das sessões, dor ≤ 3, 7 dias verdes e exercício no topo da faixa", () => {
    const r = regras(QUARTA, { checkins, sessoes: semanaCompleta, series: topo });
    const p = porId(r, "R06").efeitos.propostas?.[0];
    expect(p?.tipo).toBe("progressao_carga");
    expect(p?.payload).toMatchObject({ slug: "stiff", deKg: 40, paraKg: 41.5 });
  });
  it("não dispara se a semana ficou incompleta", () => {
    const r = regras(QUARTA, { checkins, sessoes: semanaCompleta.slice(0, 5), series: topo });
    expect(tem(r, "R06")).toBe(false);
  });
  it("não dispara com bloqueio de segurança no meio", () => {
    const comBloqueio = checkins.map((c) => (c.data === "2026-10-12" ? ck(c.data, 8) : c));
    expect(tem(regras(QUARTA, { checkins: comBloqueio, sessoes: semanaCompleta, series: topo }), "R06")).toBe(
      false,
    );
  });
  it("não dispara sem exercício pronto para subir", () => {
    expect(tem(regras(QUARTA, { checkins, sessoes: semanaCompleta, series: [] }), "R06")).toBe(false);
  });
});

describe("R07: descarga", () => {
  it("dispara com prontidão baixa por 5 dias", () => {
    const checkins = ultimosDias(H, 5).map((d) => ck(d, 5, { sonoFaixa: "menos_5", energia: 1 }));
    const r = regras(QUARTA, { checkins });
    const p = porId(r, "R07").efeitos.propostas?.[0];
    expect(p?.tipo).toBe("descarga");
    expect(p?.payload).toMatchObject({ template: "P3" });
  });
  it("dispara com 3 semanas seguidas de carga crescente (> 15%)", () => {
    const s = [
      sess("2026-10-10", "qua-forca", "feito", 20, 10), // janela atual: 200
      sess("2026-10-03", "qua-forca", "feito", 15, 10), // 150
      sess("2026-09-26", "qua-forca", "feito", 12, 10), // 120
      sess("2026-09-19", "qua-forca", "feito", 10, 10), // 100
    ];
    expect(tem(regras(QUARTA, { sessoes: s, checkins: [ck(H, 0)] }), "R07")).toBe(true);
  });
  it("não dispara com os dados normais", () => {
    expect(tem(regras(QUARTA, { checkins: ultimosDias(H, 5).map((d) => ck(d, 1)) }), "R07")).toBe(false);
  });
  it("não dispara com poucos check-ins mesmo que a pontuação estimada seja baixa", () => {
    expect(tem(regras(QUARTA, { checkins: [ck(H, 5, { sonoFaixa: "menos_5", energia: 1 })] }), "R07")).toBe(
      false,
    );
  });
});

describe("R08: jogo extra ou cancelado", () => {
  const ex = (data: string, tipo: ExcecaoAgenda["tipo"]): ExcecaoAgenda => ({
    id: `${tipo}-${data}`,
    data,
    tipo,
  });
  it("dispara com jogo extra nos próximos 7 dias", () => {
    const r = regras(QUARTA, { excecoes: [ex("2026-10-15", "jogo_extra")] });
    expect(porId(r, "R08").efeitos.recalcularCarga).toBe(true);
  });
  it("dispara com jogo cancelado", () => {
    expect(tem(regras(QUARTA, { excecoes: [ex("2026-10-17", "jogo_cancelado")] }), "R08")).toBe(true);
  });
  it("não dispara sem exceção, nem com exceção distante ou de outro tipo", () => {
    expect(tem(regras(QUARTA, {}), "R08")).toBe(false);
    expect(tem(regras(QUARTA, { excecoes: [ex("2026-11-20", "jogo_extra")] }), "R08")).toBe(false);
    expect(tem(regras(QUARTA, { excecoes: [ex("2026-10-15", "viagem")] }), "R08")).toBe(false);
  });
});

describe("R09: aquecimento e dor depois do jogo", () => {
  const inicio = instanteSP(ONTEM, 20, 30).toISOString();
  it("dispara com o registro do aquecimento", () => {
    const r = regras(QUARTA, {
      jogos: [jogo(inicio, { dor: 3 })],
      preJogos: [{ jogoData: ONTEM, concluido: true, fasesConcluidas: 5, duracaoS: 600, tornozeleira: true }],
    });
    expect(porId(r, "R09").mensagem).toContain("Aquecimento completo");
  });
  it("não dispara sem registro de aquecimento", () => {
    expect(tem(regras(QUARTA, { jogos: [jogo(inicio, { dor: 3 })] }), "R09")).toBe(false);
  });
});

describe("R10: desempenho caiu no teste de campo", () => {
  const t1 = (data: string, valor: number) => ({
    tipo: "T1" as const,
    valor,
    unidade: "s",
    data,
    menorEhMelhor: true,
  });
  const t5 = (data: string, valor: number) => ({
    tipo: "T5" as const,
    pe: "direito" as const,
    valor,
    unidade: "cm",
    data,
    menorEhMelhor: false,
  });
  it("dispara quando o sprint piora 5% ou mais", () => {
    const r = regras(QUARTA, {}, [t1("2026-09-14", 3.4), t1("2026-10-12", 3.6)]);
    expect(porId(r, "R10").efeitos.bloqueiaProgressao).toBe(true);
  });
  it("dispara quando o salto cai 5% ou mais", () => {
    expect(tem(regras(QUARTA, {}, [t5("2026-09-14", 200), t5("2026-10-12", 188)]), "R10")).toBe(true);
  });
  it("não dispara com queda menor que 5%, melhora ou teste único", () => {
    expect(tem(regras(QUARTA, {}, [t1("2026-09-14", 3.4), t1("2026-10-12", 3.5)]), "R10")).toBe(false);
    expect(tem(regras(QUARTA, {}, [t1("2026-09-14", 3.6), t1("2026-10-12", 3.4)]), "R10")).toBe(false);
    expect(tem(regras(QUARTA, {}, [t1("2026-10-12", 3.4)]), "R10")).toBe(false);
  });
});

describe("R11: dor durante o exercício", () => {
  it("dor 4 a 5: avisa e sugere a versão mais leve", () => {
    const r = regras(QUARTA, {
      series: [serie(H, "pant-degrau", 1, { dorDurante: 4 })],
      checkins: [ck(H, 1)],
    });
    expect(porId(r, "R11").efeitos.substituicoes?.[0]).toContain("mais leve");
    expect(porId(r, "R11").efeitos.modoMax).toBeUndefined();
  });
  it("dor 6 ou mais: Recuperação e pede o check-in", () => {
    const r = regras(QUARTA, { series: [serie(H, "pant-degrau", 1, { dorDurante: 7 })] });
    expect(porId(r, "R11").efeitos.modoMax).toBe("recuperacao");
    expect(porId(r, "R11").efeitos.acoes?.[0].id).toBe("abrir_checkin");
  });
  it("não dispara com dor 3 ou de outro dia", () => {
    expect(tem(regras(QUARTA, { series: [serie(H, "pant-degrau", 1, { dorDurante: 3 })] }), "R11")).toBe(
      false,
    );
    expect(tem(regras(QUARTA, { series: [serie(ONTEM, "pant-degrau", 1, { dorDurante: 8 })] }), "R11")).toBe(
      false,
    );
  });
});

describe("R12: funcional pesado ontem", () => {
  const SEGUNDA_NOITE = "2026-10-12";
  const TERCA = "2026-10-13T09:00:00-03:00";
  it("dispara com esforço 8 ou mais", () => {
    const r = regras(TERCA, { sessoes: [sess(SEGUNDA_NOITE, "seg-noite", "feito", 9, 60)] });
    expect(porId(r, "R12").efeitos.modoMax).toBe("reduzido");
  });
  it("não dispara com esforço menor, nem com outro tipo de sessão", () => {
    expect(tem(regras(TERCA, { sessoes: [sess(SEGUNDA_NOITE, "seg-noite", "feito", 6, 60)] }), "R12")).toBe(
      false,
    );
    expect(tem(regras(TERCA, { sessoes: [sess(SEGUNDA_NOITE, "seg-forca", "feito", 9, 40)] }), "R12")).toBe(
      false,
    );
  });
});

describe("R13: meta de sono", () => {
  it("dispara com 5 de 7 noites de 7 h ou mais", () => {
    const checkins = ultimosDias(H, 7).map((d, i) => ck(d, 0, { sonoFaixa: i < 5 ? "7_8" : "5_6" }));
    expect(porId(regras(QUARTA, { checkins }), "R13").efeitos.reconhecimento).toContain("5 de 7");
  });
  it("não dispara com 4 noites", () => {
    const checkins = ultimosDias(H, 7).map((d, i) => ck(d, 0, { sonoFaixa: i < 4 ? "7_8" : "5_6" }));
    expect(tem(regras(QUARTA, { checkins }), "R13")).toBe(false);
  });
});

describe("R14: marco atingido", () => {
  const trintaDias = ultimosDias(H, 30).map((d) => ck(d, 1));
  it("dispara com 30 dias seguidos sem dor acima de 3", () => {
    expect(porId(regras(QUARTA, { checkins: trintaDias }), "R14").efeitos.marcos).toContain(
      "30-dias-sem-dor",
    );
  });
  it("não dispara se o marco já foi concluído ou faltam dias", () => {
    expect(
      tem(
        regras(QUARTA, {
          checkins: trintaDias,
          marcos: [{ chave: "30-dias-sem-dor", concluidoEm: "2026-10-01" }],
        }),
        "R14",
      ),
    ).toBe(false);
    expect(tem(regras(QUARTA, { checkins: trintaDias.slice(5) }), "R14")).toBe(false);
  });
});

describe("R15: sem check-in há 3 dias", () => {
  it("dispara com o último check-in há 5 dias", () => {
    expect(porId(regras(QUARTA, { checkins: [ck("2026-10-09", 1)] }), "R15").efeitos.acoes?.[0].id).toBe(
      "checkin_leve",
    );
  });
  it("não dispara com check-in recente ou sem nenhum", () => {
    expect(tem(regras(QUARTA, { checkins: [ck(ONTEM, 1)] }), "R15")).toBe(false);
    expect(tem(regras(QUARTA, {}), "R15")).toBe(false);
  });
});

describe("R16: fase apta a avançar", () => {
  const dias = ultimosDias(H, 8);
  const checkins = dias.map((d) => ck(d, 1));
  const sessoes5 = ultimosDias("2026-10-12", 5);
  const series = [
    ...sessoes5.flatMap((d) => [1, 2, 3].map((n) => serie(d, "pant-degrau", n, { reps: 12 }))),
    ...ultimosDias("2026-10-12", 3).flatMap((d) =>
      [1, 2, 3].map((n) => serie(d, "eq-um-pe", n, { reps: null, duracaoS: 30 })),
    ),
    ...["el-fora", "el-dentro", "el-cima"].flatMap((s) =>
      ultimosDias("2026-10-12", 3).flatMap((d) => [1, 2, 3].map((n) => serie(d, s, n, { reps: 15 }))),
    ),
  ];
  it("dispara com todos os critérios da fase 1 e propõe a fase 2 com checklist", () => {
    const r = regras(QUARTA, { checkins, series });
    const p = porId(r, "R16").efeitos.propostas?.[0];
    expect(p?.tipo).toBe("fase");
    expect(p?.payload).toEqual({ de: 1, para: 2 });
    expect(p?.criterios.every((c) => c.ok)).toBe(true);
    expect(p?.resumo).toContain("fisioterapeuta ou ortopedista");
  });
  it("não dispara com um critério faltando", () => {
    expect(tem(regras(QUARTA, { checkins: checkins.slice(4), series }), "R16")).toBe(false);
    expect(
      tem(regras(QUARTA, { checkins, series: series.filter((s) => s.exercicio !== "eq-um-pe") }), "R16"),
    ).toBe(false);
  });
  it("não dispara com a segurança bloqueando", () => {
    const comBloqueio = checkins.map((c, i) => (i === 5 ? ck(c.data, 7) : c));
    expect(tem(regras(QUARTA, { checkins: comBloqueio, series }), "R16")).toBe(false);
  });
});

describe("R17: como o tornozelo respondeu ao jogo", () => {
  const inicio = instanteSP(ONTEM, 20, 30).toISOString();
  const j = (extra = {}) => jogo(inicio, { id: "jogo-1", esforco: 9, dor: 3, ...extra });
  it("dispara no dia seguinte e, com jogo pesado e dor 4+, vira Recuperação", () => {
    const r = regras(QUARTA, { jogos: [j()], checkins: [ck(H, 4, { jogoId: "jogo-1" })] });
    expect(porId(r, "R17").mensagem).toContain("Dor depois do jogo: 3 → hoje: 4");
    expect(porId(r, "R17").efeitos.modoMax).toBe("recuperacao");
  });
  it("com dor baixa no dia seguinte só informa, sem mudar o modo", () => {
    const r = regras(QUARTA, { jogos: [j()], checkins: [ck(H, 1, { jogoId: "jogo-1" })] });
    expect(porId(r, "R17").efeitos.modoMax).toBeUndefined();
  });
  it("não dispara sem o check-in do dia seguinte", () => {
    expect(tem(regras(QUARTA, { jogos: [j()], checkins: [ck(ONTEM, 1)] }), "R17")).toBe(false);
  });
});

describe("R18: dia de descanso", () => {
  it("dispara no domingo", () => {
    expect(porId(regras("2026-10-18T10:00:00-03:00", {}), "R18").efeitos.aneisDescanso).toBe(true);
  });
  it("dispara no modo Folga (prontidão muito baixa) em dia de semana", () => {
    // dor 5 (-20), sono <5 h (-20), energia 1 (-15), jogo há menos de 24 h (-10) -> 35; mais "sem check-in de hoje" (-10) -> 25
    const inicio = instanteSP(ONTEM, 20, 30).toISOString();
    const r = regras(QUARTA, {
      checkins: [ck(ONTEM, 5, { sonoFaixa: "menos_5", energia: 1 })],
      jogos: [jogo(inicio, { dor: 2, esforco: 5 })],
    });
    expect(tem(r, "R18")).toBe(true);
  });
  it("não dispara em dia normal", () => {
    expect(tem(regras(QUARTA, { checkins: [ck(H, 1)] }), "R18")).toBe(false);
  });
});

describe("catálogo de regras", () => {
  it("tem as 18 regras, de R01 a R18", async () => {
    const { REGRAS } = await import("./regras");
    expect(REGRAS.map((r) => r.id)).toEqual(
      Array.from({ length: 18 }, (_, i) => `R${String(i + 1).padStart(2, "0")}`),
    );
  });
  it("toda regra disparada explica a si mesma: dados e o que mudaria", () => {
    const r = regras(QUARTA, { checkins: [ck(H, 7)] });
    for (const x of r) {
      expect(x.mensagem.length).toBeGreaterThan(0);
      expect(x.porque.dados.length).toBeGreaterThan(0);
      expect(x.porque.mudaria.length).toBeGreaterThan(0);
    }
  });
});
