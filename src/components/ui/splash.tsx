"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LogoMarca } from "@/components/ui/logo";

/** Splash de 1,2 s, mostrada uma vez por sessão do navegador/app. */
export function SplashGate() {
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    // ?splash=0 pula a abertura (útil para prints e testes)
    let jaMostrou = new URLSearchParams(window.location.search).get("splash") === "0";
    try {
      jaMostrou = sessionStorage.getItem("splash") === "1";
      sessionStorage.setItem("splash", "1");
    } catch {
      // sem sessionStorage: mostra sempre
    }
    if (jaMostrou) {
      setVisivel(false);
      return;
    }
    const id = setTimeout(() => setVisivel(false), 1200);
    return () => clearTimeout(id);
  }, []);

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5"
          style={{
            background: "linear-gradient(180deg, #030B1F 0%, #061A4A 45%, #0A3A9C 100%)",
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-label="Carregando Meu Personal"
        >
          <motion.div
            aria-hidden="true"
            className="absolute size-72 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(77,184,255,0.45), transparent 70%)" }}
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center gap-4 text-white"
          >
            <LogoMarca tamanho={96} />
            <span className="text-[1.625rem] leading-8 font-semibold">Meu Personal</span>
            <span className="t-corpo text-[#B8C7E6]">Seu treino. Seu tornozelo. Seu ritmo.</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
