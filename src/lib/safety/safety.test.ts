import { describe, expect, it } from "vitest";
import {
  SEGURANCA_PADRAO,
  avaliarSeguranca,
  diasVerdesSeguidos,
  nivelDoCheckin,
  type CheckinSeg,
} from "./index";

const ck = (data: string, dor: number, extra: Partial<CheckinSeg> = {}): CheckinSeg => ({
  data,
  dor,
  inchaco: false,
  falhou: false,
  ...extra,
});

const HOJE = "2026-10-20";

describe("nível de cada check-in", () => {
  it.each([
    [0, "liberado"],
    [3, "liberado"],
    [4, "atencao"],
    [5, "atencao"],
    [6, "bloqueio"],
    [10, "bloqueio"],
  ] as const)("dor %i -> %s", (dor, nivel) => {
    expect(nivelDoCheckin({ dor, inchaco: false, falhou: false })).toBe(nivel);
  });

  it("inchaço bloqueia mesmo com dor 0", () => {
    expect(nivelDoCheckin({ dor: 0, inchaco: true, falhou: false })).toBe("bloqueio");
  });

  it("'falhou' bloqueia mesmo com dor 0", () => {
    expect(nivelDoCheckin({ dor: 0, inchaco: false, falhou: true })).toBe("bloqueio");
  });

  it("respeita limites editados no Perfil", () => {
    const cfg = { ...SEGURANCA_PADRAO, limiteBloqueio: 7, limiteAtencao: 5 };
    expect(nivelDoCheckin({ dor: 6, inchaco: false, falhou: false }, cfg)).toBe("atencao");
    expect(nivelDoCheckin({ dor: 7, inchaco: false, falhou: false }, cfg)).toBe("bloqueio");
    expect(nivelDoCheckin({ dor: 4, inchaco: false, falhou: false }, cfg)).toBe("liberado");
  });

  it("se o inchaço não bloqueia na configuração, ainda pede atenção", () => {
    const cfg = { ...SEGURANCA_PADRAO, inchacoBloqueia: false };
    expect(nivelDoCheckin({ dor: 0, inchaco: true, falhou: false }, cfg)).toBe("atencao");
  });
});

describe("avaliação de segurança", () => {
  it("sem check-ins: sem dados e nada de progressão", () => {
    const r = avaliarSeguranca({ checkins: [], hoje: HOJE });
    expect(r.nivel).toBe("sem_dados");
    expect(r.podeProgredir).toBe(false);
  });

  it("dor 2 liberada pode progredir", () => {
    const r = avaliarSeguranca({ checkins: [ck(HOJE, 2)], hoje: HOJE });
    expect(r.nivel).toBe("liberado");
    expect(r.podeProgredir).toBe(true);
    expect(r.manterCarga).toBe(false);
  });

  it("dor 4 e 5 mantêm a carga", () => {
    for (const dor of [4, 5]) {
      const r = avaliarSeguranca({ checkins: [ck(HOJE, dor)], hoje: HOJE });
      expect(r.nivel).toBe("atencao");
      expect(r.podeProgredir).toBe(false);
      expect(r.manterCarga).toBe(true);
    }
  });

  it("dor 6 bloqueia e manda procurar ortopedista ou fisioterapeuta", () => {
    const r = avaliarSeguranca({ checkins: [ck(HOJE, 6)], hoje: HOJE });
    expect(r.nivel).toBe("bloqueio");
    expect(r.podeProgredir).toBe(false);
    expect(r.mensagem).toContain("ortopedista ou fisioterapeuta");
  });

  it("inchaço e 'falhou' bloqueiam", () => {
    expect(avaliarSeguranca({ checkins: [ck(HOJE, 1, { inchaco: true })], hoje: HOJE }).nivel).toBe("bloqueio");
    expect(avaliarSeguranca({ checkins: [ck(HOJE, 1, { falhou: true })], hoje: HOJE }).nivel).toBe("bloqueio");
  });

  it("bloqueio vale para a semana: melhora no dia seguinte ainda não libera o aumento", () => {
    const r = avaliarSeguranca({ checkins: [ck("2026-10-19", 7), ck(HOJE, 1)], hoje: HOJE });
    expect(r.nivel).toBe("liberado");
    expect(r.bloqueioNaSemana).toBe(true);
    expect(r.podeProgredir).toBe(false);
    expect(r.manterCarga).toBe(true);
  });

  it("depois de 7 dias sem bloqueio volta a liberar", () => {
    const r = avaliarSeguranca({ checkins: [ck("2026-10-13", 8), ck(HOJE, 1)], hoje: HOJE });
    expect(r.bloqueioNaSemana).toBe(false);
    expect(r.podeProgredir).toBe(true);
  });

  it("dor persistente: 3 check-ins seguidos com dor 4 ou mais", () => {
    const seq = [ck("2026-10-18", 4), ck("2026-10-19", 5), ck(HOJE, 4)];
    const r = avaliarSeguranca({ checkins: seq, hoje: HOJE });
    expect(r.dorPersistente).toBe(true);
    expect(r.mensagem).toContain("ortopedista ou fisioterapeuta");
  });

  it("dor persistente não dispara com um check-in baixo no meio", () => {
    const seq = [ck("2026-10-18", 4), ck("2026-10-19", 2), ck(HOJE, 4)];
    expect(avaliarSeguranca({ checkins: seq, hoje: HOJE }).dorPersistente).toBe(false);
  });

  it("ignora check-ins do futuro", () => {
    expect(avaliarSeguranca({ checkins: [ck("2026-10-25", 9)], hoje: HOJE }).nivel).toBe("sem_dados");
  });

  it("dor forte depois do jogo nas últimas 48 h bloqueia", () => {
    const agora = new Date("2026-10-21T15:00:00Z");
    const r = avaliarSeguranca({
      checkins: [ck("2026-10-21", 1)],
      jogos: [{ inicio: "2026-10-21T01:00:00Z", dor: 7 }],
      hoje: "2026-10-21",
      agora,
    });
    expect(r.nivel).toBe("bloqueio");
  });

  it("dor depois do jogo com mais de 48 h não pesa", () => {
    const agora = new Date("2026-10-24T15:00:00Z");
    const r = avaliarSeguranca({
      checkins: [ck("2026-10-24", 1)],
      jogos: [{ inicio: "2026-10-21T01:00:00Z", dor: 9 }],
      hoje: "2026-10-24",
      agora,
    });
    expect(r.nivel).toBe("liberado");
  });
});

describe("sequência de dias verdes", () => {
  it("conta dias seguidos liberados até hoje", () => {
    const lista = ["2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20"].map(
      (d) => ck(d, 1),
    );
    expect(diasVerdesSeguidos(lista, "2026-10-20")).toBe(7);
  });

  it("para no primeiro dia sem check-in ou com alerta", () => {
    const lista = [ck("2026-10-20", 1), ck("2026-10-19", 1), ck("2026-10-18", 5), ck("2026-10-17", 1)];
    expect(diasVerdesSeguidos(lista, "2026-10-20")).toBe(2);
    expect(diasVerdesSeguidos([ck("2026-10-19", 1), ck("2026-10-17", 1)], "2026-10-20")).toBe(1);
  });
});
