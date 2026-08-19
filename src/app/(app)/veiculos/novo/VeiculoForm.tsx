"use client";

import { useState, useTransition } from "react";
import type { AquisicaoRetroativaInput, NovoVeiculoInput, TipoVeiculo, Transmissao } from "@/types/database";
import { TIPO_VEICULO_LABEL } from "@/lib/format";

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-zinc-50";
const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

export type VeiculoFormValores = {
  tipo: TipoVeiculo;
  marca: string;
  modelo: string;
  versao: string;
  anoFabricacao: string;
  anoModelo: string;
  placa: string;
  cor: string;
  km: string;
  combustivel: string;
  transmissao: Transmissao | "";
  observacoes: string;
};

function valoresIniciaisPadrao(valoresIniciais?: NovoVeiculoInput): VeiculoFormValores {
  return {
    tipo: valoresIniciais?.tipo ?? "carro",
    marca: valoresIniciais?.marca ?? "",
    modelo: valoresIniciais?.modelo ?? "",
    versao: valoresIniciais?.versao ?? "",
    anoFabricacao: valoresIniciais?.ano_fabricacao ? String(valoresIniciais.ano_fabricacao) : "",
    anoModelo: valoresIniciais?.ano_modelo ? String(valoresIniciais.ano_modelo) : "",
    placa: valoresIniciais?.placa ?? "",
    cor: valoresIniciais?.cor ?? "",
    km: valoresIniciais?.km ? String(valoresIniciais.km) : "",
    combustivel: valoresIniciais?.combustivel ?? "",
    transmissao: valoresIniciais?.transmissao ?? "",
    observacoes: valoresIniciais?.observacoes ?? "",
  };
}

export default function VeiculoForm({
  valoresIniciais,
  mostrarAquisicao = true,
  textoBotao = "Salvar",
  onSubmit,
  aoCancelar,
}: {
  valoresIniciais?: NovoVeiculoInput;
  mostrarAquisicao?: boolean;
  textoBotao?: string;
  onSubmit: (
    veiculo: NovoVeiculoInput,
    aquisicao: AquisicaoRetroativaInput | null
  ) => Promise<{ error: string | null }>;
  aoCancelar: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [valores, setValores] = useState<VeiculoFormValores>(valoresIniciaisPadrao(valoresIniciais));

  const [registrarAquisicao, setRegistrarAquisicao] = useState(false);
  const [aquisicaoValor, setAquisicaoValor] = useState("");
  const [aquisicaoData, setAquisicaoData] = useState(hoje());
  const [aquisicaoContraparte, setAquisicaoContraparte] = useState("");

  function atualizar(patch: Partial<VeiculoFormValores>) {
    setValores((atual) => ({ ...atual, ...patch }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const veiculo: NovoVeiculoInput = {
      tipo: valores.tipo,
      marca: valores.marca,
      modelo: valores.modelo,
      versao: valores.versao || undefined,
      ano_fabricacao: valores.anoFabricacao ? Number(valores.anoFabricacao) : undefined,
      ano_modelo: valores.anoModelo ? Number(valores.anoModelo) : undefined,
      placa: valores.placa || undefined,
      cor: valores.cor || undefined,
      km: valores.km ? Number(valores.km) : undefined,
      combustivel: valores.combustivel || undefined,
      transmissao: valores.transmissao || undefined,
      observacoes: valores.observacoes || undefined,
    };

    const aquisicao: AquisicaoRetroativaInput | null =
      mostrarAquisicao && registrarAquisicao
        ? {
            valor: Number(aquisicaoValor) || 0,
            data: aquisicaoData,
            contraparte_nome: aquisicaoContraparte || undefined,
          }
        : null;

    startTransition(async () => {
      const result = await onSubmit(veiculo, aquisicao);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className={labelClass}>Tipo</label>
          <select
            className={inputClass}
            value={valores.tipo}
            onChange={(e) => atualizar({ tipo: e.target.value as TipoVeiculo })}
          >
            {Object.entries(TIPO_VEICULO_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Marca</label>
          <input
            className={inputClass}
            value={valores.marca}
            onChange={(e) => atualizar({ marca: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Modelo</label>
          <input
            className={inputClass}
            value={valores.modelo}
            onChange={(e) => atualizar({ modelo: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Versão</label>
          <input
            className={inputClass}
            value={valores.versao}
            onChange={(e) => atualizar({ versao: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Ano fabricação</label>
          <input
            type="number"
            className={inputClass}
            value={valores.anoFabricacao}
            onChange={(e) => atualizar({ anoFabricacao: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Ano modelo</label>
          <input
            type="number"
            className={inputClass}
            value={valores.anoModelo}
            onChange={(e) => atualizar({ anoModelo: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Placa</label>
          <input
            className={inputClass}
            value={valores.placa}
            onChange={(e) => atualizar({ placa: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Cor</label>
          <input
            className={inputClass}
            value={valores.cor}
            onChange={(e) => atualizar({ cor: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>KM</label>
          <input
            type="number"
            className={inputClass}
            value={valores.km}
            onChange={(e) => atualizar({ km: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Combustível</label>
          <input
            className={inputClass}
            value={valores.combustivel}
            onChange={(e) => atualizar({ combustivel: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Transmissão</label>
          <select
            className={inputClass}
            value={valores.transmissao}
            onChange={(e) => atualizar({ transmissao: e.target.value as Transmissao | "" })}
          >
            <option value="">Não informado</option>
            <option value="manual">Manual</option>
            <option value="automatico">Automático</option>
            <option value="cvt">CVT</option>
          </select>
        </div>
      </section>

      <div className="space-y-1">
        <label className={labelClass}>Observações</label>
        <textarea
          className={inputClass}
          rows={2}
          value={valores.observacoes}
          onChange={(e) => atualizar({ observacoes: e.target.value })}
        />
      </div>

      {mostrarAquisicao && (
        <section className="space-y-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
            <input
              type="checkbox"
              checked={registrarAquisicao}
              onChange={(e) => setRegistrarAquisicao(e.target.checked)}
            />
            Registrar valor de aquisição (opcional)
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sem valor de aquisição, o sistema não consegue calcular o lucro deste veículo quando ele
            for vendido.
          </p>

          {registrarAquisicao && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className={labelClass}>Valor pago (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={aquisicaoValor}
                  onChange={(e) => setAquisicaoValor(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Data</label>
                <input
                  type="date"
                  className={inputClass}
                  value={aquisicaoData}
                  onChange={(e) => setAquisicaoData(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Contraparte</label>
                <input
                  className={inputClass}
                  value={aquisicaoContraparte}
                  onChange={(e) => setAquisicaoContraparte(e.target.value)}
                  placeholder="Estoque inicial"
                />
              </div>
            </div>
          )}
        </section>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {pending ? "Salvando..." : textoBotao}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          className="rounded-md border border-black/[.08] px-4 py-2 text-sm hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
