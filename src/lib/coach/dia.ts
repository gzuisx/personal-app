// Dia do plano já com a fase guardada, o modelo de plano ativo e as exceções de agenda aplicadas (um só lugar para as telas).
import { focoDoPlano } from "../foco";
import { diaDoPlano } from "../seed/plano";
import { aplicarTemplate } from "../seed/templates";
import type { DadosApp, PlanoVersao } from "../tipos";
import { aplicarExcecoesAoDia, type DiaComExcecoes } from "./agenda";

/** Versão ativa do plano (modelo P2, P3, P4...) que vale no dia, se houver. */
export function versaoDoDia(iso: string, versoes: PlanoVersao[]): PlanoVersao | null {
  const validas = versoes.filter(
    (v) => v.ativo && v.chaveTemplate && v.inicio <= iso && (!v.fim || iso < v.fim),
  );
  return validas.sort((a, b) => b.inicio.localeCompare(a.inicio))[0] ?? null;
}

export function diaPlanejado(
  iso: string,
  dados: Pick<DadosApp, "faseTornozelo" | "excecoes"> & Partial<Pick<DadosApp, "versoes" | "foco">>,
): DiaComExcecoes {
  const base = diaDoPlano(iso, {
    fase: dados.faseTornozelo.fase,
    foco: dados.foco ? focoDoPlano(dados.foco) : null,
  });
  const versao = versaoDoDia(iso, dados.versoes ?? []);
  const comModelo = versao ? aplicarTemplate(versao.chaveTemplate, base) : base;
  const r = aplicarExcecoesAoDia(comModelo, dados.excecoes);
  return versao
    ? {
        ...r,
        avisos: [
          `Plano ${versao.chaveTemplate} ativo${versao.fim ? ` até ${versao.fim.slice(8)}/${versao.fim.slice(5, 7)}` : ""}.`,
          ...r.avisos,
        ],
      }
    : r;
}
