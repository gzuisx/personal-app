// Sem as variáveis do Supabase o app roda em "modo local" (dados no aparelho, sem login).
export const temSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
