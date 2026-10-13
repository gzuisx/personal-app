import { describe, expect, it } from "vitest";
import { SEGURANCA_PADRAO } from "../safety";
import type { Checkin } from "../tipos";
import { alertaDaVariacao, variacaoDeCarga } from "./carga";
import { calcularProntidao, modoDaProntidao } from "./prontidao";

const HOJE = "2026-10-14";
const ck = (extra: Partial<Checkin> = {}, data = HOJE): Checkin => ({
  data,
  dor: 0,
  inchaco: false,
  falhou: false,
  energia: 5,
  sonoFaixa: "7_8",
  gatilho: null,
  observacao: null,
  ...extra,
});
const semCarga = { variacao: null, suficiente: false };
const prontidao = (c: Checkin[], extra: Partial<Parameters<typeof calcularProntidao>[0]> = {}) =>
  calcularProntidao({
    checkins: c,
    hoje: HOJE,
    config: SEGURANCA_PADRAO,
    carga: semCarga,
    horasDesdeUltimoJogo: null,
    ...extra,
  });

describe("prontidão: fórmula da seção 3.3", () => {
  it("tudo bom: 100", () => {
    expect(prontidao([ck()]).pontuacao).toBe(100);
  });

  it("dor desconta 4 pontos por nível", () => {
    expect(prontidao([ck({ dor: 2 })]).pontuacao).toBe(92);
    expect(prontidao([ck({ dor: 5 })]).pontuacao).toBe(80);
  });

  it("sono: menos de 5 h -20, 5 a 6 h -12, 7 a 8 h e mais de 8 h 0", () => {
    expect(prontidao([ck({ sonoFaixa: "menos_5" })]).pontuacao).toBe(80);
    expect(prontidao([ck({ sonoFaixa: "5_6" })]).pontuacao).toBe(88);
    expect(prontidao([ck({ sonoFaixa: "7_8" })]).pontuacao).toBe(100);
    expect(prontidao([ck({ sonoFaixa: "mais_8" })]).pontuacao).toBe(100);
  });

  it("energia desconta 3,75 por ponto abaixo de 5", () => {
    expect(prontidao([ck({ energia: 1 })]).pontuacao).toBe(85);
    expect(prontidao([ck({ energia: 4 })]).pontuacao).toBe(96);
  });

  it("exemplo da especificação: sono 5-6 h (-12) e dor 2 (-8) = 80", () => {
    const p = prontidao([ck({ dor: 2, sonoFaixa: "5_6" })]);
    expect(p.pontuacao).toBe(80);
    expect(p.componentes.map((c) => [c.id, c.pontos])).toEqual(
      expect.arrayContaining([
        ["dor", -8],
        ["sono", -12],
      ]),
    );
  });

  it("jogo: menos de 24 h -10, de 24 a 48 h -5, depois 0", () => {
    expect(prontidao([ck()], { horasDesdeUltimoJogo: 10 }).pontuacao).toBe(90);
    expect(prontidao([ck()], { horasDesdeUltimoJogo: 23.9 }).pontuacao).toBe(90);
    expect(prontidao([ck()], { horasDesdeUltimoJogo: 24 }).pontuacao).toBe(95);
    expect(prontidao([ck()], { horasDesdeUltimoJogo: 47.9 }).pontuacao).toBe(95);
    expect(prontidao([ck()], { horasDesdeUltimoJogo: 48 }).pontuacao).toBe(100);
    expect(prontidao([ck()], { horasDesdeUltimoJogo: null }).pontuacao).toBe(100);
  });

  it("carga: acima de 1,30 desconta 15, de 1,15 a 1,30 desconta 8, abaixo não desconta", () => {
    const c = (variacao: number) => ({ variacao, suficiente: true });
    expect(prontidao([ck()], { carga: c(1.31) }).pontuacao).toBe(85);
    expect(prontidao([ck()], { carga: c(1.3) }).pontuacao).toBe(92);
    expect(prontidao([ck()], { carga: c(1.15) }).pontuacao).toBe(92);
    expect(prontidao([ck()], { carga: c(1.14) }).pontuacao).toBe(100);
    expect(prontidao([ck()], { carga: { variacao: 2, suficiente: false } }).pontuacao).toBe(100);
  });

  it("sem check-in hoje: usa o último com desconto de 10 pontos", () => {
    const p = prontidao([ck({ dor: 1 }, "2026-10-12")]);
    expect(p.checkinDeHoje).toBe(false);
    expect(p.pontuacao).toBe(100 - 4 - 10);
    expect(p.componentes.some((c) => c.id === "sem_checkin")).toBe(true);
  });

  it("sem nenhum check-in: pontuação estimada de 70", () => {
    expect(prontidao([]).pontuacao).toBe(70);
  });

  it("nunca sai de 0 a 100", () => {
    const p = prontidao([ck({ dor: 5, sonoFaixa: "menos_5", energia: 1 })], {
      horasDesdeUltimoJogo: 5,
      carga: { variacao: 2, suficiente: true },
    });
    expect(p.pontuacao).toBeGreaterThanOrEqual(0);
    expect(p.pontuacao).toBeLessThanOrEqual(100);
  });
});

describe("prontidão: sobrescritas de segurança (teto de 40)", () => {
  it.each([
    ["inchaço", { inchaco: true }],
    ["falhou", { falhou: true }],
    ["dor 6", { dor: 6 }],
    ["dor 10", { dor: 10 }],
  ])("%s limita a 40 mesmo com o resto perfeito", (_, extra) => {
    const p = prontidao([ck(extra)]);
    expect(p.pontuacao).toBeLessThanOrEqual(40);
    expect(p.sobrescrita?.teto).toBe(40);
    expect(modoDaProntidao(p.pontuacao)).toBe("recuperacao");
  });

  it("dor 5 não sobrescreve", () => {
    expect(prontidao([ck({ dor: 5 })]).sobrescrita).toBeNull();
  });

  it("respeita o limite de bloqueio editado no Perfil", () => {
    const config = { ...SEGURANCA_PADRAO, limiteBloqueio: 8, limiteAtencao: 5 };
    expect(prontidao([ck({ dor: 6 })], { config }).sobrescrita).toBeNull();
    expect(prontidao([ck({ dor: 8 })], { config }).sobrescrita).not.toBeNull();
  });

  it("a sobrescrita vale mesmo quando o check-in é de ontem", () => {
    const p = prontidao([ck({ falhou: true }, "2026-10-13")]);
    expect(p.sobrescrita).not.toBeNull();
    expect(p.pontuacao).toBeLessThanOrEqual(40);
  });
});

describe("modo do dia: fronteiras 34/35, 54/55, 74/75", () => {
  it.each([
    [100, "completo"],
    [75, "completo"],
    [74, "reduzido"],
    [55, "reduzido"],
    [54, "recuperacao"],
    [35, "recuperacao"],
    [34, "folga"],
    [0, "folga"],
  ] as const)("prontidão %i -> %s", (p, modo) => {
    expect(modoDaProntidao(p)).toBe(modo);
  });
});

describe("carga: variação e alerta (3.4)", () => {
  it("menos de 3 semanas de histórico: 'poucos dados', sem alertar", () => {
    expect(alertaDaVariacao(2, false)).toBe("poucos_dados");
    const v = variacaoDeCarga(
      [
        {
          data: "2026-10-14",
          bloco: "qua-forca",
          resultado: "feito",
          esforco: 8,
          duracaoMin: 60,
          notas: null,
        },
      ],
      [],
      HOJE,
    );
    expect(v.suficiente).toBe(false);
    expect(v.alerta).toBe("poucos_dados");
  });

  it.each([
    [1.29, "nenhum"],
    [1.3, "nenhum"],
    [1.31, "amarelo"],
    [1.5, "amarelo"],
    [1.51, "vermelho"],
  ] as const)("variação %f -> %s", (v, esperado) => {
    expect(alertaDaVariacao(v, true)).toBe(esperado);
  });

  it("calcula esforço x minutos e compara com a média das 4 semanas anteriores", () => {
    const sess = (data: string, esforco: number, min: number) => ({
      data,
      bloco: "qua-forca",
      resultado: "feito" as const,
      esforco,
      duracaoMin: min,
      notas: null,
    });
    // referência: 3 semanas anteriores com carga 100 cada; semana atual com 140
    const lista = [
      sess("2026-10-14", 7, 20), // 140 (janela atual: 08 a 14/10)
      sess("2026-10-05", 10, 10), // janela 1 (01 a 07/10): 100
      sess("2026-09-28", 10, 10), // janela 2: 100
      sess("2026-09-21", 10, 10), // janela 3: 100
    ];
    const v = variacaoDeCarga(lista, [], HOJE);
    expect(v.atual).toBe(140);
    expect(v.referencia).toBe(100);
    expect(v.semanasDeReferenciaComDados).toBe(3);
    expect(v.suficiente).toBe(true);
    expect(v.variacao).toBeCloseTo(1.4);
    expect(v.alerta).toBe("amarelo");
  });

  it("jogo entra na carga com esforço x minutos", () => {
    const v = variacaoDeCarga(
      [],
      [
        {
          inicio: "2026-10-14T01:00:00.000Z",
          minutosJogados: 80,
          esforco: 7,
          dor: 2,
          gatilho: null,
          notas: null,
          status: "jogado",
        },
      ],
      HOJE,
    );
    expect(v.atual).toBe(560);
  });

  it("sessão 'não fiz' e jogo cancelado não contam", () => {
    const v = variacaoDeCarga(
      [
        {
          data: "2026-10-14",
          bloco: "qua-forca",
          resultado: "nao_fiz",
          esforco: 9,
          duracaoMin: 60,
          notas: null,
        },
      ],
      [
        {
          inicio: "2026-10-14T01:00:00.000Z",
          minutosJogados: 80,
          esforco: 7,
          dor: 2,
          gatilho: null,
          notas: null,
          status: "cancelado",
        },
      ],
      HOJE,
    );
    expect(v.atual).toBe(0);
  });
});
