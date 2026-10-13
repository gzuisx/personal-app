import { describe, expect, it } from "vitest";
import { buildCoachContext } from "../coach/contexto";
import { diaPlanejado } from "../coach/dia";
import { avaliarFaseDoFoco } from "../coach/fase";
import { avaliarSeguranca, nivelDoCheckin, SEGURANCA_PADRAO, type CheckinSeg } from "../safety";
import { CATALOGO_POR_ID } from "../seed/catalogo";
import { diaDoPlano, rotinaTornozelo } from "../seed/plano";
import { PROTOCOLOS, REGIOES_FOCO } from "../seed/protocolos";
import { DADOS_VAZIOS, type Checkin, type DadosApp, type SerieLog } from "../tipos";
import {
  focoPadrao,
  normalizarFocos,
  novoFoco,
  rotulosDoFoco,
  textoSegurancaTroca,
  trocarFocoNaLista,
  type FocoLesao,
} from ".";

const HOJE = "2026-10-21"; // quarta
const fase1 = { fase: 1 as const, inicio: "2026-10-13" };

const posterior = (fase: 1 | 2 | 3 = 1): FocoLesao => ({
  ...novoFoco({
    id: "f2",
    regiao: "posterior_coxa",
    lado: "direito",
    hoje: "2026-10-18",
    faseTornozelo: fase1,
  }),
  fase,
});

const checkin = (data: string, dor: number, extra: Partial<Checkin> = {}): Checkin => ({
  data,
  dor,
  inchaco: false,
  falhou: false,
  energia: 4,
  sonoFaixa: "7_8",
  gatilho: null,
  observacao: null,
  ...extra,
});

const dadosCom = (foco: FocoLesao, checkins: Checkin[] = []): DadosApp => ({
  ...DADOS_VAZIOS,
  checkins,
  foco,
  focos: [foco],
});

describe("protocolos", () => {
  it("todos os exercícios dos protocolos existem no catálogo", () => {
    for (const r of REGIOES_FOCO) {
      for (const f of Object.values(PROTOCOLOS[r].fases)) {
        for (const e of f.exercicios) expect(CATALOGO_POR_ID[e.slug], `${r} ${e.slug}`).toBeDefined();
        for (const s of [...f.restricoes.evitar, ...Object.keys(f.restricoes.substituir)]) {
          expect(CATALOGO_POR_ID[s], `${r} ${s}`).toBeDefined();
        }
        for (const s of Object.values(f.restricoes.substituir)) expect(CATALOGO_POR_ID[s]).toBeDefined();
      }
    }
  });

  it("o protocolo do tornozelo é exatamente a rotina de antes", () => {
    expect(rotinaTornozelo(1).map((e) => [e.slug, e.series, e.repeticoes])).toEqual([
      ["eq-um-pe", "3", "30 s"],
      ["el-fora", "3", "15"],
      ["el-dentro", "3", "15"],
      ["el-cima", "3", "15"],
      ["pant-degrau", "3", "12"],
      ["joelho-parede", "2", "10"],
    ]);
    expect(rotinaTornozelo(2).map((e) => e.slug)).toEqual(["pant-um-pe", "eq-almofada", "agach-uma-perna"]);
    expect(rotinaTornozelo(4).map((e) => e.slug)).toEqual(["salto-aterrissagem", "salto-lateral"]);
  });
});

describe("plano com foco", () => {
  it("com o tornozelo como foco, o dia é igual ao de antes", () => {
    for (let d = 13; d <= 19; d++) {
      const iso = `2026-10-${d}`;
      expect(diaDoPlano(iso, { fase: 1, foco: { regiao: "tornozelo", lado: "direito", fase: 1 } })).toEqual(
        diaDoPlano(iso, { fase: 1 }),
      );
    }
  });

  it("com o posterior como foco, a reabilitação muda e o tornozelo fica na manutenção", () => {
    const dia = diaDoPlano(HOJE, { fase: 1, foco: { regiao: "posterior_coxa", lado: "direito", fase: 1 } });
    const reab = dia.blocos.find((b) => b.id === "qua-tornozelo")!;
    expect(reab.tags).toEqual(["Reabilitação"]);
    expect(reab.titulo).toBe("Reabilitação: posterior de coxa direito");
    const slugs = reab.exercicios.map((e) => e.slug);
    expect(slugs).toContain("isometria-posterior");
    expect(slugs).toContain("el-fora");
    expect(slugs).toContain("eq-um-pe");
  });

  it("força continua, sem o que a fase 1 do posterior não permite", () => {
    const dia = diaDoPlano(HOJE, { fase: 1, foco: { regiao: "posterior_coxa", lado: "direito", fase: 1 } });
    const forca = dia.blocos.find((b) => b.id === "qua-forca")!;
    const slugs = forca.exercicios.map((e) => e.slug);
    expect(slugs).not.toContain("stiff");
    expect(slugs).not.toContain("flexora");
    expect(slugs).toContain("agachamento-goblet");
    expect(slugs).toContain("bulgaro");
    expect(forca.observacao).toMatch(/Ajustado pelo foco/);
  });

  it("velocidade se adapta: sem arrancadas na fase 1 e skipping na fase 2", () => {
    const quinta = "2026-10-22";
    const f1 = diaDoPlano(quinta, { foco: { regiao: "posterior_coxa", lado: "direito", fase: 1 } });
    const v1 = f1.blocos.find((b) => b.tags.includes("Velocidade"))!;
    expect(v1.exercicios.map((e) => e.slug)).not.toContain("vel-arrancadas");
    const f2 = diaDoPlano(quinta, { foco: { regiao: "posterior_coxa", lado: "direito", fase: 2 } });
    const v2 = f2.blocos.find((b) => b.tags.includes("Velocidade"))!;
    expect(v2.exercicios.map((e) => e.slug)).toContain("skipping");
    expect(v2.exercicios.map((e) => e.slug)).not.toContain("vel-arrancadas");
  });

  it("diaPlanejado usa o foco dos dados", () => {
    const r = diaPlanejado(HOJE, dadosCom(posterior()));
    expect(r.dia.blocos.some((b) => b.tags.includes("Reabilitação"))).toBe(true);
  });
});

describe("troca de foco", () => {
  it("fica no máximo um foco ativo e o anterior vai para o histórico", () => {
    const antigo = focoPadrao(fase1);
    const lista = trocarFocoNaLista([antigo], posterior());
    expect(lista.filter((f) => f.ativo)).toHaveLength(1);
    expect(lista.find((f) => f.id === antigo.id)?.ativo).toBe(false);
  });

  it("outra região começa na fase 1; o tornozelo volta na fase guardada", () => {
    const fase3 = { fase: 3 as const, inicio: "2026-12-01" };
    expect(
      novoFoco({ id: "a", regiao: "panturrilha", lado: "esquerdo", hoje: HOJE, faseTornozelo: fase3 }).fase,
    ).toBe(1);
    const t = novoFoco({ id: "b", regiao: "tornozelo", lado: "direito", hoje: HOJE, faseTornozelo: fase3 });
    expect(t.fase).toBe(3);
    expect(t.faseInicio).toBe("2026-12-01");
  });

  it("sem foco gravado, o tornozelo direito é o foco, com a fase do perfil", () => {
    const { foco, focos } = normalizarFocos([], { fase: 2, inicio: "2026-11-03" });
    expect(foco.regiao).toBe("tornozelo");
    expect(foco.fase).toBe(2);
    expect(focos).toHaveLength(1);
  });

  it("textos: tornozelo igual a antes; outras regiões pedem avaliação profissional", () => {
    expect(rotulosDoFoco({ regiao: "tornozelo", lado: "direito" }).dor).toBe("Dor no tornozelo direito");
    expect(rotulosDoFoco({ regiao: "panturrilha", lado: "esquerdo" }).dor).toBe(
      "Dor na panturrilha esquerda",
    );
    expect(textoSegurancaTroca({ regiao: "posterior_coxa", lado: "direito" })).toMatch(/fisioterapeuta/);
  });

  it("COM bloqueio: depois de trocar o foco, a segurança continua bloqueando", () => {
    // dor 7 no posterior ontem (já com o foco novo)
    const checkins = [checkin("2026-10-20", 7, { focoRegiao: "posterior_coxa", dorTornozelo: 1 })];
    const ctx = buildCoachContext(new Date(`${HOJE}T12:00:00-03:00`), dadosCom(posterior(), checkins));
    expect(ctx.seguranca.nivel).toBe("bloqueio");
    expect(ctx.seguranca.podeProgredir).toBe(false);
  });

  it("COM bloqueio anterior do tornozelo: trocar o foco não apaga a restrição", () => {
    const checkins = [
      checkin("2026-10-19", 7), // tornozelo, antes da troca
      checkin("2026-10-20", 1, { focoRegiao: "posterior_coxa", dorTornozelo: 1 }),
    ];
    const ctx = buildCoachContext(new Date(`${HOJE}T12:00:00-03:00`), dadosCom(posterior(), checkins));
    expect(ctx.seguranca.restricaoAtiva).toBe(true);
    expect(ctx.seguranca.podeProgredir).toBe(false);
  });

  it("com outro foco, dor 6 no tornozelo continua bloqueando (as regras do tornozelo nunca afrouxam)", () => {
    const c: CheckinSeg = { data: HOJE, dor: 0, dorTornozelo: 6, inchaco: false, falhou: false };
    expect(nivelDoCheckin(c, SEGURANCA_PADRAO)).toBe("bloqueio");
    expect(avaliarSeguranca({ checkins: [c], hoje: HOJE }).podeProgredir).toBe(false);
  });

  it("inchaço ou falha na região do foco bloqueiam igual ao tornozelo", () => {
    expect(nivelDoCheckin({ dor: 2, inchaco: true, falhou: false, dorTornozelo: 0 })).toBe("bloqueio");
    expect(nivelDoCheckin({ dor: 2, inchaco: false, falhou: true, dorTornozelo: 0 })).toBe("bloqueio");
  });

  it("SEM bloqueio: depois de trocar o foco, a segurança libera e o plano usa a reabilitação nova", () => {
    const checkins = [
      checkin("2026-10-20", 1, { focoRegiao: "posterior_coxa", dorTornozelo: 0 }),
      checkin(HOJE, 2, { focoRegiao: "posterior_coxa", dorTornozelo: 1 }),
    ];
    const ctx = buildCoachContext(new Date(`${HOJE}T12:00:00-03:00`), dadosCom(posterior(), checkins));
    expect(ctx.seguranca.nivel).toBe("liberado");
    expect(ctx.seguranca.podeProgredir).toBe(true);
    expect(ctx.plano.blocos.find((b) => b.id === "qua-tornozelo")?.tags).toEqual(["Reabilitação"]);
    expect(ctx.fase.fase).toBe(1);
  });

  it("o tornozelo como foco mantém a avaliação de sempre", () => {
    const sem = { diasVerdes: 0, series: [], jogos: [], testes: [], podeProgredir: true };
    expect(avaliarFaseDoFoco({ regiao: "tornozelo", fase: 1, ...sem }).criterios[1].texto).toMatch(
      /Panturrilha no degrau/,
    );
  });
});

describe("fase do foco", () => {
  const serie = (data: string, exercicio: string, numero: number, extra: Partial<SerieLog>): SerieLog => ({
    execucaoId: `e-${data}`,
    data,
    bloco: "qua-tornozelo",
    exercicio,
    numero,
    cargaKg: null,
    reps: null,
    duracaoS: null,
    rir: null,
    esforco: null,
    dorDurante: 0,
    criadoEm: `${data}T10:00:00Z`,
    ...extra,
  });

  it("posterior: propõe a fase 2 só com os critérios e a segurança liberada", () => {
    const series: SerieLog[] = [];
    for (const d of ["2026-10-16", "2026-10-18", "2026-10-20"]) {
      for (let n = 1; n <= 3; n++) {
        series.push(serie(d, "isometria-posterior", n, { duracaoS: 30 }));
        series.push(serie(d, "ponte-gluteo", n, { reps: 12 }));
      }
    }
    const base = { regiao: "posterior_coxa" as const, fase: 1 as const, series, jogos: [], testes: [] };
    expect(avaliarFaseDoFoco({ ...base, diasVerdes: 7, podeProgredir: true }).apto).toBe(true);
    expect(avaliarFaseDoFoco({ ...base, diasVerdes: 7, podeProgredir: false }).apto).toBe(false);
    expect(avaliarFaseDoFoco({ ...base, diasVerdes: 3, podeProgredir: true }).apto).toBe(false);
  });

  it("na fase 3 de outra região não há próxima fase", () => {
    const sem = { diasVerdes: 30, series: [], jogos: [], testes: [], podeProgredir: true };
    expect(avaliarFaseDoFoco({ regiao: "panturrilha", fase: 3, ...sem }).proxima).toBeNull();
  });
});
