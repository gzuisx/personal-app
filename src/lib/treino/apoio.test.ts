import { describe, expect, it } from "vitest";
import { diaDoPlano } from "../seed/plano";
import type { Sessao, SerieLog } from "../tipos";
import { opcoesDeTroca, sequenciaPendente, sugeridosDaUltimaSessao } from "./apoio";

const log = (
  data: string,
  exercicio: string,
  numero: number,
  reps: number,
  carga: number | null,
  execucaoId = "e1",
): SerieLog => ({
  execucaoId,
  data,
  bloco: "qua-forca",
  exercicio,
  numero,
  cargaKg: carga,
  reps,
  duracaoS: null,
  rir: null,
  esforco: "ok",
  dorDurante: null,
  criadoEm: `${data}T10:00:00Z`,
});

describe("valores sugeridos da última sessão", () => {
  it("pega as séries do dia mais recente, em ordem", () => {
    const series = [
      log("2026-10-07", "stiff", 1, 8, 35, "a"),
      log("2026-10-14", "stiff", 2, 7, 40, "b"),
      log("2026-10-14", "stiff", 1, 8, 40, "b"),
      log("2026-10-14", "flexora", 1, 6, null, "b"),
    ];
    const s = sugeridosDaUltimaSessao(series, ["stiff", "flexora", "bulgaro"], "2026-10-21");
    expect(s.stiff).toEqual([
      { reps: 8, cargaKg: 40, duracaoS: null },
      { reps: 7, cargaKg: 40, duracaoS: null },
    ]);
    expect(s.flexora).toHaveLength(1);
    expect(s.bulgaro).toBeUndefined();
  });

  it("ignora a execução atual e datas futuras", () => {
    const series = [
      log("2026-10-14", "stiff", 1, 8, 40, "atual"),
      log("2026-10-28", "stiff", 1, 9, 50, "futura"),
    ];
    expect(sugeridosDaUltimaSessao(series, ["stiff"], "2026-10-21", "atual")).toEqual({});
  });
});

describe("trocas de exercício", () => {
  const ctx = { fase: 1, podeProgredir: true };

  it("oferece mais leve, equivalentes e mais difícil, sem repetir", () => {
    const o = opcoesDeTroca({ slug: "pant-degrau" }, ctx);
    expect(o.map((x) => x.item.id)).toContain("caminhada-pontas");
    expect(o.find((x) => x.item.id === "caminhada-pontas")?.tipo).toBe("mais_leve");
    expect(new Set(o.map((x) => x.item.id)).size).toBe(o.length);
  });

  it("a progressão só aparece com a segurança liberada", () => {
    const livre = opcoesDeTroca({ slug: "pant-degrau" }, { fase: 2, podeProgredir: true });
    const bloqueado = opcoesDeTroca({ slug: "pant-degrau" }, { fase: 2, podeProgredir: false });
    expect(livre.some((x) => x.tipo === "mais_dificil")).toBe(true);
    expect(bloqueado.some((x) => x.tipo === "mais_dificil")).toBe(false);
  });

  it("não oferece exercício de fase mais avançada que a do tornozelo", () => {
    const fase1 = opcoesDeTroca({ slug: "saltinhos-lugar" }, { fase: 1, podeProgredir: true });
    expect(fase1.every((x) => x.item.faseMinima <= 1)).toBe(true);
  });

  it("sem academia: nada que exija academia", () => {
    const o = opcoesDeTroca({ slug: "stiff" }, { fase: 1, podeProgredir: true, semAcademia: true });
    expect(o.length).toBeGreaterThan(0);
    expect(
      o.every((x) => !x.item.equipamento.every((e) => ["halter", "barra", "academia", "anilha"].includes(e))),
    ).toBe(true);
  });

  it("com dor no impacto, só opções de impacto baixo", () => {
    const o = opcoesDeTroca({ slug: "saltinhos-lugar" }, { fase: 3, podeProgredir: true, dorImpacto: true });
    expect(o.every((x) => x.item.impacto === "baixo")).toBe(true);
  });

  it("exercício fora do catálogo não tem troca", () => {
    expect(opcoesDeTroca({ slug: "nao-existe" }, ctx)).toEqual([]);
  });
});

describe("Sequência do dia", () => {
  const feito = (data: string, bloco: string): Sessao => ({
    data,
    bloco,
    resultado: "feito",
    esforco: 5,
    duracaoMin: 10,
    notas: null,
  });

  it("quarta de manhã: tornozelo e força de pernas viram uma sequência de 55 min", () => {
    const s = sequenciaPendente(diaDoPlano("2026-10-14"), []);
    expect(s?.periodo).toBe("manha");
    expect(s?.blocos.map((b) => b.id)).toEqual(["qua-tornozelo", "qua-forca"]);
    expect(s?.totalMin).toBe(55);
  });

  it("some quando só resta um bloco no período", () => {
    expect(sequenciaPendente(diaDoPlano("2026-10-14"), [feito("2026-10-14", "qua-tornozelo")])).toBeNull();
  });

  it("o funcional do instrutor e o jogo nunca entram", () => {
    const s = sequenciaPendente(diaDoPlano("2026-10-14"), []);
    expect(s?.blocos.some((b) => b.instrutor)).toBe(false);
    expect(
      sequenciaPendente(diaDoPlano("2026-10-13"), [])?.blocos.some((b) => b.tags.includes("Jogo")),
    ).toBeFalsy();
  });

  it("quinta e sábado não têm sequência (um bloco por período)", () => {
    expect(sequenciaPendente(diaDoPlano("2026-10-15"), [])).toBeNull();
    expect(sequenciaPendente(diaDoPlano("2026-10-17"), [])).toBeNull();
  });

  it("terça: tornozelo e mobilidade, 20 min", () => {
    const s = sequenciaPendente(diaDoPlano("2026-10-13"), []);
    expect(s?.blocos.map((b) => b.id)).toEqual(["ter-tornozelo", "ter-mobilidade"]);
    expect(s?.totalMin).toBe(20);
  });
});
