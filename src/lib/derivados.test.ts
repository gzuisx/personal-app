import { describe, expect, it } from "vitest";
import { cargaSemanal, sonoMedio, tendenciaDor, ultimoCheckin } from "./derivados";
import type { Checkin, Sessao } from "./tipos";

const ck = (data: string, dor: number, sono: Checkin["sonoFaixa"] = null): Checkin => ({
  data,
  dor,
  inchaco: false,
  falhou: false,
  energia: null,
  sonoFaixa: sono,
  gatilho: null,
  observacao: null,
});

const ss = (data: string, esforco: number | null, resultado: Sessao["resultado"] = "feito"): Sessao => ({
  data,
  bloco: "x",
  resultado,
  esforco,
  duracaoMin: 30,
  notas: null,
});

describe("carga semanal", () => {
  it("é a média do esforço dos últimos 7 dias, só de sessões feitas ou parciais", () => {
    const lista = [
      ss("2026-10-20", 6),
      ss("2026-10-18", 4, "parcial"),
      ss("2026-10-19", 9, "nao_fiz"), // não conta
      ss("2026-10-13", 10), // fora da janela (7 dias: 14 a 20)
    ];
    expect(cargaSemanal(lista, "2026-10-20")).toBe(5);
  });

  it("sem sessões devolve null (a tela mostra '—')", () => {
    expect(cargaSemanal([], "2026-10-20")).toBeNull();
    expect(cargaSemanal([ss("2026-10-20", null)], "2026-10-20")).toBeNull();
  });
});

describe("sono médio", () => {
  it("usa o valor médio de cada faixa", () => {
    const lista = [ck("2026-10-19", 0, "menos_5"), ck("2026-10-20", 0, "7_8")];
    expect(sonoMedio(lista, "2026-10-14", "2026-10-20")).toBe(6);
    expect(sonoMedio([ck("2026-10-20", 0)], "2026-10-14", "2026-10-20")).toBeNull();
  });
});

describe("último check-in e tendência da dor", () => {
  it("pega o mais recente até hoje", () => {
    const lista = [ck("2026-10-18", 3), ck("2026-10-19", 1), ck("2026-10-25", 9)];
    expect(ultimoCheckin(lista, "2026-10-20")?.dor).toBe(1);
  });

  it("compara o último com o anterior", () => {
    expect(tendenciaDor([ck("2026-10-18", 3), ck("2026-10-19", 1)], "2026-10-20")).toBe("desce");
    expect(tendenciaDor([ck("2026-10-18", 1), ck("2026-10-19", 3)], "2026-10-20")).toBe("sobe");
    expect(tendenciaDor([ck("2026-10-18", 2), ck("2026-10-19", 2)], "2026-10-20")).toBe("estavel");
    expect(tendenciaDor([ck("2026-10-19", 2)], "2026-10-20")).toBeNull();
  });
});
