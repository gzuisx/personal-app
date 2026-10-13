import { DadosProvider } from "@/components/dados-provider";
import { BottomNav } from "@/components/ui/bottom-nav";
import { SplashGate } from "@/components/ui/splash";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DadosProvider>
      <SplashGate />
      {children}
      <BottomNav />
    </DadosProvider>
  );
}
