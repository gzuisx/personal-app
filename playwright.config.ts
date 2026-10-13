import { defineConfig } from "@playwright/test";

// Os testes rodam contra o app compilado, sem variáveis do Supabase (modo local).
// Antes: `npm run build` (sem NEXT_PUBLIC_SUPABASE_*). Localmente usa o Chrome instalado.
const porta = 3200;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${porta}`,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    channel: process.env.CI ? undefined : "chrome",
  },
  webServer: {
    command: `npx next start -p ${porta}`,
    url: `http://localhost:${porta}/hoje`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
