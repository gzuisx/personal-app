"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Etapa = "email" | "codigo";

const campo =
  "h-14 w-full rounded-[16px] border border-borda bg-vidro-forte px-4 text-[17px] text-texto outline-none placeholder:text-texto3 focus:border-realce";

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
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setCarregando(false);
    if (error) {
      setErro(
        error.status === 429
          ? "Muitos pedidos. Aguarde alguns minutos e tente de novo."
          : "Não foi possível enviar o e-mail. Confira o endereço ou tente de novo em alguns minutos.",
      );
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
      email: email.trim(),
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
        <label className="block space-y-2">
          <span className="t-rotulo text-texto2">Seu e-mail</span>
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
        </label>
        {erro && (
          <p role="alert" className="t-corpo text-perigo-t">
            {erro}
          </p>
        )}
        <Button type="submit" tamanho="g" carregando={carregando} className="w-full">
          {carregando ? "Enviando..." : "Enviar link de acesso"}
        </Button>
        <p className="t-pq text-texto2">
          Você receberá um e-mail com o link. No iPhone, se o link não abrir o app, digite o código
          do e-mail.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={entrarComCodigo} className="space-y-4">
      <p className="t-corpo text-texto2">
        Enviamos um e-mail para <strong className="text-texto">{email}</strong>. Toque no link ou
        digite o código aqui.
      </p>
      <input
        type="text"
        required
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="Código do e-mail"
        aria-label="Código do e-mail"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        className={`${campo} text-center tracking-[0.3em]`}
      />
      {erro && (
        <p role="alert" className="t-corpo text-perigo-t">
          {erro}
        </p>
      )}
      <Button type="submit" tamanho="g" carregando={carregando} className="w-full">
        {carregando ? "Entrando..." : "Entrar"}
      </Button>
      <Button
        variante="fantasma"
        className="w-full"
        onClick={() => {
          setEtapa("email");
          setCodigo("");
          setErro(null);
        }}
      >
        Usar outro e-mail
      </Button>
    </form>
  );
}
