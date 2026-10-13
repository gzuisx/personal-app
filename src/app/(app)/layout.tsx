import { DadosProvider } from "@/components/dados-provider";
import { FaixaDemo } from "@/components/features/faixa-demo";
import { BottomNav } from "@/components/ui/bottom-nav";
import { SplashGate } from "@/components/ui/splash";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DadosProvider>
      <SplashGate />
      <FaixaDemo />
      {children}
      <BottomNav />
    </DadosProvider>
  );
}
