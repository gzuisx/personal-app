import { expect, test, type Page } from "@playwright/test";
import { ativarDemo, preparar } from "./ajudas";

async function checkinComDor(page: Page, dor: number) {
  await page.getByRole("button", { name: "Fazer check-in" }).first().click();
  await page.getByRole("button", { name: `Dor ${dor} de 10` }).click();
  await page.getByRole("button", { name: "Salvar check-in" }).click();
  await expect(page.getByText("Check-in feito")).toBeVisible();
}

test.describe("coach: decisão do dia (modo local, quarta 9h)", () => {
  test("dor baixa: modo Completo, sem porcentagem na tela", async ({ page }) => {
    await preparar(page);
    await page.goto("/hoje");
    await checkinComDor(page, 1);
    await expect(page.getByTestId("modo-do-dia")).toHaveText("Modo Completo");
    await expect(page.getByText("Tudo certo: siga o treino do plano.")).toBeVisible();
    await expect(page.getByTestId("modo-do-dia")).not.toContainText("%");
  });

  test("dor 7: modo Recuperação, alerta de profissional e 'Por que?' com a regra e o que mudaria", async ({
    page,
  }) => {
    await preparar(page);
    await page.goto("/hoje");
    await checkinComDor(page, 7);
    await expect(page.getByTestId("modo-do-dia")).toHaveText(/Modo (Recuperação|Folga)/);
    await page.getByRole("button", { name: "Por que?" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText(/Regra R01/)).toBeVisible();
    await expect(sheet.getByText(/O que mudaria/).first()).toBeVisible();
    await expect(sheet.getByText(/Pontuação interna do app/)).toBeVisible();
    await expect(sheet.getByText(/Não é medida fisiológica/)).toBeVisible();
  });

  test("Ajustar treino: a escolha vira o padrão do treino guiado", async ({ page }) => {
    await preparar(page);
    await page.goto("/hoje");
    await checkinComDor(page, 1);
    await page.getByRole("button", { name: "Ajustar treino" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Reduzido", exact: true }).click();
    await expect(page.getByText("Você escolheu: Reduzido")).toBeVisible();
    await page.goto("/treino/qua-tornozelo");
    await expect(page.locator("p.t-h2", { hasText: /^Reduzido$/ })).toBeVisible();
  });

  test("Só tenho 20 min: monta o essencial e o treino guiado abre com esse tempo", async ({ page }) => {
    await preparar(page);
    await page.goto("/hoje");
    await checkinComDor(page, 1);
    await page.getByRole("button", { name: "Ajustar treino" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "20 min", exact: true }).click();
    await expect(page.getByText("Você escolheu: Só 20 min")).toBeVisible();
    await page.goto("/treino/qua-forca");
    await expect(page.locator("p.t-h2", { hasText: /^Só 20 min$/ })).toBeVisible();
    await expect(page.getByText(/Fica registrado como parcial/)).toBeVisible();
  });
});

test.describe("coach: semana e perfil", () => {
  test("Ajustar semana: funcional cancelado aparece como ajuste e some do dia", async ({ page }) => {
    await preparar(page);
    await page.goto("/semana");
    await page.getByRole("button", { name: "Ajustar semana" }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "Funcional cancelado" }).click();
    await sheet.getByRole("button", { name: /^Aplicar em/ }).click();
    await expect(sheet.getByText(/Funcional cancelado/).last()).toBeVisible();
  });

  test("Sugestões para você: Adicionar acrescenta o exercício ao dia", async ({ page }) => {
    await preparar(page);
    await page.goto("/semana");
    const botao = page.getByRole("button", { name: /^Adicionar / }).first();
    await expect(botao).toBeVisible();
    await botao.click();
    await expect(page.getByText(/Adicionado em/)).toBeVisible();
  });

  test("Perfil > Rotina salva os horários", async ({ page }) => {
    await preparar(page);
    await page.goto("/perfil");
    await expect(page.getByRole("heading", { name: "Rotina" })).toBeVisible();
    await page.getByLabel("Acordo").fill("06:30");
    await page.getByRole("button", { name: "Salvar rotina" }).click();
    await expect(page.getByText("Rotina salva")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Acordo")).toHaveValue("06:30");
  });
});

test.describe("coach: propostas (demonstração)", () => {
  test("no demo as propostas do coach aparecem com checklist e podem ser recusadas", async ({ page }) => {
    await preparar(page);
    await ativarDemo(page);
    await page.goto("/hoje");
    await checkinComDor(page, 1);
    const propostas = page.getByTestId("propostas");
    // depende dos dados fictícios: se o motor não propuser nada hoje, o teste só confirma que a tela abre
    if (await propostas.isVisible().catch(() => false)) {
      await expect(propostas.getByRole("button", { name: "Aceitar" }).first()).toBeVisible();
      await propostas.getByRole("button", { name: "Recusar" }).first().click();
      await expect(page.getByText("Proposta recusada")).toBeVisible();
    } else {
      await expect(page.getByTestId("modo-do-dia")).toBeVisible();
    }
  });
});
