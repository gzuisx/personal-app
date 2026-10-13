import { describe, expect, it } from "vitest";
import {
  cargaReduzida,
  proximaCarga,
  sessoesDoExercicio,
  sugerirProgressao,
  type SerieHistorica,
} from "./progressao";

const serie = (
  data: string,
  numero: number,
  reps: number,
  carga: number | null,
  esforco: SerieHistorica["esforco"] = "ok",
  dor = 0,
): SerieHistorica => ({
  data,
  numero,
  reps,
  cargaKg: carga,
  esforco,
  dorDurante: dor,
});
const sessao = (
  data: string,
  reps: number[],
  carga: number | null = 40,
  esforco: SerieHistorica["esforco"] = "ok",
) => reps.map((r, i) => serie(data, i + 1, r, carga, esforco));

const base = { faixa: { min: 6, max: 8 }, seriesPlano: 3, podeProgredir: true };

describe("progressão por exercício (6.1)", () => {
  it("agrupa por dia, da mais recente para a mais antiga", () => {
    const s = sessoesDoExercicio([...sessao("2026-10-07", [8, 8, 8]), ...sessao("2026-10-14", [8, 8, 8])]);
    expect(s.map((x) => x.data)).toEqual(["2026-10-14", "2026-10-07"]);
    expect(s[0].series).toHaveLength(3);
  });

  it("sem sessões suficientes: diz quantas faltam", () => {
    const r = sugerirProgressao({ ...base, series: sessao("2026-10-14", [8, 8, 8]) });
    expect(r.acao).toBe("sem_dados");
    expect(r.motivo).toContain("Falta 1 sessão");
    expect(sugerirProgressao({ ...base, series: [] }).motivo).toContain("Faltam 2 sessões");
  });

  it("topo da faixa em todas as séries por 2 sessões, com segurança liberada: sobe", () => {
    const r = sugerirProgressao({
      ...base,
      series: [...sessao("2026-10-07", [8, 8, 8]), ...sessao("2026-10-14", [8, 8, 8])],
    });
    expect(r.acao).toBe("subir");
    expect(r.cargaAtualKg).toBe(40);
    expect(r.sugeridaKg).toBe(41.5);
    expect(r.checklist.every((c) => c.ok)).toBe(true);
  });

  it("REGRA MESTRA: com segurança bloqueando, nunca sobe, mesmo com tudo no topo", () => {
    const r = sugerirProgressao({
      ...base,
      podeProgredir: false,
      series: [...sessao("2026-10-07", [8, 8, 8]), ...sessao("2026-10-14", [8, 8, 8])],
    });
    expect(r.acao).toBe("manter");
    expect(r.sugeridaKg).toBeNull();
    expect(r.motivo).toContain("segurança");
  });

  it("prontidão baixa nos dias dos treinos também segura a progressão", () => {
    const r = sugerirProgressao({
      ...base,
      prontidaoOk: false,
      series: [...sessao("2026-10-07", [8, 8, 8]), ...sessao("2026-10-14", [8, 8, 8])],
    });
    expect(r.acao).toBe("manter");
  });

  it("esforço 'duro' ou dor durante o exercício impedem de subir", () => {
    const duro = sugerirProgressao({
      ...base,
      series: [...sessao("2026-10-07", [8, 8, 8]), ...sessao("2026-10-14", [8, 8, 8], 40, "duro")],
    });
    expect(duro.acao).toBe("manter");
    const doeu = sugerirProgressao({
      ...base,
      series: [
        ...sessao("2026-10-07", [8, 8, 8]),
        ...sessao("2026-10-14", [8, 8, 8]).map((s) => ({ ...s, dorDurante: 4 })),
      ],
    });
    expect(doeu.acao).toBe("manter");
  });

  it("uma série fora do topo, ou menos séries que o plano, não conta como topo", () => {
    expect(
      sugerirProgressao({
        ...base,
        series: [...sessao("2026-10-07", [8, 8, 8]), ...sessao("2026-10-14", [8, 8, 7])],
      }).acao,
    ).toBe("manter");
    expect(
      sugerirProgressao({
        ...base,
        series: [...sessao("2026-10-07", [8, 8, 8]), ...sessao("2026-10-14", [8, 8])],
      }).acao,
    ).toBe("manter");
  });

  it("abaixo do piso em 3 sessões: sugere reduzir de 5 a 10%", () => {
    const r = sugerirProgressao({
      ...base,
      series: [
        ...sessao("2026-10-01", [5, 5, 5]),
        ...sessao("2026-10-07", [5, 4, 5]),
        ...sessao("2026-10-14", [5, 5, 4]),
      ],
    });
    expect(r.acao).toBe("reduzir");
    expect(r.sugeridaKg).toBe(37);
    expect(r.sugeridaKg! / r.cargaAtualKg!).toBeGreaterThanOrEqual(0.9);
    expect(r.sugeridaKg! / r.cargaAtualKg!).toBeLessThanOrEqual(0.95);
  });

  it("abaixo do piso em só 2 sessões: mantém", () => {
    const r = sugerirProgressao({
      ...base,
      series: [...sessao("2026-10-07", [5, 5, 5]), ...sessao("2026-10-14", [5, 4, 5])],
    });
    expect(r.acao).toBe("manter");
  });

  it("sem carga externa (peso do corpo): sugere variante, não kg", () => {
    const r = sugerirProgressao({
      ...base,
      series: [...sessao("2026-10-07", [8, 8, 8], null), ...sessao("2026-10-14", [8, 8, 8], null)],
    });
    expect(r.acao).toBe("variante");
    expect(r.sugeridaKg).toBeNull();
  });

  it("passos de carga", () => {
    expect(proximaCarga(40)).toBe(41.5);
    expect(proximaCarga(10)).toBe(11);
    expect(proximaCarga(100)).toBe(102.5);
    expect(cargaReduzida(40)).toBe(37);
    expect(cargaReduzida(0)).toBe(0);
  });
});
