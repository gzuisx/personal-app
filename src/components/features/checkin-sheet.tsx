"use client";

import { useEffect, useState } from "react";
import { BatteryFull, BatteryLow, BatteryMedium } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { CheckAnimado } from "@/components/ui/check-animado";
import { ChipGroup } from "@/components/ui/chip";
import { EscalaDor } from "@/components/ui/escala-dor";
import { ToggleSimNao } from "@/components/ui/toggle-sim-nao";
import { useToast } from "@/components/ui/toast";
import { GATILHO_ROTULO, SONO_ROTULO, type Checkin, type Gatilho, type SonoFaixa } from "@/lib/tipos";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  /** data local (AAAA-MM-DD) do check-in */
  data: string;
  /** check-in já salvo no dia: abre preenchido e salvar atualiza */
  existente?: Checkin | null;
};

const icone = (n: number) => {
  const C = n <= 2 ? BatteryLow : n === 3 ? BatteryMedium : BatteryFull;
  return <C className="size-5" aria-hidden="true" />;
};

const energias = [1, 2, 3, 4, 5].map((n) => ({ valor: n, rotulo: String(n), icone: icone(n) }));
const sonos = (Object.keys(SONO_ROTULO) as SonoFaixa[]).map((k) => ({ valor: k, rotulo: SONO_ROTULO[k] }));
const gatilhos = (Object.keys(GATILHO_ROTULO) as Gatilho[]).map((k) => ({ valor: k, rotulo: GATILHO_ROTULO[k] }));

export function CheckinSheet({ aberto, onFechar, data, existente }: Props) {
  const { salvarCheckin } = useDados();
  const toast = useToast();
  const [dor, setDor] = useState<number | null>(null);
  const [inchaco, setInchaco] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [energia, setEnergia] = useState<number | null>(null);
  const [sono, setSono] = useState<SonoFaixa | null>(null);
  const [gatilho, setGatilho] = useState<Gatilho | null>(null);
  const [nota, setNota] = useState("");
  const [notaAberta, setNotaAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [semDor, setSemDor] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setDor(existente?.dor ?? null);
    setInchaco(existente?.inchaco ?? false);
    setFalhou(existente?.falhou ?? false);
    setEnergia(existente?.energia ?? null);
    setSono(existente?.sonoFaixa ?? null);
    setGatilho(existente?.gatilho ?? null);
    setNota(existente?.observacao ?? "");
    setNotaAberta(!!existente?.observacao);
    setSalvo(false);
    setSemDor(false);
  }, [aberto, existente]);

  async function salvar() {
    if (dor === null) {
      setSemDor(true);
      toast.mostrar("Escolha a dor de 0 a 10.", "aviso");
      return;
    }
    setSalvando(true);
    try {
      await salvarCheckin({
        data,
        dor,
        inchaco,
        falhou,
        energia,
        sonoFaixa: sono,
        gatilho: dor >= 1 ? gatilho : null,
        observacao: nota.trim() || null,
      });
      setSalvo(true);
      toast.mostrar("Check-in salvo");
      setTimeout(onFechar, 900);
    } catch {
      toast.mostrar("Não foi possível salvar. Tente de novo.", "erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <BottomSheet
      aberto={aberto}
      onFechar={onFechar}
      titulo="Check-in de hoje"
      rodape={
        <Button tamanho="g" className="w-full" carregando={salvando} disabled={salvo} onClick={salvar}>
          Salvar check-in
        </Button>
      }
    >
      {salvo ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <CheckAnimado />
          <p className="t-h2">Check-in salvo</p>
        </div>
      ) : (
        <>
          <section className="space-y-2">
            <h3 className="t-h3">Dor no tornozelo direito</h3>
            <EscalaDor valor={dor} onChange={(v) => { setDor(v); setSemDor(false); }} rotuloAria="Dor no tornozelo direito" />
            {semDor && (
              <p role="alert" className="t-pq text-perigo-t">
                Escolha um valor para salvar.
              </p>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="t-h3">Inchaço</h3>
            <ToggleSimNao valor={inchaco} onChange={setInchaco} rotuloAria="Inchaço" />
          </section>

          <section className="space-y-2">
            <h3 className="t-h3">Falhou (cedeu ou virou)</h3>
            <ToggleSimNao valor={falhou} onChange={setFalhou} rotuloAria="Falhou" />
          </section>

          <section className="space-y-2">
            <h3 className="t-h3">Energia</h3>
            <ChipGroup rotuloAria="Energia de 1 a 5" opcoes={energias} valor={energia} onChange={setEnergia} />
          </section>

          <section className="space-y-2">
            <h3 className="t-h3">Sono da última noite</h3>
            <ChipGroup rotuloAria="Sono" opcoes={sonos} valor={sono} onChange={setSono} />
          </section>

          {dor !== null && dor >= 1 && (
            <section className="space-y-2">
              <h3 className="t-h3">Gatilho da dor</h3>
              <ChipGroup rotuloAria="Gatilho da dor" opcoes={gatilhos} valor={gatilho} onChange={setGatilho} />
            </section>
          )}

          <section className="space-y-2">
            {notaAberta ? (
              <>
                <label htmlFor="nota-checkin" className="t-h3 block">
                  Observação
                </label>
                <textarea
                  id="nota-checkin"
                  value={nota}
                  maxLength={200}
                  rows={3}
                  onChange={(e) => setNota(e.target.value)}
                  className="w-full rounded-[16px] border border-borda bg-vidro-forte p-3 text-[15px] text-texto outline-none placeholder:text-texto3 focus:border-realce"
                  placeholder="Até 200 caracteres"
                />
              </>
            ) : (
              <Button variante="fantasma" onClick={() => setNotaAberta(true)}>
                Adicionar nota
              </Button>
            )}
          </section>
        </>
      )}
    </BottomSheet>
  );
}
