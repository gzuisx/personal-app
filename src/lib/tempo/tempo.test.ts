import { describe, expect, it } from "vitest";
import {
  addDias,
  contagemRegressiva,
  dataExtensoISO,
  dataISO,
  diaSemanaISO,
  diasDaSemana,
  instanteSP,
  inicioSemana,
  lembretesPreJogo,
  partesSP,
  posJogoDisponivel,
  preJogoAtivo,
  proximoJogo,
  saudacao,
  ultimoJogo,
} from "./index";

// 2026-10-13 é uma terça-feira. Horários abaixo são de Brasília (UTC-3).
const sp = (iso: string, h: number, m = 0) => instanteSP(iso, h, m);

describe("fuso America/Sao_Paulo", () => {
  it("converte instantes para a data local", () => {
    // 01:30 UTC de quarta = 22:30 de terça em Brasília
    expect(dataISO(new Date("2026-10-14T01:30:00Z"))).toBe("2026-10-13");
    expect(partesSP(new Date("2026-10-14T01:30:00Z"))).toMatchObject({ hora: 22, min: 30, diaSemana: 2 });
  });

  it("instanteSP volta ao mesmo horário local", () => {
    const d = sp("2026-10-13", 20, 30);
    expect(d.toISOString()).toBe("2026-10-13T23:30:00.000Z");
    expect(partesSP(d)).toMatchObject({ dia: 13, hora: 20, min: 30 });
  });

  it("calcula dia da semana e semana de segunda a domingo", () => {
    expect(diaSemanaISO("2026-10-13")).toBe(2);
    expect(inicioSemana("2026-10-18")).toBe("2026-10-12");
    expect(diasDaSemana("2026-10-13")[0]).toBe("2026-10-12");
    expect(diasDaSemana("2026-10-13")[6]).toBe("2026-10-18");
    expect(addDias("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("saudação e data por extenso", () => {
  it("usa os intervalos do app", () => {
    expect(saudacao(sp("2026-10-13", 4, 59))).toBe("Boa noite, Gabriel");
    expect(saudacao(sp("2026-10-13", 5))).toBe("Bom dia, Gabriel");
    expect(saudacao(sp("2026-10-13", 11, 59))).toBe("Bom dia, Gabriel");
    expect(saudacao(sp("2026-10-13", 12))).toBe("Boa tarde, Gabriel");
    expect(saudacao(sp("2026-10-13", 17, 59))).toBe("Boa tarde, Gabriel");
    expect(saudacao(sp("2026-10-13", 18))).toBe("Boa noite, Gabriel");
  });

  it("escreve a data em português", () => {
    expect(dataExtensoISO("2026-10-13")).toBe("terça, 13 de outubro");
    expect(dataExtensoISO("2026-03-01")).toBe("domingo, 1 de março");
  });
});

describe("contagem regressiva", () => {
  const min = 60_000;
  it("formata nos três níveis", () => {
    expect(contagemRegressiva(0)).toBe("agora");
    expect(contagemRegressiva(-5 * min)).toBe("agora");
    expect(contagemRegressiva(40 * min)).toBe("em 40 min");
    expect(contagemRegressiva(135 * min)).toBe("em 2 h 15 min");
    expect(contagemRegressiva(120 * min)).toBe("em 2 h");
    expect(contagemRegressiva((27 * 60) * min)).toBe("em 1 d 3 h");
    expect(contagemRegressiva((24 * 60) * min)).toBe("em 1 d");
  });
});

describe("próximo jogo", () => {
  it("segunda-feira aponta para terça 20h30", () => {
    const j = proximoJogo(sp("2026-10-12", 10));
    expect(j.data).toBe("2026-10-13");
    expect(j.slot.nome).toBe("Terça");
    expect(contagemRegressiva(j.ms)).toBe("em 1 d 10 h");
    expect(j.ms).toBe((34.5 * 60) * 60_000);
  });

  it("depois do jogo de terça vem o de sábado", () => {
    const j = proximoJogo(sp("2026-10-14", 9));
    expect(j.data).toBe("2026-10-17");
    expect(j.slot.nome).toBe("Sábado");
  });

  it("na virada de semana, sábado à noite aponta para a terça seguinte", () => {
    const j = proximoJogo(sp("2026-10-17", 22));
    expect(j.data).toBe("2026-10-20");
  });

  it("durante o jogo continua o mesmo jogo (agora)", () => {
    const j = proximoJogo(sp("2026-10-13", 21, 0));
    expect(j.data).toBe("2026-10-13");
    expect(contagemRegressiva(j.ms)).toBe("agora");
  });

  it("no domingo aponta para a terça", () => {
    expect(proximoJogo(sp("2026-10-18", 12)).data).toBe("2026-10-20");
  });

  it("achou o último jogo que já começou", () => {
    expect(ultimoJogo(sp("2026-10-14", 9))?.data).toBe("2026-10-13");
    expect(ultimoJogo(sp("2026-10-18", 9))?.data).toBe("2026-10-17");
    expect(ultimoJogo(sp("2026-10-13", 20, 0))?.data).toBe("2026-10-10");
  });
});

describe("janelas de pré e pós-jogo", () => {
  const jogo = { inicio: sp("2026-10-13", 20, 30) };

  it("pré-jogo ativo de 4 h antes até o início", () => {
    expect(preJogoAtivo(sp("2026-10-13", 16, 29), jogo)).toBe(false);
    expect(preJogoAtivo(sp("2026-10-13", 16, 30), jogo)).toBe(true);
    expect(preJogoAtivo(sp("2026-10-13", 20, 29), jogo)).toBe(true);
    expect(preJogoAtivo(sp("2026-10-13", 20, 30), jogo)).toBe(false);
  });

  it("pós-jogo aparece quando acaba e some 12 h depois do início", () => {
    expect(posJogoDisponivel(sp("2026-10-13", 21, 0), jogo)).toBe(false);
    expect(posJogoDisponivel(sp("2026-10-13", 21, 50), jogo)).toBe(true);
    expect(posJogoDisponivel(sp("2026-10-14", 8, 30), jogo)).toBe(true);
    expect(posJogoDisponivel(sp("2026-10-14", 8, 31), jogo)).toBe(false);
  });

  it("lembretes de terça aparecem conforme o horário", () => {
    const o = proximoJogo(sp("2026-10-13", 12));
    expect(lembretesPreJogo(sp("2026-10-13", 17, 29), o)).toHaveLength(0);
    expect(lembretesPreJogo(sp("2026-10-13", 17, 30), o).map((l) => l.id)).toEqual(["refeicao"]);
    expect(lembretesPreJogo(sp("2026-10-13", 19, 50), o).map((l) => l.id)).toEqual([
      "refeicao",
      "lanche",
      "ativacao",
      "aquecimento",
    ]);
    expect(lembretesPreJogo(sp("2026-10-13", 20, 31), o)).toHaveLength(0);
  });

  it("lembretes de sábado seguem a tabela do sábado", () => {
    const o = proximoJogo(sp("2026-10-17", 9));
    expect(lembretesPreJogo(sp("2026-10-17", 13, 5), o).map((l) => l.id)).toEqual(["refeicao", "ativacao"]);
  });
});
