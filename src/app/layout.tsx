import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Meu Personal",
  description: "Seu treino. Seu tornozelo. Seu ritmo.",
  appleWebApp: { capable: true, title: "Meu Personal", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#030B1F",
};

// Aplica tema e "reduzir animações" antes da hidratação, para não piscar.
const scriptPreferencias = `try{var d=document.documentElement;var t=localStorage.getItem('tema');d.dataset.theme=(t==='claro'||t==='auto')?t:'escuro';if(localStorage.getItem('reduzir')==='1')d.dataset.reduzir='1'}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="escuro" className={poppins.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptPreferencias }} />
      </head>
      <body className="antialiased">
        <div className="fundo-app" aria-hidden="true" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
