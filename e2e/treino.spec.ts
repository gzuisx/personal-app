import { expect, test, type Page } from "@playwright/test";
import { preparar } from "./ajudas";

/** Conduz o botão principal até aparecer o resumo. Só usa os botões que o usuário vê. */
async function conduzirAteResumo(page: Page) {
  for (let i = 0; i < 400; i++) {
    if (await page.getByRole("button", { name: "Salvar e finalizar" }).isVisible()) return;
    for (const nome of [
      "Finalizar treino",
      "Concluir série",
      "Pular descanso",
      "Próxima série",
      "Próximo exercício",
      "Próximo bloco",
      "Começar bloco",
    ]) {
      const b = page.getByRole("button", { name: nome, exact: true });
      if (await b.isVisible()) {
        await b.click();
        break;
      }
    }
    await page.waitForTimeout(60);
  }
  throw new Error("o treino não chegou ao resumo");
}

test.describe("treino guiado (modo local, quarta 9h)", () => {
  test("Iniciar treino abre o fluxo e o botão principal conduz série, descanso e próxima série", async ({
    page,
  }) => {
    await preparar(page);
    await page.goto("/hoje");
    await page.getByRole("link", { name: /Iniciar treino/ }).click();
    await expect(page).toHaveURL(/\/treino\/qua-tornozelo/);
    await expect(page.getByText("Modo do dia")).toBeVisible();
    await page.getByRole("button", { name: "Começar" }).click();

    await expect(page.getByRole("heading", { name: /Equilíbrio em um pé só/ })).toBeVisible();
    await expect(page.getByText("Exercício 1 de 6 · Série 1 de 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "Concluir série", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Concluir série", exact: true }).click();
    // descanso: o botão principal vira "Descansar" (desabilitado) e há "Pular descanso"
    await expect(page.getByRole("button", { name: /^Descansar/ })).toBeDisabled();
    await page.getByRole("button", { name: "Pular descanso" }).click();
    await expect(page.getByRole("button", { name: "Próxima série", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Próxima série", exact: true }).click();
    await expect(page.getByText("Exercício 1 de 6 · Série 2 de 3")).toBeVisible();
  });

  test("cada série é gravada e o treino completo vira sessão 'Feito' na Hoje", async ({ page }) => {
    await preparar(page);
    await page.goto("/treino/qua-tornozelo");
    await page.getByRole("button", { name: "Começar" }).click();
    await conduzirAteResumo(page);
    await expect(page.getByRole("heading", { name: "Treino concluído" })).toBeVisible();
    await page.getByRole("button", { name: "Esforço 5 de 10" }).click();
    await page.getByRole("button", { name: "Salvar e finalizar" }).click();
    await expect(page.getByRole("heading", { name: "Treino registrado" })).toBeVisible();

    const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem("meu-personal:v1") ?? "{}"));
    expect(salvo.series.length).toBe(3 + 3 + 3 + 3 + 3 + 2); // séries do plano de tornozelo da fase 1
    expect(salvo.sessoes[0]).toMatchObject({ bloco: "qua-tornozelo", resultado: "feito", esforco: 5 });
    expect(salvo.execucao).toBeNull();

    await page.getByRole("button", { name: "Voltar para a Hoje" }).click();
    await expect(page.getByRole("button", { name: /Rotina de tornozelo: Feito/ })).toBeVisible();
  });

  test("fechar o app no meio e voltar retoma de onde parou", async ({ page }) => {
    await preparar(page);
    await page.goto("/treino/qua-forca");
    await page.getByRole("button", { name: "Começar" }).click();
    await page.getByRole("button", { name: "Aumentar carga" }).click();
    await page.getByRole("button", { name: "Concluir série", exact: true }).click();
    await page.getByRole("button", { name: "Pular descanso" }).click();
    await page.getByRole("button", { name: "Próxima série", exact: true }).click();

    await page.goto("/treino/qua-forca"); // como se tivesse fechado e aberto de novo
    await expect(page.getByRole("heading", { name: "Continuar treino de hoje?" })).toBeVisible();
    await page.getByRole("button", { name: "Continuar de onde parei" }).click();
    await expect(page.getByText("Exercício 1 de 5 · Série 2 de 3")).toBeVisible();

    // e a Hoje oferece continuar
    await page.goto("/hoje");
    await expect(page.getByRole("link", { name: /Continuar treino de hoje/ })).toBeVisible();
  });

  test("valores sugeridos vêm da última sessão", async ({ page }) => {
    await preparar(page);
    await page.addInitScript(() => {
      localStorage.setItem(
        "meu-personal:v1",
        JSON.stringify({
          series: [1, 2, 3].map((n) => ({
            execucaoId: "antiga",
            data: "2026-10-07",
            bloco: "qua-forca",
            exercicio: "stiff",
            numero: n,
            cargaKg: 40,
            reps: 8,
            duracaoS: null,
            rir: null,
            esforco: "ok",
            dorDurante: null,
            criadoEm: "2026-10-07T12:00:00Z",
          })),
        }),
      );
    });
    await page.goto("/treino/qua-forca");
    await page.getByRole("button", { name: "Começar" }).click();
    await expect(page.getByText("Última vez: 8 × 40 kg")).toBeVisible();
    await expect(page.getByRole("button", { name: "Diminuir carga" })).toBeVisible();
    // a carga já vem preenchida: concluir sem mexer grava 40 kg
    await page.getByRole("button", { name: "Concluir série", exact: true }).click();
    const salvo = await page.evaluate(() => JSON.parse(localStorage.getItem("meu-personal:v1") ?? "{}"));
    const nova = salvo.series.find((x: { execucaoId: string }) => x.execucaoId !== "antiga");
    expect(nova).toMatchObject({ exercicio: "stiff", reps: 8, cargaKg: 40 });
  });

  test("'Doeu' com dor 7 encerra o treino e pede o check-in; com 4 sugere a versão mais leve", async ({
    page,
  }) => {
    await preparar(page);
    await page.goto("/treino/qua-tornozelo");
    await page.getByRole("button", { name: "Começar" }).click();
    // vai até a panturrilha no degrau (5º exercício)
    for (let i = 0; i < 4; i++) {
      await page.locator("main").getByRole("button", { name: "Pular", exact: true }).click();
      await page.getByRole("button", { name: "Sem tempo" }).click();
      await page
        .getByRole("dialog", { name: "Pular exercício" })
        .getByRole("button", { name: "Pular", exact: true })
        .click();
    }
    await page.locator("main").getByRole("button", { name: "Doeu", exact: true }).click();
    await page.getByRole("button", { name: "Dor 4 de 10" }).click();
    await expect(page.getByText("Pare este exercício")).toBeVisible();
    await expect(page.getByRole("button", { name: /Trocar por: Caminhada nas pontas/ })).toBeVisible();
    await page.getByRole("button", { name: "Dor 7 de 10" }).click();
    await expect(page.getByRole("heading", { name: "Treino encerrado" })).toBeVisible();
    await expect(page.getByRole("alert").getByText(/ortopedista ou fisioterapeuta/)).toBeVisible();
  });

  test("pular e trocar exercício", async ({ page }) => {
    await preparar(page);
    await page.goto("/treino/qua-forca");
    await page.getByRole("button", { name: "Começar" }).click();
    await page.getByRole("button", { name: "Trocar", exact: true }).click();
    await page
      .getByRole("button", { name: /Equivalente/ })
      .first()
      .click();
    await expect(page.getByText("Trocado do plano.")).toBeVisible();
    await page.locator("main").getByRole("button", { name: "Pular", exact: true }).click();
    await page.getByRole("button", { name: "Cansado" }).click();
    await page
      .getByRole("dialog", { name: "Pular exercício" })
      .getByRole("button", { name: "Pular", exact: true })
      .click();
    await expect(page.getByText("Exercício 1 de 4 · Série 1 de 2")).toBeVisible();
  });

  test("Sequência do dia encadeia tornozelo e força, com tela de transição", async ({ page }) => {
    await preparar(page);
    await page.goto("/hoje");
    await expect(page.getByText("Sequência do dia · 55 min")).toBeVisible();
    await page.getByRole("link", { name: /Iniciar sequência/ }).click();
    await expect(page).toHaveURL(/sequencia=1/);
    await page.getByRole("button", { name: "Começar" }).click();
    // anda até a transição entre blocos
    for (let i = 0; i < 200; i++) {
      if (await page.getByRole("heading", { name: "Bloco concluído" }).isVisible()) break;
      for (const nome of [
        "Concluir série",
        "Pular descanso",
        "Próxima série",
        "Próximo exercício",
        "Próximo bloco",
      ]) {
        const b = page.getByRole("button", { name: nome, exact: true });
        if (await b.isVisible()) {
          await b.click();
          break;
        }
      }
      await page.waitForTimeout(60);
    }
    await expect(page.getByRole("heading", { name: "Bloco concluído" })).toBeVisible();
    await expect(page.getByText("Força de pernas")).toBeVisible();
    await page.getByRole("button", { name: "Começar bloco" }).click();
    await expect(page.getByRole("heading", { name: /Stiff/ })).toBeVisible();
  });

  test("o anel TORNOZELO pendente abre o treino guiado", async ({ page }) => {
    await preparar(page);
    await page.goto("/hoje");
    await page.getByRole("button", { name: /Tornozelo: 0\/1/ }).click();
    await expect(page).toHaveURL(/\/treino\/qua-tornozelo/);
  });

  test("a tela do treino não mostra a barra inferior e usa botões grandes", async ({ page }) => {
    await preparar(page);
    await page.goto("/treino/qua-forca");
    await page.getByRole("button", { name: "Começar" }).click();
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toHaveCount(0);
    const caixa = await page.getByRole("button", { name: "Concluir série", exact: true }).boundingBox();
    expect(caixa!.height).toBeGreaterThanOrEqual(56);
  });
});
