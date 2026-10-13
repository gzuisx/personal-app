import { describe, expect, it } from "vitest";
import { CATALOGO } from "../seed/catalogo";
import { serie } from "./ajudas-teste";
import { permitido, recomendar, volumeDaSemana } from "./recomendacao";

const base = {
  hoje: "2026-10-14",
  fase: 1 as const,
  modo: "completo" as const,
  semPliometria: false,
  semVelocidade: false,
  dorHoje: 1,
  series: [],
};

describe("recomendar", () => {
  it("nunca sugere item de fase maior que a atual", () => {
    for (const s of recomendar({ ...base, limite: 50 })) {
      expect(CATALOGO.find((c) => c.id === s.slug)!.faseMinima).toBeLessThanOrEqual(1);
    }
  });
  it("com dor 4 ou mais, só impacto baixo", () => {
    const r = recomendar({ ...base, fase: 3, dorHoje: 5, limite: 50 });
    expect(r.length).toBeGreaterThan(0);
    for (const s of r) expect(CATALOGO.find((c) => c.id === s.slug)!.impacto).toBe("baixo");
  });
  it("sem pliometria nem velocidade, não sugere impacto alto nem corrida", () => {
    const r = recomendar({ ...base, fase: 4, semPliometria: true, semVelocidade: true, limite: 80 });
    for (const s of r) {
      const c = CATALOGO.find((x) => x.id === s.slug)!;
      expect(c.impacto).not.toBe("alto");
      expect(["velocidade", "potencia"]).not.toContain(c.tipo);
    }
  });
  it("em Recuperação, só tornozelo, mobilidade e core leves", () => {
    const r = recomendar({ ...base, fase: 4, modo: "recuperacao", limite: 80 });
    expect(r.length).toBeGreaterThan(0);
    for (const s of r) expect(["tornozelo", "mobilidade", "core"]).toContain(s.tipo);
  });
  it("respeita o foco escolhido", () => {
    const r = recomendar({ ...base, fase: 2, foco: "mobilidade" });
    expect(r.length).toBeGreaterThan(0);
    for (const s of r) expect(s.tipo).toBe("mobilidade");
  });
  it("aponta a lacuna de volume e não repete o que já está no plano", () => {
    const r = recomendar({ ...base, fase: 2, foco: "tornozelo", limite: 3 });
    expect(r[0].motivo).toContain("Faltam");
    const repetido = recomendar({ ...base, fase: 2, foco: "tornozelo", jaNoPlano: [r[0].slug], limite: 3 });
    expect(repetido.map((x) => x.slug)).not.toContain(r[0].slug);
  });
  it("tem no máximo 2 exercícios do mesmo grupo", () => {
    const r = recomendar({ ...base, fase: 4, limite: 30 });
    const cont: Record<string, number> = {};
    for (const s of r) cont[s.grupo] = (cont[s.grupo] ?? 0) + 1;
    for (const n of Object.values(cont)) expect(n).toBeLessThanOrEqual(2);
  });
});

describe("volumeDaSemana / permitido", () => {
  it("conta só os últimos 7 dias", () => {
    const tornozelo = CATALOGO.find((c) => c.tipo === "tornozelo")!.id;
    const v = volumeDaSemana(
      [serie("2026-10-13", tornozelo, 1), serie("2026-10-01", tornozelo, 1)],
      "2026-10-14",
    );
    expect(v.tornozelo).toBe(1);
  });
  it("bloqueia item de fase futura", () => {
    const futuro = CATALOGO.find((c) => c.faseMinima >= 3)!;
    expect(permitido(futuro, { ...base })).toBe(false);
  });
});
