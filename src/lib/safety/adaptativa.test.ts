import { describe, expect, it } from "vitest";
import { addDias } from "../tempo";
import { ALERTA_SEGURANCA, avaliarSeguranca, type CheckinSeg } from "./index";

const D0 = "2026-10-12";
const ck = (dia: number, dor: number, extra: Partial<CheckinSeg> = {}): CheckinSeg => ({
  data: addDias(D0, dia),
  dor,
  inchaco: false,
  falhou: false,
  ...extra,
});
const em = (dia: number) => addDias(D0, dia);
const avalia = (checkins: CheckinSeg[], dia: number) => avaliarSeguranca({ checkins, hoje: em(dia) });

// C2: os 4 cenários da especificação (seção 1.2) + a liberação automática de 7 dias.
describe("segurança adaptativa (C2)", () => {
  it("cenário 1: bloqueio hoje não libera progressão", () => {
    const r = avalia([ck(0, 7)], 0);
    expect(r.nivel).toBe("bloqueio");
    expect(r.podeProgredir).toBe(false);
    expect(r.restricaoAtiva).toBe(true);
    expect(r.ultimoBloqueio).toBe(em(0));
    expect(r.diasDesdeBloqueio).toBe(0);
    expect(r.mensagem).toBe(ALERTA_SEGURANCA);
  });

  it("cenário 2: 2 dias depois, com dor 2, ainda não libera", () => {
    const r = avalia([ck(0, 7), ck(1, 2), ck(2, 2)], 2);
    expect(r.nivel).toBe("liberado");
    expect(r.diasDesdeBloqueio).toBe(2);
    expect(r.podeProgredir).toBe(false);
    expect(r.manterCarga).toBe(true);
    expect(r.falta.join(" ")).toContain("Falta 1 dia".replace("Falta", "Faltam"));
  });

  it("cenário 3: 3 dias depois, com dor 2 e 2 check-ins bons, libera", () => {
    const r = avalia([ck(0, 7), ck(2, 2), ck(3, 2)], 3);
    expect(r.diasDesdeBloqueio).toBe(3);
    expect(r.restricaoAtiva).toBe(false);
    expect(r.podeProgredir).toBe(true);
    expect(r.falta).toHaveLength(0);
  });

  it("cenário 3b: 3 dias depois mas com só 1 check-in bom ainda não libera", () => {
    const r = avalia([ck(0, 7), ck(3, 2)], 3);
    expect(r.podeProgredir).toBe(false);
    expect(r.falta.join(" ")).toContain("2 check-ins");
  });

  it("cenário 3c: 3 dias depois com um dos 2 últimos check-ins em atenção não libera", () => {
    const r = avalia([ck(0, 7), ck(2, 4), ck(3, 2)], 3);
    expect(r.podeProgredir).toBe(false);
  });

  it("cenário 4: novo bloqueio no meio reinicia a contagem", () => {
    const lista = [ck(0, 7), ck(2, 2), ck(3, 8), ck(4, 2), ck(5, 2), ck(6, 2)];
    expect(avalia(lista.slice(0, 4), 3).podeProgredir).toBe(false); // bloqueio novo hoje
    expect(avalia(lista.slice(0, 5), 4).podeProgredir).toBe(false); // 1 dia depois do novo
    expect(avalia(lista.slice(0, 5), 4).ultimoBloqueio).toBe(em(3));
    expect(avalia(lista.slice(0, 6), 5).podeProgredir).toBe(false); // 2 dias depois do novo
    expect(avalia(lista, 6).podeProgredir).toBe(true); // 3 dias depois do novo, 2 bons
  });

  it("libera sozinho depois de 7 dias com o check-in mais recente bom", () => {
    const r = avalia([ck(0, 8), ck(7, 1)], 7);
    expect(r.diasDesdeBloqueio).toBe(7);
    expect(r.podeProgredir).toBe(true);
  });

  it("aos 7 dias com o check-in mais recente em atenção, não libera", () => {
    expect(avalia([ck(0, 8), ck(7, 4)], 7).podeProgredir).toBe(false);
  });

  it("sem nenhum check-in depois do bloqueio, nem aos 7 dias libera", () => {
    expect(avalia([ck(0, 8)], 8).podeProgredir).toBe(false);
  });

  it("dor forte depois do jogo também é evento de bloqueio", () => {
    const r = avaliarSeguranca({
      checkins: [ck(2, 1), ck(3, 1)],
      jogos: [{ inicio: "2026-10-12T23:30:00.000Z", dor: 7 }], // 20h30 de 12/10 em São Paulo
      hoje: em(3),
      agora: new Date("2026-10-15T15:00:00Z"),
    });
    expect(r.ultimoBloqueio).toBe(em(0));
    expect(r.motivoBloqueio).toContain("depois do jogo");
    expect(r.podeProgredir).toBe(true); // 3 dias depois, 2 check-ins bons
  });

  it("inchaço e 'falhou' contam como evento e o motivo diz qual", () => {
    expect(avalia([ck(0, 0, { inchaco: true })], 0).motivoBloqueio).toContain("inchaço");
    expect(avalia([ck(0, 0, { falhou: true })], 0).motivoBloqueio).toContain("cedeu");
  });
});
