"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { TelaTreino } from "@/components/treino/tela-treino";
import { SkeletonTela } from "@/components/ui/skeleton";
import { dataISO } from "@/lib/tempo";

function Treino() {
  const { bloco } = useParams<{ bloco: string }>();
  const params = useSearchParams();
  const dataParam = params.get("data");
  const data = dataParam && /^\d{4}-\d{2}-\d{2}$/.test(dataParam) ? dataParam : dataISO(new Date());
  return <TelaTreino blocoId={bloco} data={data} sequencia={params.get("sequencia") === "1"} />;
}

export default function TreinoPage() {
  return (
    <Suspense
      fallback={
        <main className="pagina-fluxo">
          <SkeletonTela />
        </main>
      }
    >
      <Treino />
    </Suspense>
  );
}
