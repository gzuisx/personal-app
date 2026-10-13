import { describe, expect, it } from "vitest";
import { BIBLIOTECA, exerciciosDoFoco, filtrarBiblioteca, itemDaBiblioteca, normalizar } from "./biblioteca";

describe("biblioteca", () => {
  it("tem os 77 exercícios do catálogo", () => {
    expect(BIBLIOTECA).toHaveLength(77);
  });

  it("busca sem acento e por várias palavras", () => {
    expect(normalizar("Flexão")).toBe("flexao");
    expect(filtrarBiblioteca({ busca: "flexao" }).map((i) => i.id)).toContain("flexao");
    expect(filtrarBiblioteca({ busca: "panturrilha degrau" }).map((i) => i.id)).toContain("pant-degrau");
    expect(filtrarBiblioteca({ busca: "xyz-nada" })).toHaveLength(0);
  });

  it("filtra por região, tipo e foco", () => {
    const posterior = filtrarBiblioteca({ regiao: "Posterior de coxa" });
    expect(posterior.length).toBeGreaterThan(3);
    expect(posterior.every((i) => i.regioes.includes("Posterior de coxa"))).toBe(true);
    expect(filtrarBiblioteca({ tipo: "core" }).every((i) => i.tipo === "core")).toBe(true);
    const foco = filtrarBiblioteca({ foco: "posterior_coxa" }).map((i) => i.id);
    expect(foco).toEqual(exerciciosDoFoco("posterior_coxa"));
  });

  it("detalhe de um exercício", () => {
    const i = itemDaBiblioteca("stiff");
    expect(i?.passos).toHaveLength(3);
    expect(itemDaBiblioteca("nao-existe")).toBeNull();
  });
});
