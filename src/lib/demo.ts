// Modo demonstração (C4): 30 dias de dados FICTÍCIOS, só para ver gráficos, coach e insights.
// Vive em uma chave separada do localStorage e nunca é enviado ao Supabase.
import { diaDoPlano, blocoTreinavel } from "./seed/plano";
import { addDias, dataISO, diaSemanaISO, instanteSP, JOGOS_SEMANAIS } from "./tempo";
import {
  DADOS_VAZIOS,
  type Checkin,
  type DadosApp,
  type Gatilho,
  type Jogo,
  type PreJogoLog,
  type Resultado,
  type Sessao,
  type SonoFaixa,
} from "./tipos";

export const CHAVE_MODO_DEMO = "meu-personal:modo-demo";

/** Gerador pseudoaleatório determinístico (mulberry32): os mesmos dados a cada vez. */
function criarRng(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const escolher = <T>(rng: () => number, lista: T[]) => lista[Math.floor(rng() * lista.length)];
const entre = (rng: () => number, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

export function gerarDadosDemo(hoje: string, dias = 30): DadosApp {
  const rng = criarRng(20261013);
  const checkins: Checkin[] = [];
  const sessoes: Sessao[] = [];
  const jogos: Jogo[] = [];
  const preJogos: PreJogoLog[] = [];

  for (let i = dias; i >= 1; i--) {
    const iso = addDias(hoje, -i);

    // Dor: boa na maior parte; um episódio com bloqueio há ~20 dias, depois recuperação.
    let dor = entre(rng, 0, 3);
    let inchaco = false;
    if (i === 20) {
      dor = 6;
      inchaco = true;
    } else if (i === 19) dor = 4;
    else if (i === 18) dor = 3;
    else if (rng() < 0.12) dor = 4;

    const sono = escolher<SonoFaixa>(rng, ["menos_5", "5_6", "7_8", "7_8", "7_8", "mais_8"]);
    const gatilhos: Gatilho[] = ["chute", "giro", "terreno", "nenhum"];
    checkins.push({
      data: iso,
      dor,
      inchaco,
      falhou: false,
      energia: entre(rng, 2, 5),
      sonoFaixa: sono,
      gatilho: dor >= 1 ? escolher(rng, gatilhos) : null,
      observacao: null,
      regioes: dor >= 1 ? ["lateral"] : [],
      movimentos: dor >= 1 ? [escolher(rng, ["virar_dentro", "chutar", "saltar", "correr"] as const)] : [],
      duracaoDor: dor >= 1 ? escolher(rng, ["menos_1min", "5_10min"] as const) : null,
      posteriorApertou: rng() < 0.08,
      jogoId: null,
    });

    // Sessões do plano
    for (const b of diaDoPlano(iso).blocos.filter(blocoTreinavel)) {
      const sorteio = rng();
      const resultado: Resultado = sorteio < 0.78 ? "feito" : sorteio < 0.9 ? "parcial" : "nao_fiz";
      sessoes.push({
        data: iso,
        bloco: b.id,
        resultado,
        esforco: resultado === "nao_fiz" ? null : entre(rng, b.tags.includes("Funcional") ? 5 : 3, 8),
        duracaoMin: resultado === "nao_fiz" ? null : b.duracaoMin,
        notas: null,
      });
    }

    // Jogos (terça e sábado)
    const slot = JOGOS_SEMANAIS.find((j) => j.diaSemana === diaSemanaISO(iso));
    if (slot) {
      const inicio = instanteSP(iso, slot.hora, slot.min).toISOString();
      const id = `demo-${iso}`;
      const doloroso = i === 21;
      jogos.push({
        id,
        inicio,
        minutosJogados: entre(rng, 55, 80),
        esforco: entre(rng, 6, 9),
        dor: doloroso ? 5 : entre(rng, 1, 4),
        gatilho: escolher<Gatilho>(rng, ["chute", "giro", "terreno", "nenhum"]),
        notas: null,
        status: "jogado",
      });
      preJogos.push({
        jogoData: iso,
        concluido: rng() < 0.7,
        fasesConcluidas: 5,
        duracaoS: entre(rng, 520, 640),
        tornozeleira: rng() < 0.6,
      });
    }
  }

  // check-in do dia seguinte vinculado ao jogo
  for (const j of jogos) {
    const dataJogo = dataISO(new Date(j.inicio));
    const seguinte = checkins.find((c) => c.data === addDias(dataJogo, 1));
    if (seguinte) seguinte.jogoId = j.id ?? null;
  }

  return { ...structuredClone(DADOS_VAZIOS), checkins, sessoes, jogos, preJogos };
}
