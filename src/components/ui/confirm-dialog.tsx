"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";

type Props = {
  aberto: boolean;
  titulo: string;
  texto: string;
  confirmarRotulo?: string;
  cancelarRotulo?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export function ConfirmDialog({
  aberto,
  titulo,
  texto,
  confirmarRotulo = "Confirmar",
  cancelarRotulo = "Cancelar",
  onConfirmar,
  onCancelar,
}: Props) {
  const [montado, setMontado] = useState(false);
  const id = useId();
  useEffect(() => setMontado(true), []);
  if (!montado) return null;

  return createPortal(
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-5">
          <motion.div
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancelar}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={id}
            className="relative w-full max-w-[400px] space-y-4 rounded-cartao border border-borda bg-solido p-5 shadow-cartao"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <h2 id={id} className="t-h2">
              {titulo}
            </h2>
            <p className="t-corpo text-texto2">{texto}</p>
            <div className="flex gap-3">
              <Button variante="secundario" className="flex-1" onClick={onCancelar}>
                {cancelarRotulo}
              </Button>
              <Button className="flex-1" onClick={onConfirmar}>
                {confirmarRotulo}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
