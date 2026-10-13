import { describe, expect, it } from "vitest";
import { ck, contexto, jogo, QUARTA, serie, ultimosDias } from "./ajudas-teste";
import { avaliarFase } from "./fase";
import { ajusteDoModo, definirModoDoDia, maisConservador } from "./modo";
import { instanteSP } from "../tempo";

const H = "2026-10-14";

describe("definirModoDoDia", () => {
  it("dia tranquilo: Completo e pode progredir", () => {
    const d = definirModoDoDia(contexto(QUARTA, { checkins: [ck(H, 1)] }));
    expect(d.modo).toBe("completo");
    expect(d.podeProgredir).toBe(true);
  });

  it("dor 8: nunca Completo, nunca progride, tem alerta de profissional", () => {
    const d = definirModoDoDia(contexto(QUARTA, { checkins: [ck(H, 8)] }));
    expect(["recuperacao", "folga"]).toContain(d.modo);
    expect(d.podeProgredir).toBe(false);
    expect(d.motivoBloqueio).toBeTruthy();
    expect(d.alertas.some((a) => a.texto.includes("ortopedista"))).toBe(true);
  });

  it("dor 5: no máximo Reduzido", () => {
    const d = definirModoDoDia(contexto(QUARTA, { checkins: [ck(H, 5)] }));
    expect(d.modo).not.toBe("completo");
    expect(d.podeProgredir).toBe(false);
  });

  it("a frase nunca mostra porcentagem", () => {
    const d = definirModoDoDia(contexto(QUARTA, { checkins: [ck(H, 5, { sonoFaixa: "menos_5" })] }));
    expect(d.frase).not.toMatch(/%/);
    expect(d.oQueMudaria).not.toMatch(/%/);
  });

  it("jogo hoje com risco maior avisa sem cancelar", () => {
    const d = definirModoDoDia(contexto("2026-10-17T10:00:00-03:00", { checkins: [ck("2026-10-17", 8)] }));
    expect(d.alertas.some((a) => a.regra === "JOGO")).toBe(true);
  });

  it("propriedade: com bloqueio de segurança o modo nunca é Completo/Reduzido e não progride", () => {
    for (let dor = 0; dor <= 10; dor++) {
      for (const inchaco of [false, true]) {
        for (const falhou of [false, true]) {
          for (const sonoFaixa of ["menos_5", "5_6", "7_8"] as const) {
            const ctx = contexto(QUARTA, { checkins: [ck(H, dor, { inchaco, falhou, sonoFaixa })] });
            const d = definirModoDoDia(ctx);
            if (ctx.seguranca.nivel === "bloqueio") {
              expect(["recuperacao", "folga"]).toContain(d.modo);
            }
            if (!ctx.seguranca.podeProgredir) expect(d.podeProgredir).toBe(false);
            if (d.podeProgredir) expect(d.modo).toBe("completo");
          }
        }
      }
    }
  });

  it("jogo recente derruba a prontidão mas não libera progressão sozinho", () => {
    const inicio = instanteSP("2026-10-13", 20, 30).toISOString();
    const d = definirModoDoDia(
      contexto(QUARTA, { checkins: [ck(H, 1)], jogos: [jogo(inicio, { esforco: 9, dor: 5 })] }),
    );
    expect(d.modo).toBe("recuperacao");
    expect(d.podeProgredir).toBe(false);
  });
});

describe("helpers de modo", () => {
  it("maisConservador escolhe o mais severo", () => {
    expect(maisConservador("completo", "reduzido")).toBe("reduzido");
    expect(maisConservador("folga", "reduzido")).toBe("folga");
  });
  it("ajusteDoModo mapeia folga para recuperação", () => {
    expect(ajusteDoModo("folga")).toBe("recuperacao");
    expect(ajusteDoModo("completo")).toBe("completo");
  });
});

describe("avaliarFase", () => {
  const base = { diasVerdes: 0, series: [], jogos: [], testes: [], podeProgredir: true };
  it("fase 1 sem dados: não apta e 4 critérios", () => {
    const a = avaliarFase({ ...base, fase: 1 });
    expect(a.apto).toBe(false);
    expect(a.criterios).toHaveLength(4);
    expect(a.proxima).toBe(2);
  });
  it("fase 1 completa mas segurança bloqueando: não apta", () => {
    const dias = ultimosDias("2026-10-12", 5);
    const series = [
      ...dias.flatMap((d) => [1, 2, 3].map((n) => serie(d, "pant-degrau", n, { reps: 12 }))),
      ...dias
        .slice(2)
        .flatMap((d) => [1, 2, 3].map((n) => serie(d, "eq-um-pe", n, { reps: null, duracaoS: 30 }))),
      ...["el-fora", "el-dentro", "el-cima"].flatMap((s) =>
        dias.slice(2).flatMap((d) => [1, 2, 3].map((n) => serie(d, s, n, { reps: 15 }))),
      ),
    ];
    expect(avaliarFase({ ...base, fase: 1, diasVerdes: 7, series }).apto).toBe(true);
    expect(avaliarFase({ ...base, fase: 1, diasVerdes: 7, series, podeProgredir: false }).apto).toBe(false);
  });
  it("dor 4 durante o exercício quebra a sequência", () => {
    const dias = ultimosDias("2026-10-12", 5);
    const series = dias.flatMap((d, i) =>
      [1, 2, 3].map((n) => serie(d, "pant-degrau", n, { reps: 12, dorDurante: i === 4 && n === 2 ? 4 : 0 })),
    );
    const c = avaliarFase({ ...base, fase: 1, diasVerdes: 7, series }).criterios[1];
    expect(c.ok).toBe(false);
  });
  it("fase 2 exige 14 dias verdes e jogos com dor baixa", () => {
    const a = avaliarFase({ ...base, fase: 2, diasVerdes: 14 });
    expect(a.criterios[0].ok).toBe(true);
    expect(a.apto).toBe(false);
  });
  it("fase 3 exige simetria de 90% no T5", () => {
    const t = (pe: "direito" | "esquerdo", valor: number) => ({
      tipo: "T5" as const,
      pe,
      valor,
      unidade: "cm",
      data: H,
      menorEhMelhor: false,
    });
    const ruim = avaliarFase({ ...base, fase: 3, testes: [t("direito", 200), t("esquerdo", 170)] });
    expect(ruim.criterios[2].ok).toBe(false);
    const boa = avaliarFase({ ...base, fase: 3, testes: [t("direito", 200), t("esquerdo", 185)] });
    expect(boa.criterios[2].ok).toBe(true);
  });
  it("fase 4 não tem próxima", () => {
    expect(avaliarFase({ ...base, fase: 4 }).proxima).toBeNull();
  });
});
