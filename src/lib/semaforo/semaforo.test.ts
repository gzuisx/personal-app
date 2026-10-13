import { describe, expect, it } from "vitest";
import type { CheckinSeg } from "../safety";
import { avaliarSemaforo } from "./index";

const ck = (data: string, dor: number, extra: Partial<CheckinSeg> = {}): CheckinSeg => ({
  data,
  dor,
  inchaco: false,
  falhou: false,
  ...extra,
});

const agora = new Date("2026-10-20T15:00:00Z");
const hoje = "2026-10-20";

describe("semáforo do tornozelo", () => {
  it("sem dados: neutro com convite ao primeiro check-in", () => {
    const r = avaliarSemaforo({ checkins: [], hoje, agora });
    expect(r.cor).toBe("neutro");
    expect(r.motivo).toContain("primeiro check-in");
  });

  it("verde com dor até 3, com motivo gerado do dado", () => {
    const r = avaliarSemaforo({ checkins: [ck(hoje, 2)], hoje, agora });
    expect(r.cor).toBe("verde");
    expect(r.motivo).toBe("Dor 2 de 10 hoje.");
    expect(r.avisoCheckin).toBeNull();
  });

  it("mostra o último estado com aviso quando falta o check-in de hoje", () => {
    const r = avaliarSemaforo({ checkins: [ck("2026-10-17", 2)], hoje, agora });
    expect(r.cor).toBe("verde");
    expect(r.motivo).toBe("Dor 2 de 10 há 3 dias.");
    expect(r.avisoCheckin).toBe("Faça o check-in de hoje.");
  });

  it("ontem aparece como 'ontem'", () => {
    expect(avaliarSemaforo({ checkins: [ck("2026-10-19", 1)], hoje, agora }).motivo).toBe("Dor 1 de 10 ontem.");
  });

  it("amarelo com dor 4 e 5", () => {
    expect(avaliarSemaforo({ checkins: [ck(hoje, 4)], hoje, agora }).cor).toBe("amarelo");
    expect(avaliarSemaforo({ checkins: [ck(hoje, 5)], hoje, agora }).cor).toBe("amarelo");
  });

  it("vermelho com dor 6 ou mais", () => {
    const r = avaliarSemaforo({ checkins: [ck(hoje, 6)], hoje, agora });
    expect(r.cor).toBe("vermelho");
    expect(r.motivo).toBe("Dor 6 de 10 hoje.");
  });

  it("vermelho com inchaço ou 'falhou', e o motivo diz qual", () => {
    const a = avaliarSemaforo({ checkins: [ck(hoje, 0, { inchaco: true })], hoje, agora });
    expect(a.cor).toBe("vermelho");
    expect(a.motivo).toBe("Inchaço relatado hoje.");
    const b = avaliarSemaforo({ checkins: [ck(hoje, 0, { falhou: true })], hoje, agora });
    expect(b.cor).toBe("vermelho");
    expect(b.motivo).toBe("Tornozelo cedeu hoje.");
  });

  it("o check-in mais recente pesa mais que os antigos", () => {
    const r = avaliarSemaforo({ checkins: [ck("2026-10-18", 8), ck(hoje, 1)], hoje, agora });
    expect(r.cor).toBe("verde");
  });

  it("dor 4 depois do jogo nas últimas 48 h deixa amarelo mesmo com check-in baixo", () => {
    const r = avaliarSemaforo({
      checkins: [ck(hoje, 1)],
      jogos: [{ inicio: "2026-10-20T01:00:00Z", dor: 4 }],
      hoje,
      agora,
    });
    expect(r.cor).toBe("amarelo");
    expect(r.motivo).toBe("Dor 4 de 10 depois do jogo.");
  });

  it("dor forte depois do jogo deixa vermelho", () => {
    const r = avaliarSemaforo({
      checkins: [ck(hoje, 1)],
      jogos: [{ inicio: "2026-10-20T01:00:00Z", dor: 8 }],
      hoje,
      agora,
    });
    expect(r.cor).toBe("vermelho");
  });

  it("só pós-jogo, sem check-in, também acende o semáforo", () => {
    const r = avaliarSemaforo({
      checkins: [],
      jogos: [{ inicio: "2026-10-20T01:00:00Z", dor: 5 }],
      hoje,
      agora,
    });
    expect(r.cor).toBe("amarelo");
  });
});
