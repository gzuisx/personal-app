import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const saida = fileURLToPath(new URL("../public/icons/", import.meta.url));
await mkdir(saida, { recursive: true });

// margem = fração do lado reservada em volta da bola (maskable precisa de mais)
const svg = (margem) => {
  const r = 512 * (0.5 - margem);
  const pontos = [
    [256, 256 - r * 0.45],
    [256 + r * 0.43, 256 - r * 0.14],
    [256 + r * 0.27, 256 + r * 0.36],
    [256 - r * 0.27, 256 + r * 0.36],
    [256 - r * 0.43, 256 - r * 0.14],
  ]
    .map((p) => p.join(","))
    .join(" ");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0b1410"/>
  <circle cx="256" cy="256" r="${r}" fill="#22c55e"/>
  <circle cx="256" cy="256" r="${r * 0.9}" fill="#0b1410"/>
  <polygon points="${pontos}" fill="#22c55e"/>
</svg>`);
};

const gerar = (nome, tamanho, margem) =>
  sharp(svg(margem)).resize(tamanho, tamanho).png().toFile(path.join(saida, nome));

await gerar("icon-192.png", 192, 0.1);
await gerar("icon-512.png", 512, 0.1);
await gerar("icon-maskable-512.png", 512, 0.2);
await gerar("apple-touch-icon.png", 180, 0.1);
console.log("Ícones gerados em public/icons");
