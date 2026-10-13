import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("skeleton rounded-2xl", className)} />;
}

export function SkeletonCartao({ linhas = 3 }: { linhas?: number }) {
  return (
    <div
      className="space-y-3 rounded-cartao border border-borda bg-vidro-forte p-4"
      role="status"
      aria-label="Carregando"
    >
      <Skeleton className="h-5 w-2/5" />
      {Array.from({ length: linhas }, (_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function SkeletonTela() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-3/4" />
      <SkeletonCartao linhas={3} />
      <SkeletonCartao linhas={4} />
      <div className="flex gap-3">
        <Skeleton className="h-[132px] flex-1" />
        <Skeleton className="h-[132px] flex-1" />
        <Skeleton className="h-[132px] flex-1" />
      </div>
    </div>
  );
}
