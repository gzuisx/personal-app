import { describe, expect, it } from "vitest";
import { diaDoPlano } from "../seed/plano";
import { diasDaSemana } from "../tempo";
import type { Checkin, Sessao } from "../tipos";
import { computeAneis, computeAneisSemana } from "./aneis";

const ss = (data: string, bloco: string, resultado: Sessao["resultado"] = "feito"): Sessao => ({
  data,
  bloco,
  resultado,
  esforco: 5,
  duracaoMin: 30,
  notas: null,
});
const ck = (data: string): Checkin => ({
  data,
  dor: 1,
  inchaco: false,
  falhou: false,
  energia: 4,
  sonoFaixa: "7_8",
  gatilho: null,
  observacao: null,
});

const aneis = (iso: string, sessoes: Sessao[] = [], checkins: Checkin[] = [], extra = {}) =>
  computeAneis({ dia: diaDoPlano(iso), sessoes, checkins, ...extra });
const por = (r: ReturnType<typeof computeAneis>, id: string) => r.aneis.find((a) => a.id === id)!;

describe("anéis do dia", () => {
  it("segunda: 2 treinos principais, 1 de tornozelo, check-in", () => {
    const r = aneis("2026-10-12");
    expect(por(r, "treinos")).toMatchObject({ total: 2, feitos: 0, estado: "pendente", centro: "0/2" });
    expect(por(r, "tornozelo")).toMatchObject({ total: 1, feitos: 0, estado: "pendente" });
    expect(por(r, "checkin")).toMatchObject({ total: 1, feitos: 0, estado: "pendente" });
  });

  it("feito vale 1, parcial vale 0,5, não fiz vale 0", () => {
    const sessoes = [ss("2026-10-12", "seg-forca", "parcial"), ss("2026-10-12", "seg-noite", "feito")];
    const t = por(aneis("2026-10-12", sessoes), "treinos");
    expect(t.feitos).toBe(1.5);
    expect(t.centro).toBe("1,5/2");
    expect(t.estado).toBe("completo"); // os dois blocos têm registro
    const nf = por(aneis("2026-10-12", [ss("2026-10-12", "seg-forca", "nao_fiz")]), "treinos");
    expect(nf.feitos).toBe(0);
    expect(nf.pendentes.map((b) => b.id)).toEqual(["seg-noite"]);
  });

  it("a próxima ação segue a ordem: check-in, tornozelo, treino", () => {
    expect(aneis("2026-10-12").proxima).toMatchObject({ anel: "checkin" });
    const comCheckin = aneis("2026-10-12", [], [ck("2026-10-12")]);
    expect(comCheckin.proxima).toMatchObject({ anel: "tornozelo", blocoId: "seg-tornozelo" });
    expect(comCheckin.proxima?.texto).toBe("Falta: rotina de tornozelo - 10 min");
    const semTornozelo = aneis("2026-10-12", [ss("2026-10-12", "seg-tornozelo")], [ck("2026-10-12")]);
    expect(semTornozelo.proxima).toMatchObject({ anel: "treinos", blocoId: "seg-forca" });
  });

  it("tudo feito: sem próxima ação e anéis completos", () => {
    const sessoes = ["seg-tornozelo", "seg-forca", "seg-noite"].map((b) => ss("2026-10-12", b));
    const r = aneis("2026-10-12", sessoes, [ck("2026-10-12")]);
    expect(r.aneis.every((a) => a.estado === "completo")).toBe(true);
    expect(r.aneis.every((a) => a.valor === 1)).toBe(true);
    expect(r.proxima).toBeNull();
  });

  it("domingo: Descanso, sem meta e sem próxima ação", () => {
    const r = aneis("2026-10-18");
    expect(r.aneis.every((a) => a.estado === "descanso")).toBe(true);
    expect(r.aneis.every((a) => a.total === 0)).toBe(true);
    expect(por(r, "treinos").centro).toBe("Descanso");
    expect(r.proxima).toBeNull();
  });

  it("modo Folga em dia de treino: Descanso, sem criar obrigação", () => {
    const r = aneis("2026-10-14", [], [], { modo: "folga" });
    expect(r.aneis.every((a) => a.estado === "descanso")).toBe(true);
    expect(r.proxima).toBeNull();
  });

  it("terça (dia de jogo sem bloco principal): TREINOS mostra o jogo; tornozelo continua", () => {
    const r = aneis("2026-10-13");
    expect(por(r, "treinos").estado).toBe("jogo");
    expect(por(r, "treinos").total).toBe(0);
    expect(por(r, "tornozelo").total).toBe(1);
  });

  it("sábado: ativação conta como tornozelo e TREINOS vira jogo", () => {
    const r = aneis("2026-10-17");
    expect(por(r, "treinos").estado).toBe("jogo");
    expect(por(r, "tornozelo")).toMatchObject({ total: 1, estado: "pendente" });
  });

  it("modo Recuperação: TREINOS só considera os blocos que sobraram; tornozelo continua", () => {
    const r = aneis("2026-10-12", [], [], { modo: "recuperacao", blocosRemovidos: ["seg-forca"] });
    expect(por(r, "treinos").total).toBe(1);
    expect(por(r, "treinos").pendentes.map((b) => b.id)).toEqual(["seg-noite"]);
    expect(por(r, "tornozelo").total).toBe(1);
  });

  it("quinta e quarta: blocos certos", () => {
    expect(por(aneis("2026-10-15"), "treinos").pendentes.map((b) => b.id)).toEqual(["qui-noite"]);
    expect(por(aneis("2026-10-14"), "treinos").pendentes.map((b) => b.id)).toEqual([
      "qua-forca",
      "qua-noite",
    ]);
  });
});

describe("anéis da semana", () => {
  const dias = diasDaSemana("2026-10-13").map((d) => diaDoPlano(d));
  it("soma planejados e feitos da semana; check-in conta 7", () => {
    const sessoes = [
      ss("2026-10-12", "seg-forca"),
      ss("2026-10-12", "seg-tornozelo"),
      ss("2026-10-14", "qua-forca", "parcial"),
    ];
    const [t, n, c] = computeAneisSemana(dias, sessoes, [ck("2026-10-12"), ck("2026-10-13")], "2026-10-14");
    // principais: seg 2, qua 2, qui 1, sex 1 = 6
    expect(t).toMatchObject({ total: 6, feitos: 1.5 });
    // tornozelo: seg, ter, qua, qui, sex, sab = 6
    expect(n).toMatchObject({ total: 6, feitos: 1 });
    expect(c).toMatchObject({ total: 7, feitos: 2 });
  });
});
