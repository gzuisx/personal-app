"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Demonstracao } from "@/components/demonstracao/demonstracao";
import { ROTULO_TIPO, rotuloEquipamento, type ItemBiblioteca } from "@/lib/biblioteca";

/** Conteúdo do exercício na biblioteca: demonstração, regiões, como fazer e erros comuns. */
export function DetalheExercicio({ item, compacta = false }: { item: ItemBiblioteca; compacta?: boolean }) {
  return (
    <div className="space-y-5">
      <Demonstracao slug={item.id} nome={item.nome} compacta={compacta} />

      <section aria-labelledby={`reg-${item.id}`} className="space-y-2">
        <h2 id={`reg-${item.id}`} className="t-h3">
          Regiões trabalhadas
        </h2>
        <ul className="flex flex-wrap gap-2">
          {item.regioes.map((r) => (
            <li
              key={r}
              className="rounded-full border border-realce-t/50 bg-vidro px-3 py-1.5 text-[0.875rem] text-realce-t"
            >
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`como-${item.id}`} className="space-y-2">
        <h2 id={`como-${item.id}`} className="t-h3">
          Como fazer
        </h2>
        <ol className="space-y-2">
          {item.passos.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primario text-[0.875rem] font-semibold text-white">
                {i + 1}
              </span>
              <span className="t-corpo pt-0.5">{p}</span>
            </li>
          ))}
        </ol>
        <p className="t-pq flex items-start gap-1.5 text-aviso-t">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {item.cuidado}
        </p>
      </section>

      <section aria-labelledby={`erros-${item.id}`} className="space-y-2">
        <h2 id={`erros-${item.id}`} className="t-h3">
          Erros comuns
        </h2>
        <ul className="space-y-2">
          {item.erros.map((e) => (
            <li key={e} className="t-corpo flex items-start gap-2 text-texto2">
              <XCircle className="mt-0.5 size-5 shrink-0 text-perigo-t" aria-hidden="true" />
              {e}
            </li>
          ))}
        </ul>
      </section>

      {!compacta && (
        <section className="space-y-1 rounded-2xl border border-borda bg-vidro p-3">
          <p className="t-pq flex items-center gap-1.5 text-texto2">
            <CheckCircle2 className="size-4 text-ok-t" aria-hidden="true" />
            {ROTULO_TIPO[item.tipo]} · nível {item.nivel} de 5 · impacto {item.impacto}
          </p>
          <p className="t-pq text-texto2">
            Padrão: {item.series} x {item.reps} · descanso {item.descansoS} s
          </p>
          <p className="t-pq text-texto2">
            Equipamento: {item.equipamento.map(rotuloEquipamento).join(", ")}
          </p>
        </section>
      )}
    </div>
  );
}
