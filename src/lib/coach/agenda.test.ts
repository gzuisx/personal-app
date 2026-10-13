import { describe, expect, it } from "vitest";
import { diaDoPlano } from "../seed/plano";
import { DADOS_VAZIOS, type ExcecaoAgenda, type PlanoVersao } from "../tipos";
import { criarTreino } from "../treino/motor";
import { aplicarExcecoesAoDia, excecoesParaJogos, montarEssencial } from "./agenda";
import { ck, ultimosDias } from "./ajudas-teste";
import { diaPlanejado, versaoDoDia } from "./dia";
import { detectarMarcos } from "./marcos";

const ex = (
  data: string,
  tipo: ExcecaoAgenda["tipo"],
  extra: Partial<ExcecaoAgenda> = {},
): ExcecaoAgenda => ({
  id: `${tipo}-${data}`,
  data,
  tipo,
  ...extra,
});

describe("exceções de agenda", () => {
  it("separa jogos extras e cancelados para a lib de tempo", () => {
    const r = excecoesParaJogos([
      ex("2026-10-15", "jogo_extra", { hora: "21:00" }),
      ex("2026-10-17", "jogo_cancelado"),
      ex("2026-10-16", "viagem"),
    ]);
    expect(r.extras).toEqual([{ data: "2026-10-15", hora: "21:00" }]);
    expect(r.cancelados).toEqual(["2026-10-17"]);
  });
  it("funcional cancelado tira o bloco do instrutor", () => {
    const dia = diaDoPlano("2026-10-12", { fase: 1 });
    expect(dia.blocos.some((b) => b.instrutor)).toBe(true);
    const r = aplicarExcecoesAoDia(dia, [ex("2026-10-12", "funcional_cancelado")]);
    expect(r.dia.blocos.some((b) => b.instrutor)).toBe(false);
    expect(r.avisos[0]).toContain("Funcional cancelado");
  });
  it("jogo cancelado tira o jogo do dia", () => {
    const dia = diaDoPlano("2026-10-17", { fase: 1 });
    expect(dia.jogo).not.toBeNull();
    const r = aplicarExcecoesAoDia(dia, [ex("2026-10-17", "jogo_cancelado")]);
    expect(r.dia.jogo).toBeNull();
  });
  it("jogo extra cria o jogo e o bloco", () => {
    const dia = diaDoPlano("2026-10-14", { fase: 1 });
    const r = aplicarExcecoesAoDia(dia, [ex("2026-10-14", "jogo_extra", { hora: "21:00" })]);
    expect(r.dia.jogo).not.toBeNull();
    expect(r.dia.blocos.some((b) => b.tags.includes("Jogo"))).toBe(true);
  });
  it("viagem sugere treino sem academia", () => {
    expect(
      aplicarExcecoesAoDia(diaDoPlano("2026-10-14", { fase: 1 }), [ex("2026-10-14", "viagem")])
        .ajusteSugerido,
    ).toBe("sem_academia");
  });
  it("exercício extra entra no bloco e não duplica", () => {
    const dia = diaDoPlano("2026-10-12", { fase: 1 });
    const e = ex("2026-10-12", "exercicio_extra", { slug: "prancha" });
    const uma = aplicarExcecoesAoDia(dia, [e]).dia;
    expect(uma.blocos.flatMap((b) => b.exercicios).filter((x) => x.slug === "prancha")).toHaveLength(1);
    const duas = aplicarExcecoesAoDia(dia, [e, { ...e, id: "outro" }]).dia;
    expect(duas.blocos.flatMap((b) => b.exercicios).filter((x) => x.slug === "prancha")).toHaveLength(1);
  });
  it("exceção de outro dia não muda nada", () => {
    const dia = diaDoPlano("2026-10-12", { fase: 1 });
    expect(aplicarExcecoesAoDia(dia, [ex("2026-10-13", "funcional_cancelado")]).dia).toEqual(dia);
  });
});

describe("só tenho X minutos", () => {
  const dia = diaDoPlano("2026-10-12", { fase: 1 });
  it("cabe no tempo, mantém tornozelo e um principal", () => {
    for (const minutos of [15, 20, 30, 45]) {
      const blocos = montarEssencial(dia.blocos, minutos);
      expect(blocos.length).toBeGreaterThan(0);
      expect(blocos.some((b) => b.tags.includes("Tornozelo"))).toBe(true);
      const total = blocos.reduce((s, b) => s + b.duracaoMin, 0);
      expect(total).toBeLessThanOrEqual(minutos + 8);
    }
  });
  it("criarTreino com minutos registra como parcial", () => {
    const e = criarTreino({ id: "t", data: "2026-10-12", blocos: dia.blocos, minutos: 20, agora: 0 });
    expect(e?.minutos).toBe(20);
    expect(e!.itens.length).toBeLessThan(
      criarTreino({ id: "t", data: "2026-10-12", blocos: dia.blocos, agora: 0 })!.itens.length,
    );
  });
});

describe("diaPlanejado com modelo de plano", () => {
  const versao = (extra: Partial<PlanoVersao> = {}): PlanoVersao => ({
    id: "v1",
    chaveTemplate: "P4",
    inicio: "2026-10-12",
    fim: "2026-10-19",
    origem: "proposta",
    ativo: true,
    conteudo: {},
    ...extra,
  });
  const dados = { faseTornozelo: { fase: 1 as const, inicio: "2026-10-12" }, excecoes: [] };

  it("aplica o modelo dentro do período e volta ao Base depois", () => {
    expect(versaoDoDia("2026-10-14", [versao()])?.chaveTemplate).toBe("P4");
    expect(versaoDoDia("2026-10-19", [versao()])).toBeNull();
    expect(versaoDoDia("2026-10-11", [versao()])).toBeNull();
    expect(versaoDoDia("2026-10-14", [versao({ ativo: false })])).toBeNull();
  });
  it("versão de progressão (sem modelo) não muda o dia", () => {
    const base = diaPlanejado("2026-10-14", { ...dados, versoes: [] });
    const r = diaPlanejado("2026-10-14", { ...dados, versoes: [versao({ chaveTemplate: null })] });
    expect(r.dia).toEqual(base.dia);
  });
  it("P4 deixa o dia só com exercícios leves e avisa", () => {
    const r = diaPlanejado("2026-10-14", { ...dados, versoes: [versao()] });
    expect(r.avisos[0]).toContain("Plano P4");
    expect(r.dia.blocos.flatMap((b) => b.exercicios).every((e) => e.tipo !== "velocidade")).toBe(true);
  });
});

describe("marcos detectados", () => {
  const entrada = (extra = {}) => ({
    hoje: "2026-10-14",
    checkins: [] as ReturnType<typeof ck>[],
    sessoes: [],
    jogos: [],
    testes: [],
    marcos: [] as { chave: string; concluidoEm: string | null }[],
    config: DADOS_VAZIOS.seguranca,
    ...extra,
  });
  it("30 dias sem dor", () => {
    const checkins = ultimosDias("2026-10-14", 30).map((d) => ck(d, 1));
    expect(detectarMarcos(entrada({ checkins }))).toContain("30-dias-sem-dor");
  });
  it("não repete marco já concluído", () => {
    const checkins = ultimosDias("2026-10-14", 30).map((d) => ck(d, 1));
    expect(
      detectarMarcos(
        entrada({ checkins, marcos: [{ chave: "30-dias-sem-dor", concluidoEm: "2026-10-01" }] }),
      ),
    ).not.toContain("30-dias-sem-dor");
  });
  it("sem dados não detecta nada", () => {
    expect(detectarMarcos(entrada())).toEqual([]);
  });
});
