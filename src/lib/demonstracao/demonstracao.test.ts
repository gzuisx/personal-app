import { describe, expect, it } from "vitest";
import { CATALOGO } from "../seed/catalogo";
import { DETALHES, REGIOES_CORPO } from "../seed/catalogo-detalhes";
import { DEMO_POR_ID, demonstracaoDe } from ".";
import { DURACAO_DEMO_S, enquadramento, quadroNoInstante, ritmo } from "./cena";
import { SEGMENTOS, comprimentoEsperado, dist, duracaoDoCiclo, resolverDois } from "./esqueleto";
import { MODELOS_POR_SLUG } from "./modelos";
import { DEMOS } from "./poses";

describe("catálogo e demonstrações", () => {
  it("todo exercício do catálogo tem demonstração (própria ou modelo)", () => {
    for (const c of CATALOGO) {
      const info = demonstracaoDe(c.id);
      expect(info.demo.poses.length, c.id).toBeGreaterThan(0);
      if (!DEMO_POR_ID[c.id]) expect(info.modelo, c.id).toBe(true);
    }
  });

  it("os modelos apontam para demonstrações que existem", () => {
    for (const [slug, origem] of Object.entries(MODELOS_POR_SLUG)) {
      expect(DEMO_POR_ID[origem], `${slug} -> ${origem}`).toBeDefined();
      expect(
        CATALOGO.some((c) => c.id === slug),
        slug,
      ).toBe(true);
    }
  });

  it("cada demonstração própria é de um exercício do catálogo, sem repetir", () => {
    const ids = DEMOS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids)
      expect(
        CATALOGO.some((c) => c.id === id),
        id,
      ).toBe(true);
  });

  it("todo exercício tem regiões, 3 passos e erros comuns", () => {
    for (const c of CATALOGO) {
      const d = DETALHES[c.id];
      expect(d, c.id).toBeDefined();
      expect(d.passos).toHaveLength(3);
      expect(d.erros.length, c.id).toBeGreaterThan(0);
      expect(d.regioes.length, c.id).toBeGreaterThan(0);
      for (const r of d.regioes) expect(REGIOES_CORPO).toContain(r);
    }
  });

  it("modelos usam as regiões do exercício para o destaque", () => {
    const info = demonstracaoDe("clamshell");
    expect(info.modelo).toBe(true);
    expect(info.demo.destaque).toEqual(DETALHES.clamshell.regioes);
  });
});

describe("poses válidas", () => {
  for (const d of DEMOS) {
    it(`${d.id}: segmentos com comprimento constante, sem NaN e acima do chão`, () => {
      // o mesmo modo (ângulos ou alvo) em todas as poses de cada membro, para a interpolação
      for (const m of ["pernaD", "pernaE", "bracoD", "bracoE"] as const) {
        const modos = new Set(d.poses.map((p) => ("alvo" in p[m] ? "alvo" : "ang")));
        expect(modos.size, `${d.id} ${m}`).toBe(1);
      }
      const ciclo = duracaoDoCiclo(d.poses);
      expect(ciclo).toBeGreaterThan(0.2);
      for (let i = 0; i <= 40; i++) {
        const q = quadroNoInstante(d, (ciclo * i) / 40);
        for (const s of SEGMENTOS) {
          const l = dist(q.esqueleto[s.de], q.esqueleto[s.para]);
          expect(Number.isFinite(l), `${d.id} ${s.id}`).toBe(true);
          expect(Math.abs(l - comprimentoEsperado(s.id, d.vista)), `${d.id} ${s.id} t=${i}`).toBeLessThan(
            0.01,
          );
        }
        for (const [nome, p] of Object.entries(q.esqueleto)) {
          expect(p.y, `${d.id} ${nome} t=${i}`).toBeGreaterThan(-5);
        }
      }
      const caixa = enquadramento(d);
      expect(caixa.w).toBeGreaterThan(0);
      expect(caixa.h).toBeGreaterThan(0);
    });
  }
});

describe("30 segundos", () => {
  it("cada demonstração fecha 30 s com repetições inteiras e ritmo perto do real", () => {
    for (const d of DEMOS) {
      const r = ritmo(d);
      expect(r.reps * r.ciclo * r.escala).toBeCloseTo(DURACAO_DEMO_S, 6);
      expect(r.escala, d.id).toBeGreaterThan(0.75);
      expect(r.escala, d.id).toBeLessThan(1.35);
      expect(r.repeticaoAtual(0)).toBe(1);
      expect(r.repeticaoAtual(DURACAO_DEMO_S)).toBe(r.reps);
    }
  });
});

describe("cinemática inversa", () => {
  it("mantém os dois segmentos com o comprimento certo, mesmo fora do alcance", () => {
    const base = { x: 0, y: 0 };
    for (const alvo of [
      { x: 10, y: -50 },
      { x: 200, y: 0 },
      { x: 0, y: 0.5 },
    ]) {
      const meio = resolverDois(base, alvo, 44, 42, 1);
      expect(dist(base, meio)).toBeCloseTo(44, 6);
    }
  });
});
