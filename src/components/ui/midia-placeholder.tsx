import { Footprints } from "lucide-react";

/** Espaço 16:9 reservado para a mídia do exercício (etapa 6). */
export function MidiaPlaceholder({ mediaUrl }: { mediaUrl?: string | null }) {
  if (mediaUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={mediaUrl} alt="" className="aspect-video w-full rounded-2xl object-cover" />;
  }
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-borda bg-vidro text-texto3">
      <Footprints className="size-8" aria-hidden="true" />
      <span className="t-pq">Demonstração em breve</span>
    </div>
  );
}
