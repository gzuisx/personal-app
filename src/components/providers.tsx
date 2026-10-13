"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";
import { ToastProvider } from "@/components/ui/toast";

export type Tema = "escuro" | "claro" | "auto";

type Preferencias = {
  tema: Tema;
  reduzirAnimacoes: boolean;
  /** true se o usuário pediu menos movimento (opção do app ou do sistema) */
  semMovimento: boolean;
  setTema: (t: Tema) => void;
  setReduzirAnimacoes: (v: boolean) => void;
};

const Ctx = createContext<Preferencias | null>(null);

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // armazenamento indisponível (modo privado): segue sem salvar
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [tema, setTemaEstado] = useState<Tema>("escuro");
  const [reduzir, setReduzirEstado] = useState(false);
  const sistemaReduz = useReducedMotion();

  useEffect(() => {
    const t = ler("tema");
    if (t === "escuro" || t === "claro" || t === "auto") setTemaEstado(t);
    setReduzirEstado(ler("reduzir") === "1");
  }, []);

  const setTema = useCallback((t: Tema) => {
    setTemaEstado(t);
    gravar("tema", t);
    document.documentElement.dataset.theme = t;
  }, []);

  const setReduzirAnimacoes = useCallback((v: boolean) => {
    setReduzirEstado(v);
    gravar("reduzir", v ? "1" : "0");
    if (v) document.documentElement.dataset.reduzir = "1";
    else delete document.documentElement.dataset.reduzir;
  }, []);

  const semMovimento = reduzir || !!sistemaReduz;

  const valor = useMemo(
    () => ({ tema, reduzirAnimacoes: reduzir, semMovimento, setTema, setReduzirAnimacoes }),
    [tema, reduzir, semMovimento, setTema, setReduzirAnimacoes],
  );

  return (
    <Ctx.Provider value={valor}>
      <MotionConfig reducedMotion={reduzir ? "always" : "user"}>
        <ToastProvider>{children}</ToastProvider>
      </MotionConfig>
    </Ctx.Provider>
  );
}

export function usePreferencias() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePreferencias fora de <Providers>");
  return v;
}
