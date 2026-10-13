import type { ConfigSeguranca } from "@/lib/safety";
import type { Checkin, DadosApp, FaseTornozelo, Jogo, Marco, Perfil, PreJogoLog, Sessao } from "@/lib/tipos";

/** Camada de dados. As telas nunca chamam o Supabase direto: sempre passam por aqui. */
export interface Repo {
  modo: "supabase" | "local";
  /** carrega tudo; check-ins, sessões e jogos a partir de `desdeISO` (AAAA-MM-DD) */
  carregar(desdeISO: string): Promise<DadosApp>;
  salvarCheckin(c: Checkin): Promise<void>;
  salvarSessao(s: Sessao): Promise<void>;
  salvarJogo(j: Jogo): Promise<void>;
  salvarPreJogo(p: PreJogoLog): Promise<void>;
  salvarSeguranca(c: ConfigSeguranca): Promise<void>;
  /** perfil e restrições */
  salvarPerfil(p: Perfil): Promise<void>;
  salvarMarco(m: Marco): Promise<void>;
  /** só deve ser chamada ao aceitar uma proposta de fase (C5) */
  salvarFase(f: FaseTornozelo): Promise<void>;
  exportar(): Promise<unknown>;
}
