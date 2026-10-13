import { FormularioLogin } from "./formulario";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">Treino</h1>
        <p className="text-lg text-white/70">Entre com o seu e-mail. Sem senha.</p>
      </header>
      {erro === "link" && (
        <p className="rounded-2xl bg-red-500/15 p-4 text-red-200">
          Link inválido ou vencido. Peça outro, ou use o código do e-mail.
        </p>
      )}
      <FormularioLogin />
    </main>
  );
}
