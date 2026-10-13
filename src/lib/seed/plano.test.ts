import { describe, expect, it } from "vitest";
import { rotuloCarga } from "../carga";
import { faseDoPlano, intensidadeVelocidade } from "./fase";
import { AQUECIMENTO_PRE_JOGO, blocoTreinavel, diaDoPlano, treinosPlanejados } from "./plano";

describe("plano por dia da semana (datas simuladas)", () => {
  const casos: Array<[string, string, string[]]> = [
    ["2026-10-12", "Segunda", ["seg-manha", "seg-noite"]],
    ["2026-10-13", "Terça", ["ter-manha", "ter-jogo"]],
    ["2026-10-14", "Quarta", ["qua-manha", "qua-noite"]],
    ["2026-10-15", "Quinta", ["qui-manha", "qui-noite"]],
    ["2026-10-16", "Sexta", ["sex-manha", "sex-noite"]],
    ["2026-10-17", "Sábado", ["sab-ativacao", "sab-jogo"]],
    ["2026-10-18", "Domingo", ["dom-folga"]],
  ];

  it.each(casos)("%s (%s) tem os blocos certos", (iso, nome, ids) => {
    const dia = diaDoPlano(iso);
    expect(dia.nome).toBe(nome);
    expect(dia.blocos.map((b) => b.id)).toEqual(ids);
  });

  it("jogos só na terça e no sábado", () => {
    expect(diaDoPlano("2026-10-13").jogo?.hora).toBe(20);
    expect(diaDoPlano("2026-10-17").jogo?.min).toBe(30);
    expect(diaDoPlano("2026-10-14").jogo).toBeNull();
  });

  it("segunda: tornozelo fase 1 + superiores e core", () => {
    const m = diaDoPlano("2026-10-12").blocos[0];
    expect(m.tags).toEqual(["Tornozelo", "Força"]);
    expect(m.exercicios.map((e) => e.slug)).toEqual([
      "eq-um-pe",
      "el-fora",
      "el-dentro",
      "el-cima",
      "pant-degrau",
      "joelho-parede",
      "supino",
      "remada",
      "desenvolvimento",
      "prancha",
      "abdominal-rotacao",
    ]);
  });

  it("quarta: flexora com 2 séries nas semanas 1 e 2 e 3 depois", () => {
    const flex = (iso: string) => diaDoPlano(iso).blocos[0].exercicios.find((e) => e.slug === "flexora");
    expect(flex("2026-10-14")?.series).toBe("2");
    expect(flex("2026-10-21")?.series).toBe("2");
    expect(flex("2026-10-28")?.series).toBe("3");
  });

  it("quinta: arrancadas seguem a progressão por semana", () => {
    const obs = (iso: string) =>
      diaDoPlano(iso).blocos[1].exercicios.find((e) => e.slug === "vel-arrancadas")?.observacao ?? "";
    expect(obs("2026-10-15")).toContain("80 a 85%");
    expect(obs("2026-10-29")).toContain("90 a 95%");
    expect(obs("2026-11-26")).toContain("100%");
  });

  it("funcional é sessão do instrutor, sem exercícios", () => {
    const noite = diaDoPlano("2026-10-12").blocos[1];
    expect(noite.instrutor).toBe(true);
    expect(noite.exercicios).toHaveLength(0);
  });

  it("só blocos de treino contam como planejados", () => {
    expect(treinosPlanejados("2026-10-13")).toBe(1);
    expect(treinosPlanejados("2026-10-18")).toBe(0);
    expect(diaDoPlano("2026-10-13").blocos.filter(blocoTreinavel)).toHaveLength(1);
  });

  it("aquecimento pré-jogo dura de 10 a 12 minutos", () => {
    const total = AQUECIMENTO_PRE_JOGO.reduce((s, f) => s + f.segundos, 0);
    expect(total).toBeGreaterThanOrEqual(600);
    expect(total).toBeLessThanOrEqual(720);
    expect(AQUECIMENTO_PRE_JOGO).toHaveLength(5);
  });
});

describe("fase do tornozelo", () => {
  it("segue as datas da especificação", () => {
    expect(faseDoPlano("2026-10-13")).toMatchObject({ fase: 1, semanaPlano: 1, semanasNaFase: 3 });
    expect(faseDoPlano("2026-11-02").fase).toBe(1);
    expect(faseDoPlano("2026-11-02").semanaPlano).toBe(3);
    expect(faseDoPlano("2026-11-03")).toMatchObject({ fase: 2, semanaPlano: 4, semanaNaFase: 1 });
    expect(faseDoPlano("2026-11-30").fase).toBe(2);
    expect(faseDoPlano("2026-12-01")).toMatchObject({ fase: 3, semanaPlano: 8, semanaNaFase: 1 });
  });

  it("antes do início usa a semana 1", () => {
    expect(faseDoPlano("2026-10-05")).toMatchObject({ fase: 1, semanaPlano: 1 });
  });

  it("troca a rotina do tornozelo por fase", () => {
    expect(diaDoPlano("2026-11-04").blocos[0].exercicios[0].slug).toBe("pant-um-pe");
    expect(diaDoPlano("2026-12-02").blocos[0].exercicios[0].slug).toBe("salto-aterrissagem");
  });

  it("intensidade da velocidade", () => {
    expect(intensidadeVelocidade(1)).toContain("80");
    expect(intensidadeVelocidade(3)).toContain("90");
    expect(intensidadeVelocidade(7)).toContain("100");
  });
});

describe("rótulo de carga relativo aos jogos", () => {
  it.each([
    ["2026-10-12", "Recuperação ativa"], // segunda, 24 h antes da terça
    ["2026-10-13", "Dia de jogo"],
    ["2026-10-14", "Recuperação pós-jogo"],
    ["2026-10-15", "Velocidade e potência"], // quinta, 48 h antes do sábado
    ["2026-10-16", "Recuperação ativa"], // sexta
    ["2026-10-17", "Dia de jogo"],
    ["2026-10-18", "Folga"],
  ])("%s -> %s", (iso, rotulo) => {
    expect(rotuloCarga(iso)).toBe(rotulo);
  });
});
