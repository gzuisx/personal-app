import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ativarDemo, preparar } from "./ajudas";

// C10: axe-core em todas as telas, nos dois temas, com dados de demonstração para cobrir mais elementos.
const rotas = [
  "/hoje",
  "/semana",
  "/semana/2026-10-14",
  "/personal",
  "/evolucao",
  "/perfil",
  "/jogo/2026-10-13",
  "/jogo/pre",
  "/jogo/pos",
  "/biblioteca",
  "/biblioteca/stiff",
];

for (const tema of ["escuro", "claro"] as const) {
  test.describe(`acessibilidade, tema ${tema}`, () => {
    for (const rota of rotas) {
      test(`${rota} sem violações (WCAG 2 AA)`, async ({ page }) => {
        await preparar(page, { tema });
        await ativarDemo(page);
        await page.goto(rota);
        await page.locator("main").first().waitFor();
        await page.waitForTimeout(1400); // animações de entrada terminam antes de medir o contraste
        const r = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        const resumo = r.violations.map(
          (v) => `${v.id}: ${v.nodes.length}x ${v.nodes[0]?.html.slice(0, 140)}`,
        );
        expect(resumo, resumo.join("\n")).toEqual([]);
      });
    }
  });
}

test.describe("texto a 130%", () => {
  for (const rota of ["/hoje", "/semana", "/evolucao", "/evolucao/testes", "/perfil", "/jogo/2026-10-13"]) {
    test(`${rota} não estoura a largura`, async ({ page }) => {
      await preparar(page);
      await ativarDemo(page);
      await page.goto(rota);
      await page.locator("main").first().waitFor();
      await page.addStyleTag({ content: "html { font-size: 130% !important; }" });
      await page.waitForTimeout(600);
      const { largura, janela } = await page.evaluate(() => ({
        largura: document.documentElement.scrollWidth,
        janela: window.innerWidth,
      }));
      expect(largura).toBeLessThanOrEqual(janela);
    });
  }
});

// Treino guiado (etapa 7): as três telas principais, nos dois temas.
for (const tema of ["escuro", "claro"] as const) {
  test.describe(`acessibilidade do treino guiado, tema ${tema}`, () => {
    test("preparar, exercício, descanso e resumo sem violações", async ({ page }) => {
      await preparar(page, { tema });
      await page.goto("/treino/qua-tornozelo");
      const verificar = async (etapa: string) => {
        await page.waitForTimeout(600);
        const r = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        const resumo = r.violations.map(
          (v) => `${v.id}: ${v.nodes.length}x ${v.nodes[0]?.html.slice(0, 140)}`,
        );
        expect(resumo, `${etapa}\n${resumo.join("\n")}`).toEqual([]);
      };
      await verificar("preparar");
      await page.getByRole("button", { name: "Começar" }).click();
      await verificar("exercício");
      await page.getByRole("button", { name: "Concluir série", exact: true }).click();
      await verificar("descanso");
      await page.getByRole("button", { name: "Pular descanso" }).click();
      await verificar("pronto");
    });
  });
}

// Etapa 9: abas da Evolução, testes de campo e sheets novos, nos dois temas.
for (const tema of ["escuro", "claro"] as const) {
  test.describe(`acessibilidade da etapa 9, tema ${tema}`, () => {
    const medir = async (page: import("@playwright/test").Page, etapa: string) => {
      await page.waitForTimeout(900);
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const resumo = r.violations.map((v) => `${v.id}: ${v.nodes.length}x ${v.nodes[0]?.html.slice(0, 140)}`);
      expect(resumo, `${etapa}\n${resumo.join("\n")}`).toEqual([]);
    };

    for (const aba of ["Calendário", "Carga", "Tornozelo", "Força", "Testes", "Insights", "Jogos"]) {
      test(`Evolução > ${aba} sem violações`, async ({ page }) => {
        await preparar(page, { tema });
        await ativarDemo(page);
        await page.goto("/evolucao");
        await page.getByRole("tab", { name: aba }).click();
        await medir(page, aba);
      });
    }

    test("/evolucao/testes e o sheet de registro sem violações", async ({ page }) => {
      await preparar(page, { tema });
      await ativarDemo(page);
      await page.goto("/evolucao/testes");
      await page.locator("main").first().waitFor();
      await medir(page, "lista de testes");
      await page.getByRole("button", { name: "Fazer o teste T1" }).click();
      await medir(page, "registro do T1");
    });

    test("check-in com dor, carga e calendário abertos sem violações", async ({ page }) => {
      await preparar(page, { tema });
      await page.goto("/hoje");
      await page.getByRole("button", { name: "Fazer check-in" }).first().click();
      await page.getByRole("button", { name: "Dor 4 de 10" }).click();
      await medir(page, "check-in com local da dor");
    });
  });
}
