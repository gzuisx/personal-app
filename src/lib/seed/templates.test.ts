import { describe, expect, it } from "vitest";
import { CATALOGO_POR_ID, exigeAcademia } from "./catalogo";
import { diaDoPlano } from "./plano";
import { aplicarTemplate, TEMPLATES } from "./templates";

const quarta = () => diaDoPlano("2026-10-14", { fase: 1 });
const todosExercicios = (d: ReturnType<typeof quarta>) => d.blocos.flatMap((b) => b.exercicios);
const soma = (d: ReturnType<typeof quarta>) =>
  todosExercicios(d).reduce((s, e) => s + Number(e.series ?? 1), 0);

describe("templates", () => {
  it("tem P1 a P7", () => {
    expect(TEMPLATES.map((t) => t.chave)).toEqual(["P1", "P2", "P3", "P4", "P5", "P6", "P7"]);
  });
  it("P1 e modelos só descritos não mudam o dia", () => {
    const d = quarta();
    expect(aplicarTemplate("P1", d)).toEqual(d);
    expect(aplicarTemplate("P5", d)).toEqual(d);
    expect(aplicarTemplate(undefined, d)).toEqual(d);
  });
  it("P2 mantém o tornozelo e tira o funcional", () => {
    for (const iso of ["2026-10-12", "2026-10-14", "2026-10-16"]) {
      const d = aplicarTemplate("P2", diaDoPlano(iso, { fase: 1 }));
      expect(d.blocos.some((b) => b.instrutor)).toBe(false);
    }
    const d = aplicarTemplate("P2", quarta());
    expect(d.blocos.some((b) => b.tags.includes("Tornozelo") && b.exercicios.length > 0)).toBe(true);
  });
  it("P3 reduz o volume e mantém o tornozelo", () => {
    const antes = quarta();
    const depois = aplicarTemplate("P3", antes);
    expect(soma(depois)).toBeLessThan(soma(antes));
    expect(depois.blocos.some((b) => b.tags.includes("Tornozelo") && b.exercicios.length > 0)).toBe(true);
  });
  it("P4 deixa só exercícios leves, sem velocidade, em no máximo 2 séries", () => {
    for (const iso of ["2026-10-12", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17"]) {
      const d = aplicarTemplate("P4", diaDoPlano(iso, { fase: 3 }));
      for (const e of todosExercicios(d)) {
        expect(e.tipo).not.toBe("velocidade");
        expect(Number(e.series ?? 1)).toBeLessThanOrEqual(2);
        expect(CATALOGO_POR_ID[e.slug].impacto).toBe("baixo");
      }
    }
  });
  it("P7 não deixa exercício que exige academia", () => {
    for (const iso of ["2026-10-12", "2026-10-14"]) {
      const d = aplicarTemplate("P7", diaDoPlano(iso, { fase: 1 }));
      for (const e of todosExercicios(d)) expect(exigeAcademia(CATALOGO_POR_ID[e.slug])).toBe(false);
    }
  });
});
