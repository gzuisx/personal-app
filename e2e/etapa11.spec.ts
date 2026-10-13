import { expect, test } from "@playwright/test";
import { preparar } from "./ajudas";

test.describe("etapa 11: biblioteca e demonstrações", () => {
  test("busca, filtro por região e detalhe com demonstração, como fazer e erros comuns", async ({ page }) => {
    await preparar(page);
    await page.goto("/biblioteca");
    await expect(page.getByRole("heading", { name: "Biblioteca" })).toBeVisible();
    await expect(page.getByText("77 exercícios")).toBeVisible();

    await page.getByRole("searchbox", { name: "Buscar exercício" }).fill("panturrilha degrau");
    await expect(page.getByRole("link", { name: /Panturrilha no degrau/ }).first()).toBeVisible();

    await page.getByRole("searchbox", { name: "Buscar exercício" }).fill("");
    await page.getByRole("button", { name: "Posterior de coxa", exact: true }).click();
    await page.getByRole("link", { name: /Stiff \(levantamento terra romeno\)/ }).click();

    await expect(page.getByRole("heading", { name: "Stiff (levantamento terra romeno)" })).toBeVisible();
    await expect(page.getByRole("img", { name: /Demonstração: Stiff/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Como fazer" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Erros comuns" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Regiões trabalhadas" })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Tempo da demonstração" })).toBeVisible();

    // pausar e continuar
    await page.getByRole("button", { name: "Pausar demonstração" }).click();
    await page.getByRole("button", { name: "Continuar demonstração" }).click();
    await expect(page.getByRole("button", { name: "Pausar demonstração" })).toBeVisible();
  });

  test("com Reduzir animações, mostra as poses-chave paradas e um botão para tocar", async ({ page }) => {
    await preparar(page);
    await page.addInitScript(() => {
      try {
        localStorage.setItem("reduzir", "1");
      } catch {
        // sem armazenamento
      }
    });
    await page.goto("/biblioteca/pant-degrau");
    await expect(page.getByRole("group", { name: /Poses-chave/ })).toBeVisible();
    await page.getByRole("button", { name: "Tocar demonstração" }).click();
    await expect(page.getByRole("img", { name: /Demonstração: Panturrilha no degrau/ })).toBeVisible();
  });

  test("o detalhe do dia abre a demonstração e leva à biblioteca", async ({ page }) => {
    await preparar(page);
    await page.goto("/semana/2026-10-14");
    await page.getByRole("button", { name: /Stiff/ }).first().click();
    await expect(page.getByRole("img", { name: /Demonstração: Stiff/ }).first()).toBeVisible();
    await page.getByRole("link", { name: "Como fazer e erros comuns" }).first().click();
    await expect(page.getByRole("heading", { name: "Erros comuns" })).toBeVisible();
  });
});

test.describe("etapa 11: foco de lesão", () => {
  test("trocar o foco no Perfil pede confirmação e muda o check-in e a reabilitação", async ({ page }) => {
    await preparar(page);
    await page.goto("/perfil");
    await expect(page.getByText("tornozelo direito", { exact: false }).first()).toBeVisible();
    await page.getByRole("button", { name: "Trocar foco" }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "Posterior de coxa", exact: true }).click();
    await expect(sheet.getByText(/procure um ortopedista ou fisioterapeuta/).first()).toBeVisible();
    await sheet.getByRole("button", { name: "Trocar foco" }).click();
    await page.getByRole("button", { name: "Sim, trocar" }).click();
    await expect(page.getByText("Foco trocado: posterior de coxa direito")).toBeVisible();

    const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem("meu-personal:v1") ?? "{}"));
    const ativos = salvo.focos.filter((f: { ativo: boolean }) => f.ativo);
    expect(ativos).toHaveLength(1);
    expect(ativos[0].regiao).toBe("posterior_coxa");

    await page.goto("/hoje");
    await expect(page.getByRole("heading", { name: "Como está seu posterior de coxa?" })).toBeVisible();
    await page.getByRole("button", { name: "Fazer check-in" }).first().click();
    await expect(page.getByRole("heading", { name: "Dor no posterior de coxa direito" })).toBeVisible();
    // o tornozelo continua no check-in
    await expect(page.getByRole("heading", { name: "Dor no tornozelo direito" })).toBeVisible();

    await page.goto("/semana/2026-10-14");
    await expect(page.getByText("Reabilitação: posterior de coxa direito").first()).toBeVisible();
  });
});
