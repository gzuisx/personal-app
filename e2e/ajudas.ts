import type { Page } from "@playwright/test";

/** Quarta-feira, 14/10/2026, 9h em Brasília: dia de treino de pernas, sem jogo. */
export const QUARTA_9H = new Date("2026-10-14T09:00:00-03:00");

type Opcoes = { tema?: "escuro" | "claro" | "auto"; hora?: Date };

/** Prepara a página: sem splash, tema escolhido e relógio fixo. */
export async function preparar(page: Page, { tema = "escuro", hora = QUARTA_9H }: Opcoes = {}) {
  await page.addInitScript((t) => {
    try {
      sessionStorage.setItem("splash", "1");
      localStorage.setItem("tema", t);
    } catch {
      // sem armazenamento
    }
  }, tema);
  await page.clock.setFixedTime(hora);
}

/** Liga o modo demonstração pelo Perfil (dados fictícios, só neste aparelho). */
export async function ativarDemo(page: Page) {
  await page.goto("/perfil");
  await page.getByRole("button", { name: "Carregar dados de exemplo" }).click();
  await page.getByRole("status").filter({ hasText: "DEMONSTRAÇÃO" }).waitFor();
}
