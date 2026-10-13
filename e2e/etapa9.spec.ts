import { expect, test } from "@playwright/test";
import { ativarDemo, preparar } from "./ajudas";

test.describe("etapa 9: check-in com local da dor", () => {
  test("com dor 3 aparecem região, movimento e duração, e o que foi marcado fica salvo", async ({ page }) => {
    await preparar(page);
    await page.goto("/hoje");
    await page.getByRole("button", { name: "Fazer check-in" }).first().click();
    await page.getByRole("button", { name: "Dor 0 de 10" }).click();
    await expect(page.getByRole("heading", { name: "Onde doeu" })).toHaveCount(0);
    await page.getByRole("button", { name: "Dor 3 de 10" }).click();
    await expect(page.getByRole("heading", { name: "Onde doeu" })).toBeVisible();
    await page.getByRole("button", { name: "Lateral", exact: true }).click();
    await page.getByRole("button", { name: "Chutar", exact: true }).click();
    await page.getByRole("button", { name: "5 a 10 min", exact: true }).click();
    await page
      .getByRole("radiogroup", { name: "Posterior apertou" })
      .getByRole("radio", { name: "Sim" })
      .click();
    await page.getByRole("button", { name: "Salvar check-in" }).click();
    await expect(page.getByText("Check-in feito")).toBeVisible();

    const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem("meu-personal:v1") ?? "{}"));
    const c = salvo.checkins[0];
    expect(c.regioes).toEqual(["lateral"]);
    expect(c.movimentos).toEqual(["chutar"]);
    expect(c.duracaoDor).toBe("5_10min");
    expect(c.posteriorApertou).toBe(true);
  });
});

test.describe("etapa 9: testes de campo e metas", () => {
  test("registrar o sprint T1 mostra o último resultado e a meta sugerida", async ({ page }) => {
    await preparar(page);
    await page.goto("/evolucao/testes");
    await expect(page.getByText(/Pare se doer mais de 3/).first()).toBeVisible();
    await page.getByRole("button", { name: "Fazer o teste T1" }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByLabel("Tentativa 1").fill("3,60");
    await sheet.getByLabel("Tentativa 2").fill("3,48");
    await sheet.getByLabel("Tentativa 3").fill("3,55");
    await sheet.getByRole("button", { name: "Salvar teste" }).click();
    await expect(page.getByText("Teste registrado")).toBeVisible();
    // vale a melhor tentativa
    await expect(page.getByText(/Último: 3,48 s/)).toBeVisible();
    await page.getByRole("button", { name: /Criar meta sugerida/ }).click();
    await expect(page.getByText("Sprint de 20 m mais rápido")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: /Progresso da meta/ })).toBeVisible();
  });

  test("o salto em um pé (T5) fica travado fora da fase 3", async ({ page }) => {
    await preparar(page);
    await page.goto("/evolucao/testes");
    await expect(page.getByText("Disponível a partir da fase 3 do tornozelo.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Fazer o teste T5" })).toHaveCount(0);
  });

  test("simetria entre os pés aparece no T4", async ({ page }) => {
    await preparar(page);
    await page.goto("/evolucao/testes");
    await page.getByRole("button", { name: "Fazer o teste T4" }).click();
    let sheet = page.getByRole("dialog");
    await sheet.getByLabel("Valor").fill("20");
    await sheet.getByRole("button", { name: "Salvar teste" }).click();
    await expect(page.getByText("Teste registrado")).toBeVisible();
    await page.getByRole("button", { name: "Fazer o teste T4" }).click();
    sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "Pé esquerdo" }).click();
    await sheet.getByLabel("Valor").fill("16");
    await sheet.getByRole("button", { name: "Salvar teste" }).click();
    await expect(page.getByText(/Simetria entre os pés: 80%/)).toBeVisible();
  });
});

test.describe("etapa 9: abas da Evolução (demonstração)", () => {
  test("as 8 abas existem e Resumo continua como padrão", async ({ page }) => {
    await preparar(page);
    await ativarDemo(page);
    await page.goto("/evolucao");
    for (const nome of [
      "Resumo",
      "Calendário",
      "Carga",
      "Tornozelo",
      "Força",
      "Testes",
      "Insights",
      "Jogos",
    ]) {
      await expect(page.getByRole("tab", { name: nome })).toBeVisible();
    }
    await expect(page.getByRole("tab", { name: "Resumo" })).toHaveAttribute("aria-selected", "true");
  });

  test("Calendário: tocar numa data abre planejado x realizado", async ({ page }) => {
    await preparar(page);
    await ativarDemo(page);
    await page.goto("/evolucao");
    await page.getByRole("tab", { name: "Calendário" }).click();
    await page.getByRole("button", { name: /^12 de outubro/ }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Planejado x realizado")).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "Treinos" })).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "Check-in" })).toBeVisible();
  });

  test("Calendário: dia futuro mostra o planejado sem erro", async ({ page }) => {
    await preparar(page);
    await page.goto("/evolucao");
    await page.getByRole("tab", { name: "Calendário" }).click();
    await page.getByRole("button", { name: /^16 de outubro/ }).click();
    await expect(page.getByRole("dialog").getByText("Planejado").first()).toBeVisible();
  });

  test("Carga: tocar num dia lista o que compôs e 'Como calculamos' mostra a fórmula", async ({ page }) => {
    await preparar(page);
    await ativarDemo(page);
    await page.goto("/evolucao");
    await page.getByRole("tab", { name: "Carga" }).click();
    await page.getByRole("button", { name: /^terça, 13\/10/ }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("O que compôs o dia")).toBeVisible();
    await expect(sheet.getByText(/Sono e dor do dia/)).toBeVisible();
    await sheet.getByRole("button", { name: "Fechar" }).click();
    await page.getByRole("button", { name: "Como calculamos" }).click();
    await expect(page.getByRole("dialog").getByText(/esforço \(0 a 10\) x minutos/)).toBeVisible();
    await expect(page.getByText(/% de recupera/)).toHaveCount(0);
  });

  test("Força sem séries diz o que fazer; Insights mostra o que falta", async ({ page }) => {
    await preparar(page);
    await page.goto("/evolucao");
    await page.getByRole("tab", { name: "Força" }).click();
    await expect(page.getByText("Ainda sem séries registradas")).toBeVisible();
    await page.getByRole("tab", { name: "Insights" }).click();
    await expect(page.getByText("Ainda sem dados suficientes")).toBeVisible();
    await expect(page.getByText(/Faltam \d+ registros? \(mínimo 10\)/).first()).toBeVisible();
  });

  test("Jogos: preencher o diário salva e aparece na lista", async ({ page }) => {
    await preparar(page);
    await ativarDemo(page);
    await page.goto("/evolucao");
    await page.getByRole("tab", { name: "Jogos" }).click();
    await page
      .getByRole("button", { name: /Preencher diário|Editar diário/ })
      .first()
      .click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "Mais Gols" }).click();
    await sheet.getByRole("button", { name: "Mais Gols" }).click();
    await sheet.getByRole("group", { name: "Condição física" }).getByRole("button", { name: "4" }).click();
    await sheet.getByLabel("Coisa boa 1").fill("Boa leitura");
    await sheet.getByRole("button", { name: "Salvar diário" }).click();
    await expect(page.getByText("Diário salvo")).toBeVisible();
    await expect(page.getByText(/Diário: 2 gols/).first()).toBeVisible();
  });
});
