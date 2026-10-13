import { describe, expect, it } from "vitest";
import { ck, dadosBase, jogo, serie, sess } from "../coach/ajudas-teste";
import { calcularInsights, MIN_OBSERVACOES } from "../coach/insights";
import { diarioVazio, limparItens, sentido, temConteudo, tendencia } from "../diario";
import { instanteSP } from "../tempo";
import { decisaoDoDia, getDiaResumo, statusDoBloco } from "./dia";
import {
  emPlato,
  fraseDaComparacao,
  parSugerido,
  recordes,
  sessoesDoExercicio,
  statusDaComparacao,
  statusDoGrafico,
} from "./exercicios";

const HOJE = "2026-10-14";

describe("getDiaResumo", () => {
  it("dia futuro mostra o planejado como pendente, sem erro", () => {
    const r = getDiaResumo("2026-10-16", dadosBase(), HOJE);
    expect(r.futuro).toBe(true);
    expect(r.blocos.length).toBeGreaterThan(0);
    expect(r.blocos.every((b) => b.status === "pendente")).toBe(true);
    expect(r.checkin).toBeNull();
  });
  it("dia passado sem registro mostra 'sem registro'", () => {
    const r = getDiaResumo("2026-10-12", dadosBase(), HOJE);
    expect(r.blocos.every((b) => b.status === "sem_registro")).toBe(true);
    expect(r.feitos).toBe(0);
  });
  it("conta feitos e parciais e junta a carga do dia", () => {
    const d = dadosBase({
      sessoes: [
        sess("2026-10-12", "seg-tornozelo", "feito", 5, 20),
        sess("2026-10-12", "seg-forca", "parcial", 6, 30),
      ],
      checkins: [ck("2026-10-12", 5)],
    });
    const r = getDiaResumo("2026-10-12", d, HOJE);
    expect(r.feitos).toBe(2);
    expect(r.cargaTotal).toBe(5 * 20 + 6 * 30);
    expect(r.carga).toHaveLength(2);
    expect(r.corDor).toBe("amarelo");
  });
  it("domingo é descanso", () => {
    expect(getDiaResumo("2026-10-18", dadosBase(), HOJE).descanso).toBe(true);
  });
  it("tem o jogo planejado no sábado e o registro quando existe", () => {
    const inicio = instanteSP("2026-10-17", 20, 30).toISOString();
    const r = getDiaResumo("2026-10-17", dadosBase({ jogos: [jogo(inicio)] }), HOJE);
    expect(r.jogoPlanejado).toBe(true);
    expect(r.jogo?.minutosJogados).toBe(75);
  });
  it("statusDoBloco", () => {
    expect(statusDoBloco(undefined, "2026-10-12", HOJE)).toBe("sem_registro");
    expect(statusDoBloco(undefined, HOJE, HOJE)).toBe("pendente");
    expect(statusDoBloco(sess(HOJE, "x", "nao_fiz"), HOJE, HOJE)).toBe("nao_fiz");
  });
  it("a decisão de um dia passado usa só os registros até aquele dia", () => {
    const d = dadosBase({ checkins: [ck("2026-10-12", 1), ck("2026-10-13", 9)] });
    expect(decisaoDoDia("2026-10-12", d).podeProgredir).toBe(true);
    expect(decisaoDoDia("2026-10-13", d).podeProgredir).toBe(false);
  });
});

describe("evolução por exercício", () => {
  const s = (data: string, kg: number, reps = 8, extra = {}) =>
    [1, 2, 3].map((n) => serie(data, "stiff", n, { cargaKg: kg, reps, ...extra }));

  it("agrupa por sessão com carga, repetições e volume", () => {
    const r = sessoesDoExercicio([...s("2026-09-01", 40), ...s("2026-09-08", 42.5)], "stiff");
    expect(r).toHaveLength(2);
    expect(r[1].cargaMaxKg).toBe(42.5);
    expect(r[1].volume).toBe(3 * 8 * 42.5);
  });
  it("gráfico só com 3 sessões; comparação com 2; diz quantas faltam", () => {
    const um = sessoesDoExercicio(s("2026-09-01", 40), "stiff");
    expect(statusDoGrafico(um)).toMatchObject({ pode: false, faltam: 2 });
    expect(statusDaComparacao(um)).toMatchObject({ pode: false, faltam: 1 });
    const tres = sessoesDoExercicio(
      [...s("2026-09-01", 40), ...s("2026-09-08", 40), ...s("2026-09-15", 42.5)],
      "stiff",
    );
    expect(statusDoGrafico(tres).pode).toBe(true);
    expect(statusDaComparacao(tres).pode).toBe(true);
  });
  it("recordes", () => {
    const r = recordes(sessoesDoExercicio([...s("2026-09-01", 40, 8), ...s("2026-09-08", 45, 6)], "stiff"));
    expect(r.cargaKg).toBe(45);
    expect(r.reps).toBe(8);
  });
  it("sugere a última sessão e a mais próxima de 4 semanas antes", () => {
    const sessoes = sessoesDoExercicio(
      [...s("2026-08-01", 30), ...s("2026-09-14", 40), ...s("2026-09-30", 41), ...s("2026-10-12", 42.5)],
      "stiff",
    );
    const par = parSugerido(sessoes)!;
    expect(par[1].data).toBe("2026-10-12");
    expect(par[0].data).toBe("2026-09-14");
    expect(parSugerido(sessoes.slice(0, 1))).toBeNull();
  });
  it("a frase usa só o que foi registrado", () => {
    const antes = sessoesDoExercicio(s("2026-09-14", 40, 8, { esforco: "duro" }), "stiff")[0];
    const depois = sessoesDoExercicio(s("2026-10-12", 40, 8, { esforco: "ok" }), "stiff")[0];
    expect(fraseDaComparacao(antes, depois)).toBe("Mesmas repetições, esforço menor.");
    const sem = sessoesDoExercicio(
      [serie("2026-10-12", "stiff", 1, { reps: null, esforco: null })],
      "stiff",
    )[0];
    expect(fraseDaComparacao(sem, sem)).toContain("Sem carga");
  });
  it("platô: carga parada há 4 semanas", () => {
    const ses = sessoesDoExercicio(
      [...s("2026-08-20", 40), ...s("2026-09-10", 40), ...s("2026-09-24", 40), ...s("2026-10-08", 40)],
      "stiff",
    );
    expect(emPlato(ses, HOJE)).toBe(true);
    const subindo = sessoesDoExercicio(
      [...s("2026-08-20", 40), ...s("2026-09-10", 40), ...s("2026-09-24", 42.5), ...s("2026-10-08", 45)],
      "stiff",
    );
    expect(emPlato(subindo, HOJE)).toBe(false);
  });
});

describe("diário do centroavante", () => {
  const dia = (jogoData: string, condicao: number) => ({ ...diarioVazio(jogoData), condicao });
  it("média móvel de 5 jogos", () => {
    const t = tendencia(
      [1, 2, 3, 4, 5, 6].map((n) => dia(`2026-09-0${n}`, n)),
      "condicao",
    );
    expect(t).toHaveLength(6);
    expect(t[5].mediaMovel).toBe(4);
    expect(t[1].mediaMovel).toBe(1.5);
  });
  it("sentido precisa de 6 jogos", () => {
    const poucos = tendencia(
      [1, 2, 3].map((n) => dia(`2026-09-0${n}`, n)),
      "condicao",
    );
    expect(sentido(poucos)).toBeNull();
    const sobe = tendencia(
      [1, 1, 1, 1, 1, 5].map((v, i) => dia(`2026-09-0${i + 1}`, v)),
      "condicao",
    );
    expect(sentido(sobe)).toBe("sobe");
  });
  it("vazio não tem conteúdo; limpa e limita os textos", () => {
    expect(temConteudo(diarioVazio("2026-10-10"))).toBe(false);
    expect(temConteudo({ ...diarioVazio("2026-10-10"), gols: 0 })).toBe(true);
    expect(limparItens([" a ", "", "b", "c"])).toEqual(["a", "b"]);
  });
});

describe("insights", () => {
  it("sem dados nenhum insight aparece e todos dizem o que falta", () => {
    const todos = calcularInsights(dadosBase(), HOJE);
    expect(todos).toHaveLength(10);
    for (const i of todos) {
      expect(i.disponivel).toBe(false);
      expect(i.frase).toBeNull();
    }
  });
  it("não aparece com menos de 10 observações", () => {
    const checkins = Array.from({ length: 9 }, (_, i) =>
      ck(`2026-10-0${i + 1}`, i < 5 ? 1 : 4, { sonoFaixa: i < 5 ? "7_8" : "menos_5" }),
    );
    const i2 = calcularInsights(dadosBase({ checkins }), HOJE).find((x) => x.id === "I2")!;
    expect(i2.disponivel).toBe(false);
    expect(i2.falta).toContain("Faltam 1 registro");
  });
  it("com 10 observações e dois lados, usa 'parece que' e mostra o N", () => {
    const checkins = Array.from({ length: MIN_OBSERVACOES }, (_, i) =>
      ck(`2026-10-${String(i + 1).padStart(2, "0")}`, i < 5 ? 1 : 4, {
        sonoFaixa: i < 5 ? "7_8" : "menos_5",
      }),
    );
    const i2 = calcularInsights(dadosBase({ checkins }), HOJE).find((x) => x.id === "I2")!;
    expect(i2.disponivel).toBe(true);
    expect(i2.frase).toMatch(/^Parece que/);
    expect(i2.n).toBe(10);
    expect(i2.porque.length).toBeGreaterThan(0);
  });
  it("nenhuma frase fala em causa ou em % de recuperação", () => {
    const checkins = Array.from({ length: 14 }, (_, i) =>
      ck(`2026-10-${String(i + 1).padStart(2, "0")}`, i % 4, { sonoFaixa: i % 2 ? "7_8" : "5_6" }),
    );
    for (const i of calcularInsights(dadosBase({ checkins }), HOJE)) {
      expect(i.frase ?? "").not.toMatch(/recupera[cç][aã]o de|porque causa|causou/i);
    }
  });
  it("I7 lista os exercícios que mais doem", () => {
    const series = [
      ...[1, 2, 3].map((n) => serie("2026-10-01", "pant-degrau", n, { dorDurante: 5 })),
      ...Array.from({ length: 10 }, (_, n) => serie("2026-10-02", "prancha", n + 1, { dorDurante: 0 })),
    ];
    const i7 = calcularInsights(dadosBase({ series }), HOJE).find((x) => x.id === "I7")!;
    expect(i7.disponivel).toBe(true);
    expect(i7.frase).toContain("Panturrilha no degrau");
  });
});
