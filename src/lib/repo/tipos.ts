import type { ConfigSeguranca } from "@/lib/safety";
import type { Checkin, DadosApp, Jogo, Marco, Perfil, Sessao } from "@/lib/tipos";

/** Camada de dados. As telas nunca chamam o Supabase direto: sempre passam por aqui. */
export interface Repo {
  modo: "supabase" | "local";
  /** carrega tudo; check-ins, sessões e jogos a partir de `desdeISO` (AAAA-MM-DD) */
  carregar(desdeISO: string): Promise<DadosApp>;
  salvarCheckin(c: Checkin): Promise<void>;
  salvarSessao(s: Sessao): Promise<void>;
  salvarJogo(j: Jogo): Promise<void>;
  salvarSeguranca(c: ConfigSeguranca): Promise<void>;
  salvarPerfil(p: Perfil): Promise<void>;
  salvarMarco(m: Marco): Promise<void>;
  exportar(): Promise<unknown>;
}
