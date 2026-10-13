import { expect, test } from "@playwright/test";
import { ativarDemo, preparar } from "./ajudas";

test.describe("fluxos principais (modo local, 390x844)", () => {
  test("Hoje mostra saudação, data e o treino do dia", async ({ page }) => {
    await preparar(page);
    await page.goto("/hoje");
    await expect(page.getByRole("heading", { name: "Bom dia, Gabriel" })).toBeVisible();
    await expect(page.getByText("quarta, 14 de outubro")).toBeVisible();
    await expect(page.getByText("Quarta: pernas e funcional leve")).toBeVisible();
    await expect(page.getByText("Carga: Pós-jogo + 72 h antes do sábado - força moderada")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Como está seu tornozelo?" })).toBeVisible();
  });

  test("a barra inferior mostra o nome de todas as abas e navega", async ({ page }) => {
    await preparar(page);
    await page.goto("/hoje");
    const nav = page.getByRole("navigation", { name: "Navegação principal" });
    for (const nome of ["Hoje", "Semana", "Personal", "Evolução", "Perfil"]) {
      await expect(nav.getByText(nome, { exact: true })).toBeVisible();
    }
    await nav.getByRole("link", { name: "Semana" }).click();
    await expect(page).toHaveURL(/\/semana$/);
    await nav.getByRole("link", { name: "Evolução" }).click();
    await expect(page).toHaveURL(/\/evolucao$/);
  });

  test("check-in: salvar muda o cartão para o semáforo e o anel fecha", async ({ page }) => {
    await preparar(page);
    await page.goto("/hoje");
    await page.getByRole("button", { name: "Fazer check-in" }).first().click();
    await page.getByRole("button", { name: "Dor 2 de 10" }).click();
    await page.getByRole("button", { name: "Salvar check-in" }).click();
    await expect(page.getByText("Check-in feito")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tornozelo: verde" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Check-in: 1\/1/ })).toBeVisible();
  });

  test("check-in com dor 7 vira vermelho e mostra o alerta de segurança", async ({ page }) => {
    await preparar(page);
    await page.goto("/hoje");
    await page.getByRole("button", { name: "Fazer check-in" }).first().click();
    await page.getByRole("button", { name: "Dor 7 de 10" }).click();
    await page.getByRole("button", { name: "Salvar check-in" }).click();
    await expect(page.getByRole("heading", { name: "Tornozelo: vermelho" })).toBeVisible();
    await expect(page.getByRole("alert").getByText(/Hoje não aumente a carga/)).toBeVisible();
    await expect(page.getByText(/ortopedista ou fisioterapeuta/).first()).toBeVisible();
  });

  test("registrar sessão: o bloco vira Feito e o anel TORNOZELO completa", async ({ page }) => {
    await preparar(page);
    await page.goto("/hoje");
    await page.getByRole("button", { name: /Rotina de tornozelo: Fazer/ }).click();
    await page.getByRole("button", { name: "Esforço 5 de 10" }).click();
    await page.getByRole("button", { name: "Salvar sessão" }).click();
    await expect(page.getByRole("button", { name: /Rotina de tornozelo: Feito/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Tornozelo: 1\/1/ })).toBeVisible();
  });

  test("anel incompleto abre a pendência certa (check-in)", async ({ page }) => {
    await preparar(page);
    await page.goto("/hoje");
    await page.getByRole("button", { name: /Check-in: 0\/1/ }).click();
    await expect(page.getByRole("dialog", { name: "Check-in de hoje" })).toBeVisible();
  });

  test("Semana lista os 7 dias e o detalhe mostra exercícios", async ({ page }) => {
    await preparar(page);
    await page.goto("/semana");
    await expect(page.getByText("Quarta: pernas e funcional leve")).toBeVisible();
    await expect(page.getByText("Domingo: descanso")).toBeVisible();
    await page.getByRole("link", { name: /Quarta, 14/ }).click();
    await expect(page.getByText("Stiff (levantamento terra romeno)")).toBeVisible();
    await expect(page.getByText("Sessão do instrutor")).toBeVisible();
  });

  test("domingo: anéis mostram Descanso e não criam meta", async ({ page }) => {
    await preparar(page, { hora: new Date("2026-10-18T10:00:00-03:00") });
    await page.goto("/hoje");
    await expect(page.getByText("Hoje é descanso")).toBeVisible();
    await expect(page.getByRole("button", { name: /Treinos: Descanso/ })).toBeDisabled();
  });

  test("terça: o anel TREINOS vira o jogo e abre o card de jogo", async ({ page }) => {
    await preparar(page, { hora: new Date("2026-10-13T12:00:00-03:00") });
    await page.goto("/hoje");
    await page.getByRole("button", { name: /Treinos:/ }).click();
    await expect(page).toHaveURL(/\/jogo\/2026-10-13$/);
    await expect(page.getByText("Linha do tempo")).toBeVisible();
  });

  test("pré-jogo: percorre as 5 fases e grava o aquecimento", async ({ page }) => {
    await preparar(page, { hora: new Date("2026-10-13T18:00:00-03:00") });
    await page.goto("/jogo/pre?jogo=2026-10-13");
    await page.getByRole("button", { name: "Começar aquecimento" }).click();
    for (let i = 0; i < 5; i++) {
      await page.getByRole("button", { name: "Pular fase" }).click();
    }
    await expect(page.getByRole("heading", { name: "Pronto para o jogo" })).toBeVisible();
    const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem("meu-personal:v1") ?? "{}"));
    expect(salvo.preJogos?.[0]).toMatchObject({
      jogoData: "2026-10-13",
      concluido: true,
      fasesConcluidas: 5,
    });
  });

  test("Evolução sem dados mostra estado vazio e com demonstração mostra os gráficos", async ({ page }) => {
    await preparar(page);
    await page.goto("/evolucao");
    await expect(page.getByText("Ainda sem dados")).toBeVisible();
    await ativarDemo(page);
    await page.goto("/evolucao");
    await expect(page.getByRole("heading", { name: "Dor do tornozelo" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "DEMONSTRAÇÃO" })).toBeVisible();
  });

  test("modo demonstração é apagável e não deixa rastro", async ({ page }) => {
    await preparar(page);
    await ativarDemo(page);
    await page.getByRole("button", { name: "Apagar dados de exemplo" }).click();
    await expect(page.getByRole("status").filter({ hasText: "DEMONSTRAÇÃO" })).toHaveCount(0);
    const chaves = await page.evaluate(() => Object.keys(localStorage));
    expect(chaves).not.toContain("meu-personal:demo");
    expect(chaves).not.toContain("meu-personal:modo-demo");
  });

  test("tema claro e reduzir animações aplicam no documento", async ({ page }) => {
    await preparar(page);
    await page.goto("/perfil");
    await page.getByRole("button", { name: "Claro" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "claro");
    await page
      .getByRole("radiogroup", { name: "Reduzir animações" })
      .getByRole("radio", { name: "Sim" })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-reduzir", "1");
  });
});
