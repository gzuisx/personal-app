import { describe, expect, it } from "vitest";
import { instanteSP, proximoJogo } from "../tempo";
import type { Checkin, Jogo, PreJogoLog } from "../tipos";
import { estadoDoJogo, jogoEmFoco, ocorrenciaDaData, type DadosDoJogo } from "./index";

const sp = (iso: string, h: number, m = 0) => instanteSP(iso, h, m);
const vazio: DadosDoJogo = { jogos: [], preJogos: [], checkins: [] };
const terca = ocorrenciaDaData("2026-10-13")!; // jogo 20h30

const registro = (extra: Partial<Jogo> = {}): Jogo => ({
  id: "jogo-1",
  inicio: terca.inicio.toISOString(),
  minutosJogados: 80,
  esforco: 7,
  dor: 3,
  gatilho: null,
  notas: null,
  status: "jogado",
  ...extra,
});
const checkin = (data: string, extra: Partial<Checkin> = {}): Checkin => ({
  data,
  dor: 2,
  inchaco: false,
  falhou: false,
  energia: 4,
  sonoFaixa: "7_8",
  gatilho: null,
  observacao: null,
  ...extra,
});
const pre = (concluido: boolean): PreJogoLog => ({
  jogoData: "2026-10-13",
  concluido,
  fasesConcluidas: 5,
  duracaoS: 600,
  tornozeleira: true,
});

const estados = (agora: Date, dados = vazio) => estadoDoJogo(agora, terca, dados).passos.map((p) => p.estado);

describe("etapa do card de jogo por horário (terça 20h30)", () => {
  it("antes de 4 h: o aquecimento ainda não abriu", () => {
    expect(estados(sp("2026-10-13", 15))).toEqual(["pendente", "bloqueado", "bloqueado"]);
    expect(estadoDoJogo(sp("2026-10-13", 15), terca, vazio).foco).toBe("antes");
  });

  it("4 h antes até o início: aquecimento ativo", () => {
    expect(estados(sp("2026-10-13", 16, 29))[0]).toBe("pendente");
    expect(estados(sp("2026-10-13", 16, 30))[0]).toBe("ativo");
    expect(estados(sp("2026-10-13", 20, 29))[0]).toBe("ativo");
    expect(estadoDoJogo(sp("2026-10-13", 18), terca, vazio).foco).toBe("antes");
  });

  it("durante o jogo: o aquecimento não vale mais e o registro ainda não abriu", () => {
    expect(estados(sp("2026-10-13", 21))).toEqual(["expirado", "bloqueado", "bloqueado"]);
  });

  it("depois do jogo: registrar fica ativo", () => {
    expect(estados(sp("2026-10-13", 21, 50))[1]).toBe("ativo");
    expect(estadoDoJogo(sp("2026-10-13", 22), terca, vazio).foco).toBe("depois");
  });

  it("a janela de registro fecha 12 h depois do início", () => {
    expect(estados(sp("2026-10-14", 8, 30))[1]).toBe("ativo");
    expect(estados(sp("2026-10-14", 8, 31))[1]).toBe("expirado");
  });

  it("no dia seguinte, o check-in vinculado fica ativo e o registro feito fica concluído", () => {
    const dados: DadosDoJogo = { ...vazio, jogos: [registro()] };
    expect(estados(sp("2026-10-14", 8), dados)).toEqual(["expirado", "concluido", "ativo"]);
    expect(estadoDoJogo(sp("2026-10-14", 8), terca, dados).foco).toBe("dia_seguinte");
  });

  it("aquecimento concluído aparece como concluído", () => {
    const dados: DadosDoJogo = { ...vazio, preJogos: [pre(true)] };
    expect(estados(sp("2026-10-13", 21), dados)[0]).toBe("concluido");
    expect(estados(sp("2026-10-13", 21), { ...vazio, preJogos: [pre(false)] })[0]).toBe("expirado");
  });

  it("check-in do dia seguinte vinculado ao jogo completa o ciclo", () => {
    const dados: DadosDoJogo = {
      jogos: [registro()],
      preJogos: [pre(true)],
      checkins: [checkin("2026-10-14", { jogoId: "jogo-1" })],
    };
    const e = estadoDoJogo(sp("2026-10-14", 9), terca, dados);
    expect(e.passos.map((p) => p.estado)).toEqual(["concluido", "concluido", "concluido"]);
    expect(e.completo).toBe(true);
    expect(e.foco).toBeNull();
    expect(e.checkinSeguinte?.jogoId).toBe("jogo-1");
  });

  it("dois dias depois, sem check-in, o passo expira", () => {
    expect(estados(sp("2026-10-15", 9), { ...vazio, jogos: [registro()] })[2]).toBe("expirado");
  });
});

describe("qual jogo o card da Hoje mostra", () => {
  it("antes do jogo da terça mostra a terça", () => {
    expect(jogoEmFoco(sp("2026-10-13", 12), vazio).data).toBe("2026-10-13");
  });

  it("na noite da terça, depois do jogo, continua na terça (registrar)", () => {
    const e = jogoEmFoco(sp("2026-10-13", 22), vazio);
    expect(e.data).toBe("2026-10-13");
    expect(e.foco).toBe("depois");
  });

  it("na quarta, ainda mostra o jogo de terça (check-in do dia seguinte)", () => {
    const e = jogoEmFoco(sp("2026-10-14", 9), { ...vazio, jogos: [registro()] });
    expect(e.data).toBe("2026-10-13");
    expect(e.foco).toBe("dia_seguinte");
  });

  it("depois de completo, passa para o jogo de sábado", () => {
    const dados: DadosDoJogo = {
      jogos: [registro()],
      preJogos: [pre(true)],
      checkins: [checkin("2026-10-14", { jogoId: "jogo-1" })],
    };
    expect(jogoEmFoco(sp("2026-10-14", 9), dados).data).toBe("2026-10-17");
  });

  it("na quinta mostra o sábado", () => {
    expect(jogoEmFoco(sp("2026-10-15", 10), vazio).data).toBe("2026-10-17");
  });

  it("na virada de semana: sábado à noite, depois domingo, e segunda mostra a terça", () => {
    expect(jogoEmFoco(sp("2026-10-17", 16), vazio).data).toBe("2026-10-17");
    expect(jogoEmFoco(sp("2026-10-18", 10), vazio).data).toBe("2026-10-17"); // dia seguinte do sábado
    expect(jogoEmFoco(sp("2026-10-19", 10), vazio).data).toBe("2026-10-20");
  });

  it("o card em andamento é o do próprio jogo", () => {
    const e = jogoEmFoco(sp("2026-10-13", 21), vazio);
    expect(e.data).toBe("2026-10-13");
    expect(proximoJogo(sp("2026-10-13", 21)).ms).toBeLessThan(0);
  });
});

describe("ocorrência por data", () => {
  it("terça e sábado têm jogo; outros dias não", () => {
    expect(ocorrenciaDaData("2026-10-13")?.slot.nome).toBe("Terça");
    expect(ocorrenciaDaData("2026-10-17")?.slot.nome).toBe("Sábado");
    expect(ocorrenciaDaData("2026-10-14")).toBeNull();
  });

  it("aceita jogo extra já registrado", () => {
    const extra = registro({ inicio: instanteSP("2026-10-15", 19, 0).toISOString() });
    expect(ocorrenciaDaData("2026-10-15", [extra])?.inicio.toISOString()).toBe(extra.inicio);
  });
});
