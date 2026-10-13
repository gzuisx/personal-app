"use client";

import { motion } from "motion/react";
import { movimento } from "@/lib/design/tokens";

// O template remonta a cada navegação: dá o fade + deslocamento de 12 px entre telas.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: movimento.easing }}
    >
      {children}
    </motion.div>
  );
}
