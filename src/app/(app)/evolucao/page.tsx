"use client";

import { Header } from "@/components/ui/header";
import { EmptyState } from "@/components/ui/empty-state";

export default function EvolucaoPage() {
  return (
    <main className="pagina">
      <Header titulo="Evolução" />
      <EmptyState
        titulo="Ainda sem dados"
        texto="Faça check-ins e registre treinos para ver sua evolução aqui."
      />
    </main>
  );
}
