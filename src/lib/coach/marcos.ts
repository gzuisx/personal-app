// Marcos da Jornada do tornozelo detectados sozinhos (seção 9.3). A detecção só PROPÕE: o Gabriel confirma.
import { nivelDoCheckin, type ConfigSeguranca } from "../safety";
import { blocoTornozeloTag, diaDoPlano } from "../seed/plano";
import { addDias, dataISO } from "../tempo";
import type { Checkin, Jogo, Marco, Sessao } from "../tipos";
import type { TesteCampoResumo } from "./tipos";

export type EntradaMarcos = {
  hoje: string;
  checkins: Checkin[];
  sessoes: Sessao[];
  jogos: Jogo[];
  testes: TesteCampoResumo[];
  marcos: Marco[];
  config: ConfigSeguranca;
};

/** Chave de detecção automática -> chave do marco. */
export const MARCO_DA_DETECCAO: Record<string, string> = {
  dias_30: "30-dias-sem-dor",
  jogo_completo: "jogo-completo-sem-dor",
  rotina_10: "rotina-10-dias",
  teste_equilibrio: "equilibrio-sem-falha",
  simetria_salto: "simetria-90",
};

/** 30 dias seguidos com check-in, dor até 3, sem inchaço e sem falha (conta até hoje ou ontem). */
export function diasSeguidosSemDor(checkins: Checkin[], hoje: string, config: ConfigSeguranca) {
  const porData = new Map(checkins.map((c) => [c.data, c]));
  let dias = 0;
  const inicio = porData.has(hoje) ? hoje : addDias(hoje, -1);
  for (let i = 0; i < 400; i++) {
    const c = porData.get(addDias(inicio, -i));
    if (!c || c.dor > 3 || nivelDoCheckin(c, config) === "bloqueio" || c.inchaco || c.falhou) break;
    dias++;
  }
  return dias;
}

/** Dias seguidos (entre os dias em que o plano manda fazer tornozelo) com a rotina registrada como feita. */
export function diasSeguidosDeRotina(sessoes: Sessao[], hoje: string, fase: 1 | 2 | 3 | 4 = 1) {
  let dias = 0;
  for (let i = 0; i < 90; i++) {
    const iso = addDias(hoje, -i);
    const blocos = diaDoPlano(iso, { fase }).blocos.filter(blocoTornozeloTag);
    if (!blocos.length) continue;
    const feito = blocos.every((b) =>
      sessoes.some((s) => s.data === iso && s.bloco === b.id && s.resultado === "feito"),
    );
    if (!feito) {
      if (i === 0) continue; // hoje ainda pode ser feito
      break;
    }
    dias++;
  }
  return dias;
}

/** Simetria entre os pés (menor / maior) do teste mais recente de cada pé, em porcentagem. */
export function simetriaDosPes(
  testes: TesteCampoResumo[],
  tipo: TesteCampoResumo["tipo"],
  subtipo?: string | null,
) {
  const ultimo = (pe: "direito" | "esquerdo") =>
    testes
      .filter(
        (t) => t.tipo === tipo && t.pe === pe && (subtipo === undefined || (t.subtipo ?? null) === subtipo),
      )
      .sort((a, b) => b.data.localeCompare(a.data))[0];
  const d = ultimo("direito");
  const e = ultimo("esquerdo");
  if (!d || !e || d.valor <= 0 || e.valor <= 0) return null;
  return (Math.min(d.valor, e.valor) / Math.max(d.valor, e.valor)) * 100;
}

/** Marcos cujo critério já foi atingido e que ainda não foram concluídos. */
export function detectarMarcos(e: EntradaMarcos): string[] {
  const concluidos = new Set(e.marcos.filter((m) => m.concluidoEm).map((m) => m.chave));
  const achados: string[] = [];
  const adiciona = (deteccao: string, ok: boolean) => {
    const chave = MARCO_DA_DETECCAO[deteccao];
    if (ok && !concluidos.has(chave)) achados.push(chave);
  };

  adiciona("dias_30", diasSeguidosSemDor(e.checkins, e.hoje, e.config) >= 30);
  adiciona(
    "jogo_completo",
    e.jogos.some(
      (j) => j.status !== "cancelado" && (j.minutosJogados ?? 0) >= 70 && j.dor !== null && j.dor <= 1,
    ),
  );
  adiciona("rotina_10", diasSeguidosDeRotina(e.sessoes, e.hoje) >= 10);

  const equilibrio = e.testes.filter((t) => t.tipo === "T3" && t.subtipo === "olhos_fechados");
  const ultimoDoPe = (pe: "direito" | "esquerdo") =>
    equilibrio.filter((t) => t.pe === pe).sort((a, b) => b.data.localeCompare(a.data))[0];
  const ed = ultimoDoPe("direito");
  const ee = ultimoDoPe("esquerdo");
  adiciona("teste_equilibrio", !!ed && !!ee && (ed.falhas ?? 1) === 0 && (ee.falhas ?? 1) === 0);

  const sim = simetriaDosPes(e.testes, "T5");
  adiciona("simetria_salto", sim !== null && sim >= 90);

  return achados;
}

export const dataDoJogo = (j: Jogo) => dataISO(new Date(j.inicio));
