import { describe, expect, it } from "vitest";
import type { Meta, TesteCampo } from "../tipos-testes";
import {
  melhorTentativa,
  metasSugeridas,
  progressoDaMeta,
  resumirTestes,
  seriesDoTeste,
  simetriaRecente,
  TESTES,
  variacaoDoTeste,
} from "./index";

let n = 0;
const t = (extra: Partial<TesteCampo> & Pick<TesteCampo, "tipo" | "valor">): TesteCampo => ({
  id: `t${++n}`,
  unidade: "s",
  tentativa: 1,
  data: "2026-10-14",
  ...extra,
});

describe("testes de campo", () => {
  it("tem os 6 testes com instruções, aquecimento e unidade", () => {
    expect(TESTES.map((x) => x.tipo)).toEqual(["T1", "T2", "T3", "T4", "T5", "T6"]);
    for (const d of TESTES) {
      expect(d.passos.length).toBeGreaterThan(0);
      expect(d.aquecimento.length).toBeGreaterThan(0);
    }
  });

  it("sprint: a melhor tentativa é o menor tempo", () => {
    const m = melhorTentativa([
      t({ tipo: "T1", valor: 3.6 }),
      t({ tipo: "T1", valor: 3.4 }),
      t({ tipo: "T1", valor: 3.5 }),
    ]);
    expect(m?.valor).toBe(3.4);
  });
  it("salto: a melhor tentativa é a maior altura", () => {
    const m = melhorTentativa([
      t({ tipo: "T2", valor: 40 }),
      t({ tipo: "T2", valor: 44 }),
      t({ tipo: "T2", valor: 42 }),
    ]);
    expect(m?.valor).toBe(44);
  });

  it("resumirTestes junta tentativas do mesmo dia, pé e subtipo", () => {
    const r = resumirTestes([
      t({ tipo: "T5", pe: "direito", subtipo: "horizontal", valor: 180 }),
      t({ tipo: "T5", pe: "direito", subtipo: "horizontal", valor: 190 }),
      t({ tipo: "T5", pe: "esquerdo", subtipo: "horizontal", valor: 170 }),
      t({ tipo: "T5", pe: "direito", subtipo: "horizontal", valor: 175, data: "2026-09-14" }),
    ]);
    expect(r).toHaveLength(3);
    expect(r.find((x) => x.pe === "direito" && x.data === "2026-10-14")?.valor).toBe(190);
    expect(r[0].data).toBe("2026-09-14");
    expect(r.every((x) => x.menorEhMelhor === false)).toBe(true);
  });

  it("simetria entre os pés usa menor / maior", () => {
    const r = resumirTestes([
      t({ tipo: "T4", pe: "direito", valor: 20 }),
      t({ tipo: "T4", pe: "esquerdo", valor: 16 }),
    ]);
    const s = simetriaRecente(r, "T4");
    expect(Math.round(s!.percentual)).toBe(80);
    expect(s!.maisFraco).toBe("esquerdo");
    expect(simetriaRecente(r.slice(0, 1), "T4")).toBeNull();
  });

  it("variação positiva é melhora, também no sprint", () => {
    const sprint = resumirTestes([
      t({ tipo: "T1", valor: 3.6, data: "2026-09-14" }),
      t({ tipo: "T1", valor: 3.4 }),
    ]);
    expect(variacaoDoTeste(sprint)!).toBeGreaterThan(0);
    const salto = resumirTestes([
      t({ tipo: "T2", valor: 44, data: "2026-09-14" }),
      t({ tipo: "T2", valor: 40 }),
    ]);
    expect(variacaoDoTeste(salto)!).toBeLessThan(0);
    expect(variacaoDoTeste(sprint.slice(0, 1))).toBeNull();
  });

  it("seriesDoTeste separa por pé e subtipo", () => {
    const r = resumirTestes([
      t({ tipo: "T3", pe: "direito", subtipo: "olhos_fechados", valor: 30, falhas: 0 }),
      t({ tipo: "T3", pe: "esquerdo", subtipo: "olhos_fechados", valor: 22, falhas: 2 }),
    ]);
    const s = seriesDoTeste(r, "T3");
    expect(s).toHaveLength(2);
    expect(s[0].rotulo).toContain("Olhos fechados");
  });
});

describe("metas", () => {
  const meta = (extra: Partial<Meta> = {}): Meta => ({
    id: "m",
    chave: "sprint-20m",
    titulo: "Sprint",
    tipoTeste: "T1",
    inicial: 3.6,
    alvo: 3.4,
    unidade: "s",
    menorEhMelhor: true,
    prazo: null,
    ...extra,
  });

  it("progresso do sprint: tempo menor avança a barra", () => {
    const r = resumirTestes([t({ tipo: "T1", valor: 3.5 })]);
    expect(progressoDaMeta(meta(), r).percentual).toBe(50);
    expect(progressoDaMeta(meta(), r).atingida).toBe(false);
  });
  it("meta atingida chega a 100%", () => {
    const r = resumirTestes([t({ tipo: "T1", valor: 3.3 })]);
    const p = progressoDaMeta(meta(), r);
    expect(p.atingida).toBe(true);
    expect(p.percentual).toBe(100);
  });
  it("sem teste ainda, não inventa progresso", () => {
    const p = progressoDaMeta(meta(), []);
    expect(p.atual).toBeNull();
    expect(p.percentual).toBeNull();
  });
  it("piora não passa de 0%", () => {
    const r = resumirTestes([t({ tipo: "T1", valor: 3.9 })]);
    expect(progressoDaMeta(meta(), r).percentual).toBe(0);
  });
  it("sugere metas de partida a partir do primeiro teste", () => {
    let i = 0;
    const r = resumirTestes([
      t({ tipo: "T1", valor: 3.5 }),
      t({ tipo: "T2", valor: 40, unidade: "cm" }),
      t({ tipo: "T3", pe: "direito", subtipo: "olhos_fechados", valor: 20, falhas: 3 }),
      t({ tipo: "T4", pe: "direito", valor: 20, unidade: "reps" }),
      t({ tipo: "T4", pe: "esquerdo", valor: 15, unidade: "reps" }),
    ]);
    const metas = metasSugeridas(r, () => `m${++i}`, "2026-10-14");
    expect(metas.map((m) => m.chave)).toEqual([
      "sprint-20m",
      "salto-vertical",
      "equilibrio-olhos-fechados",
      "panturrilha-simetria",
    ]);
    expect(metas[0].alvo).toBeCloseTo(3.36, 2);
    expect(metas[1].alvo).toBe(42);
    expect(metas[3].alvo).toBe(18);
    expect(metas.every((m) => m.prazo && m.prazo > "2026-10-14")).toBe(true);
  });
  it("sem testes, não sugere meta", () => {
    expect(metasSugeridas([], () => "x", "2026-10-14")).toEqual([]);
  });
});
