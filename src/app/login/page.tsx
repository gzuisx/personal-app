import { redirect } from "next/navigation";
import { Banner } from "@/components/ui/banner";
import { Logo } from "@/components/ui/logo";
import { temSupabase } from "@/lib/supabase/config";
import { FormularioLogin } from "./formulario";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!temSupabase) redirect("/hoje");
  const { erro } = await searchParams;

  return (
    <main className="pagina-fluxo flex min-h-dvh flex-col justify-center gap-8">
      <header className="space-y-3">
        <Logo tamanho={56} />
        <p className="t-corpo text-texto2">Seu treino. Seu tornozelo. Seu ritmo.</p>
      </header>
      {erro === "link" && (
        <Banner variante="alerta">Link inválido ou vencido. Peça outro, ou use o código do e-mail.</Banner>
      )}
      <FormularioLogin />
    </main>
  );
}
