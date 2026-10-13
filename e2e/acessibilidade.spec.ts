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
  for (const rota of ["/hoje", "/semana", "/evolucao", "/perfil", "/jogo/2026-10-13"]) {
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
