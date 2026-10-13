import { temSupabase } from "@/lib/supabase/config";
import { CHAVE_DEMO, criarLocalRepo } from "./local";
import { criarSupabaseRepo } from "./supabase";
import type { Repo } from "./tipos";

export type { Repo } from "./tipos";

/** Repositório real: Supabase com login ou, sem variáveis de ambiente, o modo local. */
export function criarRepo(): Repo {
  return temSupabase ? criarSupabaseRepo() : criarLocalRepo();
}

/** Repositório da demonstração: sempre local, em chave separada, nunca toca no Supabase. */
export function criarRepoDemo(): Repo {
  return criarLocalRepo(CHAVE_DEMO);
}
