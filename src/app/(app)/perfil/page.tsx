"use client";

import { RotinaCard } from "@/components/features/rotina-card";
import { useEffect, useState } from "react";
import { Download, LogOut, Minus, Plus, Shield, Trash2 } from "lucide-react";
import { useDados } from "@/components/dados-provider";
import { usePreferencias, type Tema } from "@/components/providers";
import { Banner } from "@/components/ui/banner";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ChipGroup, ChipGroupMulti } from "@/components/ui/chip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EscalaDor } from "@/components/ui/escala-dor";
import { GlassCard } from "@/components/ui/glass-card";
import { Header } from "@/components/ui/header";
import { SkeletonTela } from "@/components/ui/skeleton";
import { ToggleSimNao } from "@/components/ui/toggle-sim-nao";
import { useToast } from "@/components/ui/toast";
import { ultimoCheckin } from "@/lib/derivados";
import type { ConfigSeguranca } from "@/lib/safety";
import { SEGURANCA_PADRAO } from "@/lib/safety";
import { dataISO } from "@/lib/tempo";
import { FOCOS, type Perfil, type Restricao } from "@/lib/tipos";
import { createClient } from "@/lib/supabase/client";

const campo =
  "h-12 w-full rounded-[16px] border border-borda bg-vidro-forte px-4 text-[0.9375rem] text-texto outline-none placeholder:text-texto3 focus:border-realce";

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="t-rotulo text-texto2">{rotulo}</span>
      {children}
    </label>
  );
}

const num = (v: string) => {
  const n = Number(v.replace(",", "."));
  return v.trim() === "" || Number.isNaN(n) ? null : n;
};

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Stepper({
  rotulo,
  valor,
  min,
  max,
  onChange,
}: {
  rotulo: string;
  valor: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="t-corpo flex-1">{rotulo}</span>
      <Button
        variante="secundario"
        className="size-11 !min-w-11 !px-0"
        aria-label={`Diminuir ${rotulo}`}
        disabled={valor <= min}
        onClick={() => onChange(valor - 1)}
      >
        <Minus className="size-5" aria-hidden="true" />
      </Button>
      <span className="t-h2 num w-8 text-center">{valor}</span>
      <Button
        variante="secundario"
        className="size-11 !min-w-11 !px-0"
        aria-label={`Aumentar ${rotulo}`}
        disabled={valor >= max}
        onClick={() => onChange(valor + 1)}
      >
        <Plus className="size-5" aria-hidden="true" />
      </Button>
    </div>
  );
}

export default function PerfilPage() {
  const {
    status,
    erro,
    recarregar,
    dados,
    modo,
    demo,
    ativarDemo,
    apagarDemo,
    salvarPerfil,
    salvarSeguranca,
    exportar,
  } = useDados();
  const { tema, setTema, reduzirAnimacoes, setReduzirAnimacoes } = usePreferencias();
  const toast = useToast();

  const [email, setEmail] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", idade: "", peso: "", altura: "", posicao: "" });
  const [regras, setRegras] = useState<ConfigSeguranca>(SEGURANCA_PADRAO);
  const [confirmarRegras, setConfirmarRegras] = useState(false);
  const [novaAberta, setNovaAberta] = useState(false);
  const [nova, setNova] = useState<Omit<Restricao, "id">>({
    regiao: "",
    lado: "não se aplica",
    tipo: "ponto fraco",
    nivelDor: 0,
    status: "Em avaliação",
  });

  const pronto = status === "pronto";

  useEffect(() => {
    if (!pronto) return;
    const p = dados.perfil;
    setForm({
      nome: p.nome,
      idade: p.idade?.toString() ?? "",
      peso: p.peso?.toString() ?? "",
      altura: p.altura?.toString() ?? "",
      posicao: p.posicao,
    });
    setRegras(dados.seguranca);
    // só ao carregar: edições locais não devem ser sobrescritas a cada gravação
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);

  useEffect(() => {
    if (modo !== "supabase") return;
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
  }, [modo]);

  if (status === "carregando") {
    return (
      <main className="pagina">
        <SkeletonTela />
      </main>
    );
  }
  if (status === "erro") {
    return (
      <main className="pagina">
        <Banner variante="alerta">{erro ?? "Não deu para carregar."}</Banner>
        <Button className="mt-4" onClick={recarregar}>
          Tentar de novo
        </Button>
      </main>
    );
  }

  const perfil = dados.perfil;
  const hoje = dataISO(new Date());
  const dorAtual = ultimoCheckin(dados.checkins, hoje)?.dor ?? null;

  async function salvarDados() {
    try {
      await salvarPerfil({
        ...perfil,
        nome: form.nome.trim() || perfil.nome,
        idade: num(form.idade),
        peso: num(form.peso),
        altura: num(form.altura),
        posicao: form.posicao.trim() || perfil.posicao,
      });
      toast.mostrar("Dados salvos");
    } catch {
      toast.mostrar("Não foi possível salvar. Tente de novo.", "erro");
    }
  }

  async function atualizarPerfil(p: Perfil) {
    try {
      await salvarPerfil(p);
    } catch {
      toast.mostrar("Não foi possível salvar. Tente de novo.", "erro");
    }
  }

  async function confirmarSalvarRegras() {
    setConfirmarRegras(false);
    try {
      await salvarSeguranca(regras);
      toast.mostrar("Regras de segurança salvas");
    } catch {
      toast.mostrar("Não foi possível salvar. Tente de novo.", "erro");
    }
  }

  async function adicionarRestricao() {
    if (!nova.regiao.trim()) {
      toast.mostrar("Informe a região.", "aviso");
      return;
    }
    await atualizarPerfil({
      ...perfil,
      restricoes: [...perfil.restricoes, { ...nova, regiao: nova.regiao.trim(), id: `r-${Date.now()}` }],
    });
    setNovaAberta(false);
    setNova({ regiao: "", lado: "não se aplica", tipo: "ponto fraco", nivelDor: 0, status: "Em avaliação" });
    toast.mostrar("Restrição adicionada");
  }

  async function exportarJson() {
    try {
      const conteudo = JSON.stringify(await exportar(), null, 2);
      const url = URL.createObjectURL(new Blob([conteudo], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `meu-personal-${hoje}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.mostrar("Arquivo exportado");
    } catch {
      toast.mostrar("Não foi possível exportar.", "erro");
    }
  }

  const regrasMudaram = JSON.stringify(regras) !== JSON.stringify(dados.seguranca);
  const dadosMudaram =
    form.nome !== perfil.nome ||
    form.idade !== (perfil.idade?.toString() ?? "") ||
    form.peso !== (perfil.peso?.toString() ?? "") ||
    form.altura !== (perfil.altura?.toString() ?? "") ||
    form.posicao !== perfil.posicao;

  return (
    <main className="pagina space-y-4">
      <Header titulo="Perfil" />

      <GlassCard indice={0}>
        <div className="flex items-center gap-4">
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primario text-[1.375rem] font-semibold text-white"
            aria-hidden="true"
          >
            {iniciais(perfil.nome) || "?"}
          </div>
          <div className="min-w-0">
            <p className="t-h2 truncate">{perfil.nome}</p>
            <p className="t-corpo truncate text-texto2">
              {modo === "local" ? "Modo local" : (email ?? "Conectado")}
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard indice={1} titulo="Meus dados">
        <div className="space-y-3">
          <Campo rotulo="Nome">
            <input
              className={campo}
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </Campo>
          <div className="grid grid-cols-3 gap-3">
            <Campo rotulo="Idade">
              <input
                className={campo}
                inputMode="numeric"
                value={form.idade}
                onChange={(e) => setForm({ ...form, idade: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Peso (kg)">
              <input
                className={campo}
                inputMode="decimal"
                value={form.peso}
                onChange={(e) => setForm({ ...form, peso: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Altura (cm)">
              <input
                className={campo}
                inputMode="numeric"
                placeholder="—"
                value={form.altura}
                onChange={(e) => setForm({ ...form, altura: e.target.value })}
              />
            </Campo>
          </div>
          <Campo rotulo="Posição">
            <input
              className={campo}
              value={form.posicao}
              onChange={(e) => setForm({ ...form, posicao: e.target.value })}
            />
          </Campo>
          <Button className="w-full" disabled={!dadosMudaram} onClick={salvarDados}>
            Salvar dados
          </Button>
        </div>
      </GlassCard>

      <GlassCard indice={2} titulo="Focos atuais">
        <ChipGroupMulti
          rotuloAria="Focos atuais"
          opcoes={FOCOS.map((f) => ({ valor: f as string, rotulo: f }))}
          valores={perfil.focos}
          onChange={(focos) =>
            atualizarPerfil({
              ...perfil,
              focos,
              prioridade: focos.includes(perfil.prioridade) ? perfil.prioridade : (focos[0] ?? ""),
            })
          }
        />
        {perfil.focos.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="t-rotulo text-texto2">Prioridade 1</p>
            <ChipGroup
              rotuloAria="Prioridade 1"
              opcoes={perfil.focos.map((f) => ({ valor: f, rotulo: f }))}
              valor={perfil.prioridade}
              onChange={(prioridade) => atualizarPerfil({ ...perfil, prioridade })}
            />
          </div>
        )}
      </GlassCard>

      <GlassCard indice={3} titulo="Restrições">
        <ul className="space-y-3">
          {perfil.restricoes.map((r) => {
            const principal = r.id === "tornozelo-direito";
            const dor = principal ? dorAtual : r.nivelDor;
            return (
              <li key={r.id} className="rounded-2xl border border-borda bg-vidro p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="t-h3">{r.regiao}</p>
                    <p className="t-pq text-texto2">
                      {r.tipo} · lado {r.lado}
                    </p>
                    <p className="t-corpo mt-1 text-texto2">{r.status}</p>
                    <p className="t-pq mt-1 text-texto2">
                      Dor atual: {dor === null ? "sem registro" : `${dor} de 10`}
                    </p>
                  </div>
                  {!principal && (
                    <button
                      type="button"
                      aria-label={`Remover restrição ${r.regiao}`}
                      onClick={() =>
                        atualizarPerfil({
                          ...perfil,
                          restricoes: perfil.restricoes.filter((x) => x.id !== r.id),
                        })
                      }
                      className="-m-1 flex size-11 shrink-0 items-center justify-center rounded-full text-texto2"
                    >
                      <Trash2 className="size-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <Button
          variante="secundario"
          className="mt-3 w-full"
          icone={<Plus className="size-5" />}
          onClick={() => setNovaAberta(true)}
        >
          Adicionar restrição
        </Button>
      </GlassCard>

      <GlassCard
        indice={4}
        titulo="Regras de segurança"
        acao={<Shield className="size-6 text-realce-t" aria-hidden="true" />}
      >
        <p className="t-corpo mb-4 text-texto2">
          Definem quando o app bloqueia o aumento de carga para proteger o tornozelo.
        </p>
        <div className="space-y-4">
          <Stepper
            rotulo="Dor que bloqueia"
            valor={regras.limiteBloqueio}
            min={1}
            max={10}
            onChange={(v) =>
              setRegras({ ...regras, limiteBloqueio: v, limiteAtencao: Math.min(regras.limiteAtencao, v) })
            }
          />
          <Stepper
            rotulo="Dor de atenção"
            valor={regras.limiteAtencao}
            min={1}
            max={regras.limiteBloqueio}
            onChange={(v) => setRegras({ ...regras, limiteAtencao: v })}
          />
          <div className="space-y-2">
            <p className="t-corpo">Inchaço bloqueia</p>
            <ToggleSimNao
              rotuloAria="Inchaço bloqueia"
              valor={regras.inchacoBloqueia}
              onChange={(v) => setRegras({ ...regras, inchacoBloqueia: v })}
            />
          </div>
          <div className="space-y-2">
            <p className="t-corpo">“Falhou” bloqueia</p>
            <ToggleSimNao
              rotuloAria="Falhou bloqueia"
              valor={regras.falhouBloqueia}
              onChange={(v) => setRegras({ ...regras, falhouBloqueia: v })}
            />
          </div>
          <Button className="w-full" disabled={!regrasMudaram} onClick={() => setConfirmarRegras(true)}>
            Salvar regras
          </Button>
          {regrasMudaram && (
            <Button variante="fantasma" className="w-full" onClick={() => setRegras(dados.seguranca)}>
              Descartar mudanças
            </Button>
          )}
        </div>
      </GlassCard>

      <RotinaCard indice={4} />

      <GlassCard indice={5} titulo="Aparência">
        <div className="space-y-4">
          <div>
            <p className="t-rotulo mb-2 text-texto2">Tema</p>
            <ChipGroup<Tema>
              rotuloAria="Tema"
              valor={tema}
              onChange={setTema}
              opcoes={[
                { valor: "escuro", rotulo: "Escuro" },
                { valor: "claro", rotulo: "Claro" },
                { valor: "auto", rotulo: "Automático" },
              ]}
            />
          </div>
          <div>
            <p className="t-rotulo mb-2 text-texto2">Reduzir animações</p>
            <ToggleSimNao
              rotuloAria="Reduzir animações"
              valor={reduzirAnimacoes}
              onChange={setReduzirAnimacoes}
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard indice={5} titulo="Modo demonstração">
        <p className="t-corpo text-texto2">
          Carrega 30 dias de dados fictícios para você ver os gráficos, o coach e os insights funcionando. Os
          dados de exemplo ficam só neste aparelho e nunca se misturam com os seus dados reais.
        </p>
        {demo ? (
          <Button variante="perigo" className="mt-3 w-full" onClick={apagarDemo}>
            Apagar dados de exemplo
          </Button>
        ) : (
          <Button variante="secundario" className="mt-3 w-full" onClick={ativarDemo}>
            Carregar dados de exemplo
          </Button>
        )}
      </GlassCard>

      <GlassCard indice={6} titulo="Dados">
        <div className="space-y-3">
          <Button
            variante="secundario"
            className="w-full"
            icone={<Download className="size-5" />}
            onClick={exportarJson}
          >
            Exportar meus dados (JSON)
          </Button>
          {modo === "supabase" && (
            <form action="/auth/sair" method="post">
              <Button
                type="submit"
                variante="secundario"
                className="w-full"
                icone={<LogOut className="size-5" />}
              >
                Sair
              </Button>
            </form>
          )}
        </div>
      </GlassCard>

      <p className="t-pq px-1 text-texto2">
        Este app não substitui avaliação de ortopedista ou fisioterapeuta.
      </p>

      <ConfirmDialog
        aberto={confirmarRegras}
        titulo="Mudar as regras de segurança?"
        texto="Tem certeza? Isso muda quando o app protege seu tornozelo."
        confirmarRotulo="Sim, salvar"
        onConfirmar={confirmarSalvarRegras}
        onCancelar={() => setConfirmarRegras(false)}
      />

      <BottomSheet
        aberto={novaAberta}
        onFechar={() => setNovaAberta(false)}
        titulo="Adicionar restrição"
        rodape={
          <Button tamanho="g" className="w-full" onClick={adicionarRestricao}>
            Salvar restrição
          </Button>
        }
      >
        <Campo rotulo="Região do corpo">
          <input
            className={campo}
            placeholder="Ex.: Joelho, Posterior de coxa"
            value={nova.regiao}
            onChange={(e) => setNova({ ...nova, regiao: e.target.value })}
          />
        </Campo>
        <section className="space-y-2">
          <h3 className="t-h3">Lado</h3>
          <ChipGroup
            rotuloAria="Lado"
            valor={nova.lado}
            onChange={(lado) => setNova({ ...nova, lado })}
            opcoes={(["direito", "esquerdo", "ambos", "não se aplica"] as const).map((l) => ({
              valor: l,
              rotulo: l,
            }))}
          />
        </section>
        <section className="space-y-2">
          <h3 className="t-h3">Tipo</h3>
          <ChipGroup
            rotuloAria="Tipo"
            valor={nova.tipo}
            onChange={(tipo) => setNova({ ...nova, tipo })}
            opcoes={(["lesão", "ponto fraco"] as const).map((t) => ({ valor: t, rotulo: t }))}
          />
        </section>
        <section className="space-y-2">
          <h3 className="t-h3">Nível de dor</h3>
          <EscalaDor valor={nova.nivelDor} onChange={(nivelDor) => setNova({ ...nova, nivelDor })} />
        </section>
        <section className="space-y-2">
          <h3 className="t-h3">Status</h3>
          <ChipGroup
            rotuloAria="Status"
            valor={nova.status}
            onChange={(status) => setNova({ ...nova, status })}
            opcoes={["Em avaliação", "Em recuperação", "Estável"].map((s) => ({ valor: s, rotulo: s }))}
          />
        </section>
      </BottomSheet>
    </main>
  );
}
