import { describe, expect, it } from "vitest";
import type { Proposta } from "../tipos";
import { adiarProposta, aceitarProposta, novasPropostas, recusarProposta, visivel } from "./propostas";
import type { PropostaSugerida } from "./tipos";
import { validarProposta } from "./validador";

const ok = {
  decisao: { podeProgredir: true, modo: "completo" as const },
  podeProgredirSeguranca: true,
  dorHoje: 1,
};
const ctx = (extra: Partial<Parameters<typeof aceitarProposta>[1]> = {}) => {
  let n = 0;
  return { hoje: "2026-10-14", agora: "2026-10-14T12:00:00Z", novoId: () => `id-${++n}`, ...ok, ...extra };
};

const sugFase: PropostaSugerida = {
  tipo: "fase",
  regra: "R16",
  titulo: "Avançar para a fase 2",
  resumo: "ok",
  chave: "fase:1->2",
  criterios: [{ texto: "a", ok: true }],
  payload: { de: 1, para: 2 },
};
const sugCarga: PropostaSugerida = {
  tipo: "progressao_carga",
  regra: "R06",
  titulo: "Stiff 41,5 kg",
  resumo: "ok",
  chave: "carga:stiff",
  criterios: [],
  payload: { slug: "stiff", deKg: 40, paraKg: 41.5 },
};

const nova = (s: PropostaSugerida, status: Proposta["status"] = "pendente"): Proposta => ({
  ...novasPropostas([], [s], "2026-10-14", () => "p1")[0],
  status,
});

describe("validarProposta", () => {
  it("recusa aumento de carga com segurança bloqueando", () => {
    const r = validarProposta(nova(sugCarga), { ...ok, podeProgredirSeguranca: false });
    expect(r.ok).toBe(false);
  });
  it("recusa aumento de carga com o coach segurando a progressão", () => {
    expect(
      validarProposta(nova(sugCarga), { ...ok, decisao: { podeProgredir: false, modo: "reduzido" } }).ok,
    ).toBe(false);
  });
  it("aceita aumento pequeno quando tudo libera", () => {
    expect(validarProposta(nova(sugCarga), ok).ok).toBe(true);
  });
  it("recusa aumento maior que 10%", () => {
    const p = { ...nova(sugCarga), payload: { slug: "stiff", deKg: 40, paraKg: 50 } };
    expect(validarProposta(p, ok).ok).toBe(false);
  });
  it("recusa impacto com dor 4 ou mais", () => {
    const p = { tipo: "plano" as const, payload: { adicionaImpacto: true } };
    expect(validarProposta(p, { ...ok, dorHoje: 4 }).ok).toBe(false);
    expect(validarProposta(p, { ...ok, dorHoje: 2 }).ok).toBe(true);
  });
  it("recusa remover aquecimento ou tornozelo e mexer nas regras de segurança", () => {
    expect(validarProposta({ tipo: "plano", payload: { removeAquecimento: true } }, ok).ok).toBe(false);
    expect(validarProposta({ tipo: "plano", payload: { removeTornozelo: true } }, ok).ok).toBe(false);
    expect(validarProposta({ tipo: "plano", payload: { alteraRegrasDeSeguranca: true } }, ok).ok).toBe(false);
  });
  it("recusa volume semanal acima de 20%", () => {
    expect(validarProposta({ tipo: "plano", payload: { aumentoVolumePercentual: 35 } }, ok).ok).toBe(false);
    expect(validarProposta({ tipo: "plano", payload: { aumentoVolumePercentual: 10 } }, ok).ok).toBe(true);
  });
  it("fase exige todos os critérios, segurança liberada e passo de uma fase", () => {
    expect(validarProposta(nova(sugFase), ok).ok).toBe(true);
    expect(validarProposta({ ...nova(sugFase), criterios: [{ texto: "a", ok: false }] }, ok).ok).toBe(false);
    expect(validarProposta(nova(sugFase), { ...ok, podeProgredirSeguranca: false }).ok).toBe(false);
    expect(validarProposta({ ...nova(sugFase), payload: { de: 1, para: 3 } }, ok).ok).toBe(false);
  });
});

describe("novasPropostas", () => {
  it("não repete a mesma proposta de fase", () => {
    const a = novasPropostas([], [sugFase], "2026-10-14", () => "x");
    expect(a).toHaveLength(1);
    expect(novasPropostas(a, [sugFase], "2026-10-20", () => "y")).toHaveLength(0);
  });
  it("progressão repete só na semana seguinte", () => {
    const a = novasPropostas([], [sugCarga], "2026-10-14", () => "x");
    expect(novasPropostas(a, [sugCarga], "2026-10-16", () => "y")).toHaveLength(0);
    expect(novasPropostas(a, [sugCarga], "2026-10-21", () => "y")).toHaveLength(1);
  });
});

describe("decidir", () => {
  it("aceitar cria versão do plano e auditoria", () => {
    const r = aceitarProposta(nova(sugCarga), ctx());
    expect(r.ok && r.proposta.status).toBe("aceita");
    expect(r.ok && r.versao?.origem).toBe("proposta");
    expect(r.ok && r.auditoria.evento).toBe("proposta_aceita");
  });
  it("aceitar fase devolve a nova fase", () => {
    const r = aceitarProposta(nova(sugFase), ctx());
    expect(r.ok && r.novaFase).toEqual({ fase: 2, inicio: "2026-10-14" });
  });
  it("aceitar é recusado pelo validador quando a segurança bloqueia", () => {
    const r = aceitarProposta(nova(sugFase), ctx({ podeProgredirSeguranca: false }));
    expect(r.ok).toBe(false);
  });
  it("não aceita proposta já decidida", () => {
    expect(aceitarProposta(nova(sugFase, "recusada"), ctx()).ok).toBe(false);
  });
  it("adiar esconde por 7 dias e só pode ser feito uma vez", () => {
    const r = adiarProposta(nova(sugFase), ctx());
    expect(r.ok && r.proposta.adiadaAte).toBe("2026-10-21");
    expect(r.ok && visivel(r.proposta, "2026-10-15")).toBe(false);
    expect(r.ok && visivel(r.proposta, "2026-10-21")).toBe(true);
    expect(r.ok && adiarProposta(r.proposta, ctx()).ok).toBe(false);
  });
  it("recusar registra auditoria e some", () => {
    const r = recusarProposta(nova(sugCarga), ctx());
    expect(r.ok && r.proposta.status).toBe("recusada");
    expect(r.ok && r.auditoria.evento).toBe("proposta_recusada");
    expect(r.ok && visivel(r.proposta, "2026-10-14")).toBe(false);
  });
});

describe("cargasAceitas", () => {
  const aceita = (slug: string, kg: number, em: string): Proposta => ({
    ...nova(sugCarga),
    status: "aceita",
    decididaEm: em,
    payload: { slug, deKg: kg - 1.5, paraKg: kg },
  });
  it("usa a carga aceita até treinar o exercício de novo", async () => {
    const { cargasAceitas } = await import("./propostas");
    const ps = [aceita("stiff", 41.5, "2026-10-14")];
    expect(cargasAceitas(ps, [])).toEqual({ stiff: 41.5 });
    expect(cargasAceitas(ps, [{ exercicio: "stiff", data: "2026-10-16" }])).toEqual({});
  });
  it("ignora propostas que não são de carga ou não foram aceitas", async () => {
    const { cargasAceitas } = await import("./propostas");
    expect(cargasAceitas([{ ...aceita("stiff", 41.5, "2026-10-14"), status: "recusada" }], [])).toEqual({});
    expect(cargasAceitas([{ ...nova(sugFase), status: "aceita", decididaEm: "2026-10-14" }], [])).toEqual({});
  });
});
