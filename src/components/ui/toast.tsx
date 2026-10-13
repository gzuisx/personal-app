"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Check, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type Tipo = "sucesso" | "aviso" | "erro";
type Item = { id: number; texto: string; tipo: Tipo };

const Ctx = createContext<{ mostrar: (texto: string, tipo?: Tipo) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [itens, setItens] = useState<Item[]>([]);
  const [montado, setMontado] = useState(false);
  const proximo = useRef(1);

  useEffect(() => setMontado(true), []);

  const mostrar = useCallback((texto: string, tipo: Tipo = "sucesso") => {
    const id = proximo.current++;
    setItens((atual) => [...atual, { id, texto, tipo }]);
    setTimeout(() => setItens((atual) => atual.filter((i) => i.id !== id)), 3000);
  }, []);

  return (
    <Ctx.Provider value={{ mostrar }}>
      {children}
      {montado &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4"
            style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
            role="status"
            aria-live="polite"
          >
            <AnimatePresence>
              {itens.map((i) => (
                <motion.div
                  key={i.id}
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "flex max-w-[420px] items-center gap-2 rounded-full border px-4 py-3 text-[0.9375rem] font-medium shadow-cartao",
                    i.tipo === "sucesso" && "border-ok bg-ok text-sobre",
                    i.tipo === "aviso" && "border-aviso bg-aviso text-sobre",
                    i.tipo === "erro" && "border-perigo bg-perigo text-sobre",
                  )}
                >
                  {i.tipo === "sucesso" ? (
                    <Check className="size-5 shrink-0" aria-hidden="true" />
                  ) : i.tipo === "aviso" ? (
                    <Info className="size-5 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
                  )}
                  {i.texto}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast fora de <ToastProvider>");
  return v;
}
