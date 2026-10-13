import { Sparkles } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { IlustracaoVazia } from "@/components/ui/empty-state";

const exemplos = [
  "Meu tornozelo está melhor, posso evoluir?",
  "Só tenho 20 min hoje",
  "Quero focar em posterior",
];

export default function PersonalPage() {
  return (
    <main className="pagina">
      <Header titulo="Personal" />
      <div className="space-y-4">
        <GlassCard indice={0} className="flex flex-col items-center gap-3 py-6 text-center">
          <IlustracaoVazia />
          <div className="flex items-center gap-2 text-realce-t">
            <Sparkles className="size-5" aria-hidden="true" />
            <h2 className="t-h2 text-texto">Seu personal com IA</h2>
          </div>
          <p className="t-corpo max-w-[300px] text-texto2">
            Em breve: converse com seu personal, receba propostas de evolução e ajuste o treino por aqui.
          </p>
        </GlassCard>

        <GlassCard indice={1} variante="leve" titulo="Exemplos de conversa">
          <div className="flex flex-wrap gap-2">
            {exemplos.map((e) => (
              <Chip key={e} disabled>
                {e}
              </Chip>
            ))}
          </div>
          <p className="t-pq mt-3 text-texto2">Disponível em breve.</p>
        </GlassCard>

        <div className="flex gap-2">
          <input
            disabled
            placeholder="Escreva uma mensagem (em breve)"
            aria-label="Mensagem para o personal (indisponível)"
            className="h-14 min-w-0 flex-1 rounded-full border border-borda bg-vidro-forte px-5 text-[0.9375rem] text-texto placeholder:text-texto3 disabled:opacity-60"
          />
        </div>
      </div>
    </main>
  );
}
