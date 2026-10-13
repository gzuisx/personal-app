"use client";

import { Header } from "@/components/ui/header";
import { EmptyState } from "@/components/ui/empty-state";

export default function SemanaPage() {
  return (
    <main className="pagina">
      <Header titulo="Semana" />
      <EmptyState titulo="Em construção" texto="O plano da semana entra na etapa 2." />
    </main>
  );
}
