import type { ConfigSeguranca } from "@/lib/safety";
import type {
  Checkin,
  DadosApp,
  Execucao,
  FaseTornozelo,
  Jogo,
  Marco,
  Perfil,
  PreJogoLog,
  Sessao,
  SerieLog,
} from "@/lib/tipos";

/** Camada de dados. As telas nunca chamam o Supabase direto: sempre passam por aqui. */
export interface Repo {
  modo: "supabase" | "local";
  /** carrega tudo; check-ins, sessões e jogos a partir de `desdeISO` (AAAA-MM-DD) */
  carregar(desdeISO: string): Promise<DadosApp>;
  salvarCheckin(c: Checkin): Promise<void>;
  salvarSessao(s: Sessao): Promise<void>;
  salvarJogo(j: Jogo): Promise<void>;
  salvarPreJogo(p: PreJogoLog): Promise<void>;
  /** uma série do treino guiado, gravada assim que é concluída */
  salvarSerie(s: SerieLog): Promise<void>;
  /** treino em andamento (no máximo um) e sua limpeza ao finalizar ou descartar */
  salvarExecucao(e: Execucao): Promise<void>;
  limparExecucao(): Promise<void>;
  salvarSeguranca(c: ConfigSeguranca): Promise<void>;
  /** perfil e restrições */
  salvarPerfil(p: Perfil): Promise<void>;
  salvarMarco(m: Marco): Promise<void>;
  /** só deve ser chamada ao aceitar uma proposta de fase (C5) */
  salvarFase(f: FaseTornozelo): Promise<void>;
  exportar(): Promise<unknown>;
}
