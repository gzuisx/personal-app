import { createClient } from "@/lib/supabase/server";

export default async function HojePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-10">
      <header className="space-y-1">
        <p className="text-sm capitalize text-white/60">{data}</p>
        <h1 className="text-4xl font-bold">Hoje</h1>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 p-8 text-center">
        <p className="text-lg text-white/70">Nada por aqui ainda.</p>
        <p className="mt-2 text-white/50">O treino do dia vai aparecer nesta tela.</p>
      </section>

      <footer className="space-y-3 text-center text-sm text-white/40">
        <p>{user?.email}</p>
        <form action="/auth/sair" method="post">
          <button
            type="submit"
            className="h-12 w-full rounded-2xl border border-white/15 text-base text-white/70 active:scale-[0.98]"
          >
            Sair
          </button>
        </form>
      </footer>
    </main>
  );
}
