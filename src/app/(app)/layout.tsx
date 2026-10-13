import { BottomNav } from "@/components/ui/bottom-nav";
import { SplashGate } from "@/components/ui/splash";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashGate />
      {children}
      <BottomNav />
    </>
  );
}
