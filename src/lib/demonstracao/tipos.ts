import type { RegiaoCorpo } from "../seed/catalogo-detalhes";
import type { Junta, Pose, Vista } from "./esqueleto";

/** Objetos de cena (aparelhos e apoios). Coordenadas no mesmo sistema das poses (chão em y = 0). */
export type Prop =
  /** degrau, banco, caixa, almofada, máquina: retângulo apoiado em y */
  | { tipo: "caixa"; x: number; y: number; w: number; h: number; rotulo?: string }
  | { tipo: "parede"; x: number }
  /** elástico ou cabo da polia: da junta até um ponto fixo */
  | { tipo: "cabo"; de: Junta; para: [number, number] | Junta }
  | { tipo: "halter"; junta: Junta }
  /** barra presa às duas mãos (de lado aparece como a anilha) */
  | { tipo: "barra"; juntas: [Junta, Junta] }
  /** bola: presa a uma junta, parada num ponto ou seguindo a pose (campo "bola" da pose) */
  | { tipo: "bola"; junta?: Junta; pos?: [number, number]; r?: number; medicinal?: boolean }
  | { tipo: "cone"; x: number }
  /** rolo da máquina (flexora/extensora) preso a uma junta */
  | { tipo: "rolo"; junta: Junta };

export type Demo = {
  /** slug do exercício, ou "modelo:<nome>" para modelos de categoria */
  id: string;
  vista: Vista;
  /** poses-chave de UMA repetição; o ciclo se repete por 30 s */
  poses: Pose[];
  /** regiões que brilham durante o movimento */
  destaque: RegiaoCorpo[];
  /** lado que trabalha (exercícios unilaterais); padrão: os dois */
  lado?: "D" | "E" | "ambos";
  props?: Prop[];
};
