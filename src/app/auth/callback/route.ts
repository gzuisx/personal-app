import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Link mágico no formato PKCE (?code=...). Só funciona no mesmo navegador
// em que o pedido foi feito.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/hoje`);
  }

  return NextResponse.redirect(`${origin}/login?erro=link`);
}
