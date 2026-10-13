import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Link mágico com token_hash. Funciona mesmo se o e-mail abrir em outro
// navegador (ex.: Safari em vez do app instalado).
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}/hoje`);
  }

  return NextResponse.redirect(`${origin}/login?erro=link`);
}
