import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const saida = fileURLToPath(new URL("../public/icons/", import.meta.url));
await mkdir(saida, { recursive: true });

// Logotipo original: arco ascendente terminando em um ponto, em quadrado azul.
// "cheio" = fundo ocupa toda a imagem (maskable / ícone iOS). "escala" reduz a marca.
const svg = ({
  cheio,
  escala,
}) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3A80FF"/>
      <stop offset="1" stop-color="#1555D6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="#030B1F"/>
  <rect width="512" height="512" rx="${cheio ? 0 : 116}" fill="url(#g)"/>
  <g transform="translate(256 256) scale(${escala}) translate(-256 -256)">
    <path d="M112 372 C 190 372 250 330 292 252 C 312 215 336 188 380 156" fill="none" stroke="#FFFFFF" stroke-width="40" stroke-linecap="round"/>
    <circle cx="388" cy="148" r="34" fill="#4DB8FF"/>
  </g>
</svg>`;

const gerar = (nome, tamanho, opcoes) =>
  sharp(Buffer.from(svg(opcoes)))
    .resize(tamanho, tamanho)
    .png()
    .toFile(path.join(saida, nome));

await gerar("icon-192.png", 192, { cheio: true, escala: 1 });
await gerar("icon-512.png", 512, { cheio: true, escala: 1 });
// maskable: margem de segurança (conteúdo dentro de ~70% do centro)
await gerar("icon-maskable-512.png", 512, { cheio: true, escala: 0.7 });
await gerar("apple-touch-icon.png", 180, { cheio: true, escala: 1 });

await writeFile(path.join(saida, "logo.svg"), svg({ cheio: false, escala: 1 }));
console.log("Ícones gerados em public/icons");
