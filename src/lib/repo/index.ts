import { temSupabase } from "@/lib/supabase/config";
import { criarLocalRepo } from "./local";
import { criarSupabaseRepo } from "./supabase";
import type { Repo } from "./tipos";

export type { Repo } from "./tipos";

export function criarRepo(): Repo {
  return temSupabase ? criarSupabaseRepo() : criarLocalRepo();
}
