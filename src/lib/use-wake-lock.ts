"use client";

import { useEffect } from "react";

type WakeLockSentinelLike = { release: () => Promise<void> };

/**
 * Mantém a tela acesa enquanto `ativo` (Screen Wake Lock API). Onde não houver suporte,
 * ou se o navegador recusar, falha em silêncio. Pede de novo quando o app volta ao primeiro plano.
 */
export function useWakeLock(ativo: boolean) {
  useEffect(() => {
    if (!ativo || typeof navigator === "undefined") return;
    const wl = (
      navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinelLike> } }
    ).wakeLock;
    if (!wl) return;

    let sentinela: WakeLockSentinelLike | null = null;
    let cancelado = false;

    const pedir = async () => {
      try {
        sentinela = await wl.request("screen");
        if (cancelado) await sentinela.release();
      } catch {
        // recusado (bateria baixa, aba em segundo plano): segue sem manter a tela acesa
      }
    };

    const aoVoltar = () => {
      if (document.visibilityState === "visible") void pedir();
    };

    void pedir();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", aoVoltar);
      void sentinela?.release().catch(() => {});
    };
  }, [ativo]);
}
