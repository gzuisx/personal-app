import { describe, expect, it } from "vitest";
import { estadoDoJogo, ocorrenciaDaData, type DadosDoJogo } from "./jogo";
import { proximaMelhorAcao, proximoBlocoPendente } from "./hoje";
import { diaDoPlano } from "./seed/plano";
import { instanteSP } from "./tempo";
import type { Checkin, Sessao } from "./tipos";

const sp = (iso: string, h: number, m = 0) => instanteSP(iso, h, m);
const vazio: DadosDoJogo = { jogos: [], preJogos: [], checkins: [] };
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
const ss = (data: string, bloco: string): Sessao => ({
  data,
  bloco,
  resultado: "feito",
  esforco: 5,
  duracaoMin: 30,
  notas: null,
});

function acao(iso: string, h: number, checkins: Checkin[], sessoes: Sessao[] = [], dados = vazio) {
  const agora = sp(iso, h);
  const ocorrencia = ocorrenciaDaData(iso === "2026-10-13" || iso === "2026-10-17" ? iso : "2026-10-17")!;
  return proximaMelhorAcao({
    agora,
    dia: diaDoPlano(iso),
    checkins,
    sessoes,
    jogo: estadoDoJogo(agora, ocorrencia, dados),
  });
}

describe("próxima melhor ação", () => {
  it("de manhã sem check-in: fazer check-in", () => {
    expect(acao("2026-10-14", 8, [])?.id).toBe("checkin");
  });

  it("antes das 6h não cobra o check-in", () => {
    expect(acao("2026-10-14", 5, [])?.id).not.toBe("checkin");
  });

  it("com check-in feito, sugere o treino do período", () => {
    const a = acao("2026-10-14", 8, [ck("2026-10-14")]);
    expect(a).toMatchObject({ id: "treino", blocoId: "qua-tornozelo" });
  });

  it("à noite, sugere o bloco da noite", () => {
    const a = acao(
      "2026-10-14",
      18,
      [ck("2026-10-14")],
      [ss("2026-10-14", "qua-tornozelo"), ss("2026-10-14", "qua-forca")],
    );
    expect(a).toMatchObject({ id: "treino", blocoId: "qua-noite" });
  });

  it("tudo feito: nenhuma ação", () => {
    const sessoes = ["qua-tornozelo", "qua-forca", "qua-noite"].map((b) => ss("2026-10-14", b));
    expect(acao("2026-10-14", 20, [ck("2026-10-14")], sessoes)).toBeNull();
  });

  it("no dia do jogo, na janela de 4 h, sugere aquecer", () => {
    const sessoes = ["ter-tornozelo", "ter-mobilidade"].map((b) => ss("2026-10-13", b));
    expect(acao("2026-10-13", 18, [ck("2026-10-13")], sessoes)?.id).toBe("aquecer");
  });

  it("depois do jogo, sugere registrar", () => {
    const sessoes = ["ter-tornozelo", "ter-mobilidade"].map((b) => ss("2026-10-13", b));
    expect(acao("2026-10-13", 22, [ck("2026-10-13")], sessoes)?.id).toBe("registrar_jogo");
  });

  it("escolhe o próximo bloco pendente respeitando o período", () => {
    const dia = diaDoPlano("2026-10-12");
    expect(proximoBlocoPendente(dia, [], 8)?.id).toBe("seg-tornozelo");
    expect(proximoBlocoPendente(dia, [], 19)?.id).toBe("seg-noite");
    // se a manhã inteira ficou pendente e já é noite, ainda assim volta o que sobrou, sem travar
    expect(
      proximoBlocoPendente(
        dia,
        ["seg-tornozelo", "seg-forca", "seg-noite"].map((b) => ss("2026-10-12", b)),
        19,
      ),
    ).toBeNull();
  });
});
