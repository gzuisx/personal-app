"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Etapa = "email" | "codigo";

const campo =
  "h-14 w-full rounded-2xl border border-white/15 bg-white/5 px-4 text-lg outline-none focus:border-green-400";
const botao =
  "h-14 w-full rounded-2xl bg-green-500 text-lg font-semibold text-black active:scale-[0.98] disabled:opacity-50";

export function FormularioLogin() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviarLink(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setCarregando(false);
    if (error) {
      setErro("Não deu para enviar o e-mail. Confira o endereço e tente de novo.");
      return;
    }
    setEtapa("codigo");
  }

  async function entrarComCodigo(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: codigo.trim(),
      type: "email",
    });
    if (error) {
      setCarregando(false);
      setErro("Código errado ou vencido. Confira e tente de novo.");
      return;
    }
    router.replace("/hoje");
    router.refresh();
  }

  if (etapa === "email") {
    return (
      <form onSubmit={enviarLink} className="space-y-4">
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={campo}
        />
        {erro && <p className="text-red-300">{erro}</p>}
        <button type="submit" disabled={carregando} className={botao}>
          {carregando ? "Enviando..." : "Enviar link de acesso"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={entrarComCodigo} className="space-y-4">
      <p className="text-white/80">
        Enviamos um e-mail para <strong>{email}</strong>. Toque no link ou digite o código
        aqui.
      </p>
      <input
        type="text"
        required
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="Código do e-mail"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        className={`${campo} text-center tracking-widest`}
      />
      {erro && <p className="text-red-300">{erro}</p>}
      <button type="submit" disabled={carregando} className={botao}>
        {carregando ? "Entrando..." : "Entrar com o código"}
      </button>
      <button
        type="button"
        onClick={() => {
          setEtapa("email");
          setCodigo("");
          setErro(null);
        }}
        className="h-12 w-full text-white/70"
      >
        Usar outro e-mail
      </button>
    </form>
  );
}
