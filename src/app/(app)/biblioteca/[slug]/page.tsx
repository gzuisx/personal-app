"use client";

import { Suspense } from "react";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { DetalheExercicio } from "@/components/biblioteca/detalhe-exercicio";
import { Header } from "@/components/ui/header";
import { ROTULO_TIPO, itemDaBiblioteca } from "@/lib/biblioteca";
import { voltarSeguro } from "@/lib/rotas";

function Detalhe() {
  const { slug } = useParams<{ slug: string }>();
  const params = useSearchParams();
  const item = itemDaBiblioteca(slug);
  if (!item) notFound();
  return (
    <main className="pagina space-y-4">
      <Header
        titulo={item.nome}
        sobretitulo={`${ROTULO_TIPO[item.tipo]} · ${item.grupo}`}
        voltarPara={voltarSeguro(params.get("de"), "/biblioteca")}
      />
      <DetalheExercicio item={item} />
    </main>
  );
}

export default function DetalhePage() {
  return (
    <Suspense fallback={null}>
      <Detalhe />
    </Suspense>
  );
}
