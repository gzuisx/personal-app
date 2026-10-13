"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { X } from "lucide-react";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  children: React.ReactNode;
  /** botão fixo no rodapé do sheet */
  rodape?: React.ReactNode;
};

export function BottomSheet({ aberto, onFechar, titulo, children, rodape }: Props) {
  const [montado, setMontado] = useState(false);
  const idTitulo = useId();
  const controles = useDragControls();

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto, onFechar]);

  if (!montado) return null;

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onFechar}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={idTitulo}
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-[480px] flex-col rounded-t-[28px] border border-b-0 border-borda bg-solido shadow-cartao"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            drag="y"
            dragControls={controles}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 600) onFechar();
            }}
          >
            <div
              className="flex cursor-grab touch-none flex-col items-center pt-3 pb-1"
              aria-hidden="true"
              onPointerDown={(e) => controles.start(e)}
            >
              <span className="h-1.5 w-12 rounded-full bg-borda" />
            </div>
            <div className="flex items-center justify-between px-5 pt-2 pb-3">
              <h2 id={idTitulo} className="t-h2">
                {titulo}
              </h2>
              <button
                type="button"
                onClick={onFechar}
                aria-label="Fechar"
                className="flex size-11 items-center justify-center rounded-full text-texto2"
              >
                <X className="size-6" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-4">
              {children}
            </div>
            {rodape && (
              <div
                className="border-t border-borda px-5 pt-3"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
              >
                {rodape}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
