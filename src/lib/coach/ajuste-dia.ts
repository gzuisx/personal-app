// Escolha do Gabriel em "Ajustar treino" para um dia. Fica só neste aparelho (conveniência, não é dado clínico).
import type { Ajuste } from "../treino/motor";

export type EscolhaDoDia = { ajuste: Ajuste; minutos?: number };

const chave = (data: string) => `meu-personal:ajuste:${data}`;

export function lerEscolhaDoDia(data: string): EscolhaDoDia | null {
  try {
    const bruto = localStorage.getItem(chave(data));
    if (!bruto) return null;
    const v = JSON.parse(bruto) as EscolhaDoDia;
    return v && typeof v.ajuste === "string" ? v : null;
  } catch {
    return null;
  }
}

export function guardarEscolhaDoDia(data: string, escolha: EscolhaDoDia | null) {
  try {
    if (escolha) localStorage.setItem(chave(data), JSON.stringify(escolha));
    else localStorage.removeItem(chave(data));
    window.dispatchEvent(new Event("meu-personal:ajuste"));
  } catch {
    // sem armazenamento: a escolha vale só nesta tela
  }
}
