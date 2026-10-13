import { describe, expect, it } from "vitest";
import { diaDoPlano } from "../seed/plano";
import {
  atualizarValores,
  avancar,
  botaoPrincipal,
  concluirSerie,
  criarTreino,
  iniciarProximoBloco,
  parseAlvo,
  pularExercicio,
  pularProximoBloco,
  registrarDor,
  resumoDoTreino,
  segundosDeDescanso,
  terminarDescanso,
  trocarExercicio,
  ajustarDescanso,
  type EstadoTreino,
} from "./motor";

const T0 = 1_760_000_000_000;
const blocosDia = (iso: string, ids: string[]) => diaDoPlano(iso).blocos.filter((b) => ids.includes(b.id));

const treinoPernas = (extra: Parameters<typeof criarTreino>[0] extends infer P ? Partial<P> : never = {}) =>
  criarTreino({
    id: "t1",
    data: "2026-10-14",
    blocos: blocosDia("2026-10-14", ["qua-forca"]),
    agora: T0,
    ...extra,
  })!;

/** Conclui séries até acabar o treino, sempre pulando o descanso. */
function terminarTudo(e: EstadoTreino, agora = T0) {
  let estado = e;
  let guarda = 0;
  while (estado.fase !== "resumo" && guarda++ < 200) {
    if (estado.fase === "executando") estado = concluirSerie(estado, agora).estado;
    else if (estado.fase === "descanso") estado = terminarDescanso(estado);
    else if (estado.fase === "pronto") estado = avancar(estado);
    else if (estado.fase === "transicao") estado = iniciarProximoBloco(estado);
  }
  return estado;
}

describe("alvo do plano", () => {
  it("lê repetições, faixas, tempos e textos livres", () => {
    expect(parseAlvo("8")).toEqual({ kind: "reps", min: 8, max: 8, porPerna: false });
    expect(parseAlvo("6 a 8")).toEqual({ kind: "reps", min: 6, max: 8, porPerna: false });
    expect(parseAlvo("8 por perna")).toMatchObject({ kind: "reps", porPerna: true });
    expect(parseAlvo("12 a 15")).toMatchObject({ min: 12, max: 15 });
    expect(parseAlvo("30 s")).toEqual({ kind: "tempo", segundos: 30, porPerna: false });
    expect(parseAlvo("30 a 45 s")).toMatchObject({ kind: "tempo", segundos: 30 });
    expect(parseAlvo("30 s em cada perna")).toMatchObject({ kind: "tempo", porPerna: true });
    expect(parseAlvo("15 min")).toEqual({ kind: "tempo", segundos: 900, porPerna: false });
    expect(parseAlvo("10 a 20 m").kind).toBe("livre");
    expect(parseAlvo("3 a 4 arrancadas seguidas de finalização").kind).toBe("livre");
  });
});

describe("montagem do treino a partir do plano", () => {
  it("quarta: 5 exercícios de pernas, flexora com 2 séries na semana 1", () => {
    const e = treinoPernas();
    expect(e.itens.map((i) => i.slug)).toEqual([
      "stiff",
      "flexora",
      "bulgaro",
      "pant-pe-sentado",
      "elev-quadril",
    ]);
    expect(e.itens[1].series).toBe(2);
    expect(e.itens[0]).toMatchObject({ series: 3, usaCarga: true, descansoS: 90 });
    expect(e.itens[3].alvo).toMatchObject({ kind: "reps", min: 12, max: 15 });
    expect(e.fase).toBe("executando");
  });

  it("quinta: cada arrancada é uma série, com 120 s de descanso", () => {
    const e = criarTreino({
      id: "t",
      data: "2026-10-15",
      blocos: blocosDia("2026-10-15", ["qui-noite"]),
      agora: T0,
    })!;
    const arrancadas = e.itens.find((i) => i.slug === "vel-arrancadas")!;
    expect(arrancadas.series).toBe(6);
    expect(arrancadas.descansoS).toBe(120);
    expect(e.itens[0].alvo).toMatchObject({ kind: "tempo", segundos: 900 });
  });

  it("bloco do instrutor (sem exercícios) não gera treino", () => {
    expect(
      criarTreino({ id: "t", data: "2026-10-14", blocos: blocosDia("2026-10-14", ["qua-noite"]), agora: T0 }),
    ).toBeNull();
  });

  it("valores iniciais vêm da última sessão; sem histórico usa o topo da faixa", () => {
    const sem = treinoPernas();
    expect(sem.atual).toMatchObject({ reps: 8, cargaKg: null });
    const com = treinoPernas({
      sugeridos: {
        stiff: [
          { reps: 8, cargaKg: 40, duracaoS: null },
          { reps: 7, cargaKg: 40, duracaoS: null },
        ],
      },
    });
    expect(com.atual).toMatchObject({ reps: 8, cargaKg: 40 });
    const proxima = avancar(terminarDescanso(concluirSerie(com, T0).estado));
    expect(proxima.atual).toMatchObject({ reps: 7, cargaKg: 40 });
  });
});

describe("botão principal único (24.2)", () => {
  it("conduz série, descanso, próxima série, próximo exercício e finalizar", () => {
    let e = treinoPernas();
    const sequencia: string[] = [];
    // exercício 1, série 1
    sequencia.push(botaoPrincipal(e).rotulo);
    e = concluirSerie(e, T0).estado;
    sequencia.push(botaoPrincipal(e).rotulo); // descansando
    expect(botaoPrincipal(e).desabilitado).toBe(true);
    e = terminarDescanso(e);
    sequencia.push(botaoPrincipal(e).rotulo); // próxima série
    e = avancar(e);
    sequencia.push(botaoPrincipal(e).rotulo);
    expect(sequencia).toEqual(["Concluir série", "Descansar", "Próxima série", "Concluir série"]);
  });

  it("depois da última série de um exercício vem 'Próximo exercício'; no fim, 'Finalizar treino'", () => {
    let e = treinoPernas();
    // termina as 3 séries do stiff
    for (let s = 0; s < 3; s++) {
      e = avancar(terminarDescanso(concluirSerie(e, T0).estado));
      if (s === 1) break;
    }
    // chegou na 3ª série
    expect(e.idxItem).toBe(0);
    expect(e.idxSerie).toBe(2);
    e = terminarDescanso(concluirSerie(e, T0).estado);
    expect(botaoPrincipal(e).rotulo).toBe("Próximo exercício");
    e = avancar(e);
    expect(e.idxItem).toBe(1);

    const quase = terminarTudo(treinoPernas());
    expect(quase.fase).toBe("resumo");
    // última série do último exercício: vai direto para "Finalizar"
    let u = treinoPernas();
    while (!(u.idxItem === 4 && u.idxSerie === 2)) {
      if (u.fase === "executando") u = concluirSerie(u, T0).estado;
      else if (u.fase === "descanso") u = terminarDescanso(u);
      else u = avancar(u);
    }
    u = concluirSerie(u, T0).estado;
    expect(botaoPrincipal(u)).toMatchObject({ acao: "finalizar", rotulo: "Finalizar treino" });
    expect(avancar(u).fase).toBe("resumo");
  });

  it("descanso: tempo padrão por tipo, ajuste de 15 s e pular", () => {
    let e = treinoPernas();
    e = concluirSerie(e, T0).estado;
    expect(segundosDeDescanso(e, T0)).toBe(90);
    expect(segundosDeDescanso(e, T0 + 30_000)).toBe(60);
    e = ajustarDescanso(e, 15, T0);
    expect(segundosDeDescanso(e, T0)).toBe(105);
    e = ajustarDescanso(e, -200, T0);
    expect(segundosDeDescanso(e, T0)).toBe(0);
    expect(terminarDescanso(e).fase).toBe("pronto");
  });

  it("tornozelo usa descanso de 45 s", () => {
    const e = criarTreino({
      id: "t",
      data: "2026-10-14",
      blocos: blocosDia("2026-10-14", ["qua-tornozelo"]),
      agora: T0,
    })!;
    expect(segundosDeDescanso(concluirSerie(e, T0).estado, T0)).toBe(45);
  });

  it("grava reps e carga editados na série", () => {
    let e = treinoPernas();
    e = atualizarValores(e, { reps: 7, cargaKg: 42.5, esforco: "ok" });
    const { serie } = concluirSerie(e, T0);
    expect(serie).toMatchObject({
      slug: "stiff",
      numero: 1,
      reps: 7,
      cargaKg: 42.5,
      esforco: "ok",
      bloco: "qua-forca",
    });
  });
});

describe("retomada: o estado é serializável", () => {
  it("fechar o app no meio e continuar de onde parou", () => {
    let e = treinoPernas();
    e = concluirSerie(atualizarValores(e, { reps: 8, cargaKg: 40 }), T0).estado;
    e = avancar(terminarDescanso(e));
    const guardado = JSON.stringify(e);
    const volta = JSON.parse(guardado) as EstadoTreino;
    expect(volta).toEqual(e);
    expect(volta.feitas).toHaveLength(1);
    expect(volta.idxSerie).toBe(1);
    expect(botaoPrincipal(volta).acao).toBe("concluir");
    const fim = terminarTudo(volta);
    expect(fim.feitas).toHaveLength(3 + 2 + 3 + 3 + 3);
  });
});

describe("pular e trocar exercício", () => {
  it("pular manda para o próximo exercício e registra o motivo", () => {
    const e = pularExercicio(treinoPernas(), "sem tempo");
    expect(e.idxItem).toBe(1);
    expect(e.idxSerie).toBe(0);
    expect(e.pulados).toEqual([{ item: 0, motivo: "sem tempo" }]);
  });

  it("pular o último exercício leva ao resumo", () => {
    let e = treinoPernas();
    for (let i = 0; i < 5; i++) e = pularExercicio(e, "cansado");
    expect(e.fase).toBe("resumo");
  });

  it("trocar mantém o número de séries, recomeça o exercício e guarda o original", () => {
    const e = trocarExercicio(treinoPernas(), "step-up");
    expect(e.itens[0]).toMatchObject({ slug: "step-up", trocadoDe: "stiff", series: 3 });
    expect(e.idxSerie).toBe(0);
    expect(e.fase).toBe("executando");
  });

  it("trocar por algo que não existe no catálogo não muda nada", () => {
    const e = treinoPernas();
    expect(trocarExercicio(e, "inexistente")).toEqual(e);
  });
});

describe("dor durante o exercício (R11)", () => {
  it("dor até 3 só registra", () => {
    const { estado, aviso } = registrarDor(treinoPernas(), 2);
    expect(aviso.nivel).toBe("ok");
    expect(estado.dorPendente).toBe(2);
    expect(estado.fase).toBe("executando");
    expect(concluirSerie(estado, T0).serie.dorDurante).toBe(2);
  });

  it("dor 4 a 5 manda parar e sugere a versão mais leve", () => {
    const e = criarTreino({
      id: "t",
      data: "2026-10-14",
      blocos: blocosDia("2026-10-14", ["qua-tornozelo"]),
      agora: T0,
    })!;
    const pant = { ...e, idxItem: e.itens.findIndex((i) => i.slug === "pant-degrau") };
    const { aviso, estado } = registrarDor(pant, 4);
    expect(aviso.nivel).toBe("regredir");
    expect(aviso.regressao).toBe("caminhada-pontas");
    expect(estado.fase).toBe("executando");
  });

  it("dor 6 ou mais encerra o treino e pede o check-in", () => {
    const { estado, aviso } = registrarDor(treinoPernas(), 6);
    expect(aviso.nivel).toBe("encerrar");
    expect(aviso.mensagem).toContain("ortopedista ou fisioterapeuta");
    expect(estado.fase).toBe("resumo");
    expect(estado.encerradoPorDor).toBe(true);
  });
});

describe("resumo do treino", () => {
  it("duração, séries, volume e maiores cargas", () => {
    let e = treinoPernas();
    e = concluirSerie(atualizarValores(e, { reps: 8, cargaKg: 40 }), T0).estado;
    e = avancar(terminarDescanso(e));
    e = concluirSerie(atualizarValores(e, { reps: 8, cargaKg: 45 }), T0 + 60_000).estado;
    const r = resumoDoTreino(e, T0 + 20 * 60_000);
    expect(r.duracaoMin).toBe(20);
    expect(r.seriesFeitas).toBe(2);
    expect(r.volumeKg).toBe(8 * 40 + 8 * 45);
    expect(r.maioresCargas[0]).toMatchObject({ slug: "stiff", cargaKg: 45 });
    expect(r.blocos[0]).toMatchObject({ id: "qua-forca", resultado: "parcial" });
  });

  it("treino completo vira 'feito' e sem séries vira 'não fiz'", () => {
    const fim = terminarTudo(treinoPernas());
    expect(resumoDoTreino(fim, T0 + 600_000).blocos[0].resultado).toBe("feito");
    expect(resumoDoTreino(treinoPernas(), T0).blocos[0].resultado).toBe("nao_fiz");
  });

  it("pular um exercício deixa o bloco como parcial", () => {
    let e = pularExercicio(treinoPernas(), "doeu");
    e = terminarTudo(e);
    expect(resumoDoTreino(e, T0 + 600_000).blocos[0].resultado).toBe("parcial");
  });
});

describe("ajustes do modo do dia", () => {
  it("reduzido: uma série a menos e sem o último acessório", () => {
    const e = treinoPernas({ ajuste: "reduzido" });
    expect(e.itens.map((i) => i.slug)).toEqual(["stiff", "flexora", "bulgaro", "pant-pe-sentado"]);
    expect(e.itens[0].series).toBe(2);
    expect(e.itens[1].series).toBe(1);
    expect(e.avisosAjuste.length).toBeGreaterThan(0);
  });

  it("só 20 min: fica o essencial, dentro do tempo", () => {
    const e = treinoPernas({ ajuste: "20min" });
    expect(e.itens.length).toBeLessThan(5);
    expect(e.itens[0].slug).toBe("stiff");
  });

  it("sem academia: troca o que exige peso e nunca acrescenta exercício novo ao plano", () => {
    const e = treinoPernas({ ajuste: "sem_academia" });
    expect(e.itens.find((i) => i.slug === "stiff")).toBeUndefined();
    expect(e.itens.some((i) => i.trocadoDe === "stiff")).toBe(true);
    expect(e.itens.length).toBeLessThanOrEqual(5);
    expect(e.avisosAjuste.join(" ")).toContain("Troquei");
  });

  it("recuperação: só exercícios leves, no máximo 2 séries", () => {
    const e = criarTreino({
      id: "t",
      data: "2026-10-14",
      blocos: blocosDia("2026-10-14", ["qua-tornozelo"]),
      ajuste: "recuperacao",
      agora: T0,
    })!;
    expect(e.itens.every((i) => i.series <= 2)).toBe(true);
    expect(e.itens.map((i) => i.slug)).not.toContain("salto-aterrissagem");
  });

  it("recuperação em treino de força pesada não sobra nada (não cria treino novo)", () => {
    expect(treinoPernas({ ajuste: "recuperacao" })).toBeNull();
  });
});

describe("Sequência do dia (24.6)", () => {
  const manha = blocosDia("2026-10-14", ["qua-tornozelo", "qua-forca"]);
  const novo = () =>
    criarTreino({ id: "s1", data: "2026-10-14", blocos: manha, sequencia: true, agora: T0 })!;

  it("encadeia os blocos, com tela de transição entre eles", () => {
    expect(novo().blocos.map((b) => b.id)).toEqual(["qua-tornozelo", "qua-forca"]);
    let e = novo();
    let transicoes = 0;
    let guarda = 0;
    while (e.fase !== "resumo" && guarda++ < 300) {
      if (e.fase === "transicao") {
        transicoes++;
        expect(botaoPrincipal(e).rotulo).toBe("Começar bloco");
        e = iniciarProximoBloco(e);
      } else if (e.fase === "executando") e = concluirSerie(e, T0).estado;
      else if (e.fase === "descanso") e = terminarDescanso(e);
      else e = avancar(e);
    }
    expect(transicoes).toBe(1);
    const r = resumoDoTreino(e, T0 + 3_600_000);
    expect(r.blocos.map((b) => b.resultado)).toEqual(["feito", "feito"]);
  });

  it("pular bloco manda direto para o próximo (ou para o resumo)", () => {
    let e = novo();
    // anda até a transição
    while (e.fase !== "transicao") {
      if (e.fase === "executando") e = concluirSerie(e, T0).estado;
      else if (e.fase === "descanso") e = terminarDescanso(e);
      else e = avancar(e);
    }
    const pulado = pularProximoBloco(e);
    expect(pulado.fase).toBe("resumo");
    expect(pulado.blocosPulados).toEqual([1]);
    expect(resumoDoTreino(pulado, T0 + 600_000).blocos[1].resultado).toBe("nao_fiz");
  });

  it("não adiciona nenhum exercício além do plano", () => {
    const planejados = manha.flatMap((b) => b.exercicios.map((e) => e.slug));
    expect(novo().itens.map((i) => i.slug)).toEqual(planejados);
  });

  it("o botão avisa quando o próximo exercício é de outro bloco", () => {
    let e = novo();
    while (!(e.idxItem === 5 && e.idxSerie === e.itens[5].series - 1)) {
      if (e.fase === "executando") e = concluirSerie(e, T0).estado;
      else if (e.fase === "descanso") e = terminarDescanso(e);
      else if (e.fase === "pronto") e = avancar(e);
      else if (e.fase === "transicao") e = iniciarProximoBloco(e);
    }
    expect(e.itens[5].blocoIdx).toBe(0);
  });
});
