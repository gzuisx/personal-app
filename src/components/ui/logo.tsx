import { useId } from "react";

/** Marca original: arco ascendente terminando em um ponto, em um quadrado arredondado azul. */
export function LogoMarca({ tamanho = 64 }: { tamanho?: number }) {
  const id = useId();
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 512 512" role="img" aria-label="Meu Personal">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3A80FF" />
          <stop offset="1" stopColor="#1555D6" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill={`url(#${id}-g)`} />
      <path
        d="M112 372 C 190 372 250 330 292 252 C 312 215 336 188 380 156"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="40"
        strokeLinecap="round"
      />
      <circle cx="388" cy="148" r="34" fill="#4DB8FF" />
    </svg>
  );
}

export function Logo({ tamanho = 64, comTexto = true }: { tamanho?: number; comTexto?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMarca tamanho={tamanho} />
      {comTexto && <span className="text-[26px] leading-8 font-semibold tracking-tight">Meu Personal</span>}
    </div>
  );
}
