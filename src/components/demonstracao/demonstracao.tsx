"use client";

// Demonstração animada de um exercício: 30 s com o movimento completo repetido em ritmo real,
// pausar/continuar e, com "Reduzir animações", as poses-chave paradas e um botão para tocar.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { usePreferencias } from "@/components/providers";
import { BonecoQuadro } from "@/components/demonstracao/boneco";
import { DURACAO_DEMO_S, enquadramento, quadroNoInstante, ritmo } from "@/lib/demonstracao/cena";
import { calcularEsqueleto } from "@/lib/demonstracao/esqueleto";
import { demonstracaoDe } from "@/lib/demonstracao";
import { cn } from "@/lib/cn";

type Estado = "parado" | "tocando" | "pausado" | "fim";

export function Demonstracao({
  slug,
  nome,
  compacta = false,
  className,
}: {
  slug: string;
  nome: string;
  /** sem a barra de progresso e o texto de regiões (uso dentro do treino) */
  compacta?: boolean;
  className?: string;
}) {
  const { semMovimento } = usePreferencias();
  const info = useMemo(() => demonstracaoDe(slug), [slug]);
  const demo = info.demo;
  const caixa = useMemo(() => enquadramento(demo), [demo]);
  const r = useMemo(() => ritmo(demo), [demo]);

  const [estado, setEstado] = useState<Estado>("parado");
  const [t, setT] = useState(0);
  const inicio = useRef<number | null>(null);
  const acumulado = useRef(0);
  const raf = useRef<number | null>(null);

  // sem "Reduzir animações" a demonstração começa sozinha
  useEffect(() => {
    setEstado(semMovimento ? "parado" : "tocando");
    acumulado.current = 0;
    setT(0);
  }, [semMovimento, slug]);

  const parar = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    inicio.current = null;
  }, []);

  useEffect(() => {
    if (estado !== "tocando") {
      parar();
      return;
    }
    const passo = (agora: number) => {
      if (inicio.current === null) inicio.current = agora - acumulado.current * 1000;
      const s = (agora - inicio.current) / 1000;
      if (s >= DURACAO_DEMO_S) {
        acumulado.current = DURACAO_DEMO_S;
        setT(DURACAO_DEMO_S);
        setEstado("fim");
        return;
      }
      acumulado.current = s;
      setT(s);
      raf.current = requestAnimationFrame(passo);
    };
    raf.current = requestAnimationFrame(passo);
    return parar;
  }, [estado, parar]);

  const tocar = () => {
    if (estado === "fim" || estado === "parado") {
      acumulado.current = 0;
      setT(0);
    }
    setEstado("tocando");
  };

  const instante = r.instanteDoCiclo(t);
  const quadro = quadroNoInstante(demo, estado === "fim" ? 0 : instante);
  // o brilho acompanha o esforço da pose e "respira" de leve
  const pulso = Math.min(1, (quadro.esforco ?? 0) * 0.85 + 0.15 * (0.5 + 0.5 * Math.sin(t * 4)));
  const mostrarPoses = semMovimento && estado === "parado";
  const titulo = `Demonstração: ${nome}`;

  return (
    <figure className={cn("space-y-2", className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-borda bg-vidro">
        {mostrarPoses ? (
          <div className="grid h-full grid-cols-2 gap-1 p-2" aria-label={`Poses-chave: ${nome}`} role="group">
            {demo.poses.slice(0, 4).map((p, i) => (
              <div key={i} className="relative rounded-xl bg-vidro-forte">
                <BonecoQuadro
                  demo={demo}
                  caixa={caixa}
                  pulso={p.esforco ?? 0.6}
                  titulo={`Pose ${i + 1} de ${Math.min(4, demo.poses.length)}`}
                  quadro={{
                    pose: p,
                    esqueleto: calcularEsqueleto(p, demo.vista),
                    esforco: p.esforco ?? 0,
                    bola: p.bola ? { x: p.bola[0], y: p.bola[1] } : null,
                  }}
                />
                <span className="t-pq absolute left-2 top-1 text-texto2">{i + 1}</span>
              </div>
            ))}
          </div>
        ) : (
          <BonecoQuadro demo={demo} quadro={quadro} caixa={caixa} pulso={pulso} titulo={titulo} />
        )}
        <div className="absolute bottom-2 right-2 flex gap-2">
          {estado === "tocando" ? (
            <button
              type="button"
              onClick={() => setEstado("pausado")}
              aria-label="Pausar demonstração"
              className="flex size-12 items-center justify-center rounded-full bg-primario text-white shadow"
            >
              <Pause className="size-5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={tocar}
              aria-label={
                estado === "pausado"
                  ? "Continuar demonstração"
                  : estado === "fim"
                    ? "Ver de novo"
                    : "Tocar demonstração"
              }
              className="flex h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-primario px-4 text-[0.9375rem] font-semibold text-white shadow"
            >
              {estado === "fim" ? (
                <RotateCcw className="size-5" aria-hidden="true" />
              ) : (
                <Play className="size-5" aria-hidden="true" />
              )}
              <span>{estado === "pausado" ? "Continuar" : estado === "fim" ? "De novo" : "Tocar"}</span>
            </button>
          )}
        </div>
        {!compacta && (
          <span className="t-pq absolute left-3 top-2 rounded-full bg-vidro-forte px-2 py-0.5 text-texto2">
            {demo.vista === "lado" ? "De lado" : "De frente"}
            {info.modelo ? " · modelo" : ""}
          </span>
        )}
      </div>
      {!compacta && (
        <figcaption className="space-y-1">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-vidro-forte"
            role="progressbar"
            aria-label="Tempo da demonstração"
            aria-valuemin={0}
            aria-valuemax={DURACAO_DEMO_S}
            aria-valuenow={Math.round(t)}
          >
            <div className="h-full bg-realce" style={{ width: `${(t / DURACAO_DEMO_S) * 100}%` }} />
          </div>
          <p className="t-pq flex justify-between text-texto2">
            <span>
              Repetição {r.repeticaoAtual(t)} de {r.reps}
            </span>
            <span className="num">
              {Math.round(t)} / {DURACAO_DEMO_S} s
            </span>
          </p>
        </figcaption>
      )}
    </figure>
  );
}
