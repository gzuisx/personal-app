import { describe, expect, it } from "vitest";
import { rotuloCarga } from "../carga";
import { faseDoPlano, intensidadeVelocidade } from "./fase";
import {
  AQUECIMENTO_PRE_JOGO,
  blocoPrincipal,
  blocoTornozeloTag,
  blocoTreinavel,
  diaDoPlano,
  treinosPlanejados,
} from "./plano";

describe("plano por dia da semana (datas simuladas)", () => {
  const casos: Array<[string, string, string[]]> = [
    ["2026-10-12", "Segunda", ["seg-tornozelo", "seg-forca", "seg-noite"]],
    ["2026-10-13", "Terça", ["ter-tornozelo", "ter-mobilidade", "ter-jogo"]],
    ["2026-10-14", "Quarta", ["qua-tornozelo", "qua-forca", "qua-noite"]],
    ["2026-10-15", "Quinta", ["qui-tornozelo", "qui-noite"]],
    ["2026-10-16", "Sexta", ["sex-tornozelo", "sex-mobilidade", "sex-noite"]],
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

  it("segunda: tornozelo fase 1, depois superiores e core em blocos separados", () => {
    const [tornozelo, forca] = diaDoPlano("2026-10-12").blocos;
    expect(tornozelo.tags).toEqual(["Tornozelo"]);
    expect(tornozelo.exercicios.map((e) => e.slug)).toEqual([
      "eq-um-pe",
      "el-fora",
      "el-dentro",
      "el-cima",
      "pant-degrau",
      "joelho-parede",
    ]);
    expect(forca.tags).toEqual(["Força"]);
    expect(forca.exercicios.map((e) => e.slug)).toEqual([
      "supino",
      "remada",
      "desenvolvimento",
      "prancha",
      "abdominal-rotacao",
    ]);
  });

  it("quarta: flexora com 2 séries nas semanas 1 e 2 e 3 depois", () => {
    const flex = (iso: string) =>
      diaDoPlano(iso)
        .blocos.find((b) => b.id === "qua-forca")
        ?.exercicios.find((e) => e.slug === "flexora");
    expect(flex("2026-10-14")?.series).toBe("2");
    expect(flex("2026-10-21")?.series).toBe("2");
    expect(flex("2026-10-28")?.series).toBe("3");
  });

  it("quinta: arrancadas seguem a progressão por semana", () => {
    const obs = (iso: string) =>
      diaDoPlano(iso)
        .blocos.find((b) => b.id === "qui-noite")
        ?.exercicios.find((e) => e.slug === "vel-arrancadas")?.observacao ?? "";
    expect(obs("2026-10-15")).toContain("80 a 85%");
    expect(obs("2026-10-29")).toContain("90 a 95%");
    expect(obs("2026-11-26")).toContain("100%");
  });

  it("funcional é sessão do instrutor, sem exercícios", () => {
    const noite = diaDoPlano("2026-10-12").blocos[2];
    expect(noite.instrutor).toBe(true);
    expect(noite.exercicios).toHaveLength(0);
  });

  it("só blocos de treino contam como planejados", () => {
    expect(treinosPlanejados("2026-10-13")).toBe(2);
    expect(treinosPlanejados("2026-10-18")).toBe(0);
    expect(diaDoPlano("2026-10-13").blocos.filter(blocoTreinavel)).toHaveLength(2);
  });

  it("blocos principais (anel TREINOS) e de tornozelo (anel TORNOZELO)", () => {
    const seg = diaDoPlano("2026-10-12").blocos;
    expect(seg.filter(blocoPrincipal).map((b) => b.id)).toEqual(["seg-forca", "seg-noite"]);
    expect(seg.filter(blocoTornozeloTag).map((b) => b.id)).toEqual(["seg-tornozelo"]);
    const ter = diaDoPlano("2026-10-13").blocos;
    expect(ter.filter(blocoPrincipal)).toHaveLength(0); // terça: só jogo
    const qui = diaDoPlano("2026-10-15").blocos;
    expect(qui.filter(blocoPrincipal).map((b) => b.id)).toEqual(["qui-noite"]);
    const dom = diaDoPlano("2026-10-18").blocos;
    expect(dom.filter(blocoPrincipal)).toHaveLength(0);
    expect(dom.filter(blocoTornozeloTag)).toHaveLength(0);
  });

  it("aquecimento pré-jogo dura de 10 a 12 minutos", () => {
    const total = AQUECIMENTO_PRE_JOGO.reduce((s, f) => s + f.segundos, 0);
    expect(total).toBeGreaterThanOrEqual(600);
    expect(total).toBeLessThanOrEqual(720);
    expect(AQUECIMENTO_PRE_JOGO).toHaveLength(5);
  });
});

describe("fase do tornozelo", () => {
  it("o calendário sugere a fase pelas datas", () => {
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

  it("a rotina do tornozelo segue a fase passada (guardada no banco), não só a data", () => {
    // 4/11 já é fase 2 pelo calendário, mas se a fase guardada ainda é 1, o plano continua na 1
    expect(diaDoPlano("2026-11-04", { fase: 1 }).blocos[0].exercicios[0].slug).toBe("eq-um-pe");
    expect(diaDoPlano("2026-11-04").blocos[0].exercicios[0].slug).toBe("pant-um-pe");
    expect(diaDoPlano("2026-10-14", { fase: 3 }).blocos[0].exercicios[0].slug).toBe("salto-aterrissagem");
    expect(diaDoPlano("2026-10-14", { fase: 4 }).blocos[0].exercicios.length).toBeGreaterThan(0);
  });

  it("intensidade da velocidade", () => {
    expect(intensidadeVelocidade(1)).toContain("80");
    expect(intensidadeVelocidade(3)).toContain("90");
    expect(intensidadeVelocidade(7)).toContain("100");
  });
});

describe("rótulo de carga por dias corridos (C3)", () => {
  it.each([
    ["2026-10-12", "24 h antes do jogo - leve"], // segunda
    ["2026-10-13", "Dia de jogo"], // terça
    ["2026-10-14", "Pós-jogo + 72 h antes do sábado - força moderada"], // quarta
    ["2026-10-15", "48 h antes do jogo - velocidade"], // quinta
    ["2026-10-16", "24 h antes do jogo - recuperação ativa"], // sexta
    ["2026-10-17", "Dia de jogo"], // sábado
    ["2026-10-18", "Folga - recuperação pós-jogo"], // domingo
  ])("%s -> %s", (iso, rotulo) => {
    expect(rotuloCarga(iso)).toBe(rotulo);
  });

  it("jogo extra recalcula pelos deslocamentos em dias", () => {
    // jogo extra na quinta 15/10: quarta fica 24 h antes, e a sexta fica pós-jogo
    const e = { extras: ["2026-10-15"] };
    expect(rotuloCarga("2026-10-15", e)).toBe("Dia de jogo");
    expect(rotuloCarga("2026-10-14", e)).toBe("Pós-jogo + 24 h antes da quinta - força moderada");
    expect(rotuloCarga("2026-10-16", e)).toContain("Pós-jogo");
  });

  it("jogo cancelado tira o dia de jogo", () => {
    const e = { cancelados: ["2026-10-13"] };
    expect(rotuloCarga("2026-10-13", e)).not.toBe("Dia de jogo");
    expect(rotuloCarga("2026-10-12", e)).toBe("Carga normal"); // a 5 dias do sábado e sem jogo recente
    expect(rotuloCarga("2026-10-16", e)).toBe("24 h antes do jogo - recuperação ativa");
  });
});
