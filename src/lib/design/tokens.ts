// Tokens de design. Espelham as variáveis CSS de src/app/globals.css.
export const cores = {
  bg0: "#030B1F",
  bg1: "#061A4A",
  bg2: "#0A3A9C",
  primario: "#1F6BFF",
  primarioHover: "#3A80FF",
  primarioPress: "#1555D6",
  realce: "#4DB8FF",
  texto: "#FFFFFF",
  texto2: "#B8C7E6",
  texto3: "#8EA2CC",
  sucesso: "#2ECC71",
  aviso: "#F5C542",
  perigo: "#FF5A5F",
  sobreStatus: "#03102E",
} as const;

export const raios = {
  cartao: 24,
  campo: 16,
  sheet: 28,
  pilula: 9999,
} as const;

// Grade de 4 px.
export const espacos = [4, 8, 12, 16, 20, 24, 32, 40, 48] as const;

export const sombras = {
  cartao: "0 8px 24px rgba(0,0,0,0.35)",
  brilho: "0 0 24px rgba(31,107,255,0.45)",
} as const;

export const movimento = {
  easing: [0.22, 1, 0.36, 1] as [number, number, number, number],
  mola: { type: "spring", stiffness: 400, damping: 30 } as const,
  duracao: { curta: 0.15, media: 0.25, longa: 0.4 },
};

export const fonte = {
  minimo: 13,
} as const;
