"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarNegociacao } from "./actions";
import type {
  ItemNegociacaoInput,
  StatusNegociacao,
  TipoNegociacao,
  TipoVeiculo,
  Transmissao,
  Veiculo,
} from "@/types/database";
import { TIPO_VEICULO_LABEL } from "@/lib/format";

interface EntradaItemState {
  localId: string;
  direcao: "entrada";
  valorAtribuido: string;
  condicao: string;
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
}

interface SaidaItemState {
  localId: string;
  direcao: "saida";
  valorAtribuido: string;
  condicao: string;
  veiculoId: string;
}

type ItemState = EntradaItemState | SaidaItemState;

function novoItemEntrada(): EntradaItemState {
  return {
    localId: crypto.randomUUID(),
    direcao: "entrada",
    valorAtribuido: "",
    condicao: "",
    tipo: "carro",
    marca: "",
    modelo: "",
    versao: "",
    anoFabricacao: "",
    anoModelo: "",
    placa: "",
    cor: "",
    km: "",
    combustivel: "",
    transmissao: "",
    observacoes: "",
  };
}

function novoItemSaida(veiculoId = ""): SaidaItemState {
  return {
    localId: crypto.randomUUID(),
    direcao: "saida",
    valorAtribuido: "",
    condicao: "",
    veiculoId,
  };
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-zinc-50";
const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function NegociacaoForm({ veiculosEmEstoque }: { veiculosEmEstoque: Veiculo[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<TipoNegociacao>("troca");
  const [dataNegociacao, setDataNegociacao] = useState(hoje());
  const [contraparteNome, setContraparteNome] = useState("");
  const [contraparteContato, setContraparteContato] = useState("");
  const [voltaDirecao, setVoltaDirecao] = useState<"nenhuma" | "recebi" | "paguei">("nenhuma");
  const [voltaValor, setVoltaValor] = useState("");
  const [status, setStatus] = useState<StatusNegociacao>("concluida");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemState[]>([]);

  const veiculosJaUsados = new Set(
    itens.filter((i): i is SaidaItemState => i.direcao === "saida").map((i) => i.veiculoId)
  );

  function atualizarItem(localId: string, patch: Partial<ItemState>) {
    setItens((atual) =>
      atual.map((item) =>
        item.localId === localId ? ({ ...item, ...patch } as ItemState) : item
      )
    );
  }

  function removerItem(localId: string) {
    setItens((atual) => atual.filter((item) => item.localId !== localId));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const itensPayload: ItemNegociacaoInput[] = [];

    for (const item of itens) {
      const valor = Number(item.valorAtribuido);
      if (item.direcao === "entrada") {
        itensPayload.push({
          direcao: "entrada",
          valor_atribuido: valor,
          condicao_na_negociacao: item.condicao || undefined,
          veiculo: {
            tipo: item.tipo,
            marca: item.marca,
            modelo: item.modelo,
            versao: item.versao || undefined,
            ano_fabricacao: item.anoFabricacao ? Number(item.anoFabricacao) : undefined,
            ano_modelo: item.anoModelo ? Number(item.anoModelo) : undefined,
            placa: item.placa || undefined,
            cor: item.cor || undefined,
            km: item.km ? Number(item.km) : undefined,
            combustivel: item.combustivel || undefined,
            transmissao: item.transmissao || undefined,
            observacoes: item.observacoes || undefined,
          },
        });
      } else {
        itensPayload.push({
          direcao: "saida",
          valor_atribuido: valor,
          condicao_na_negociacao: item.condicao || undefined,
          veiculo_id: item.veiculoId,
        });
      }
    }

    const valorVolta =
      voltaDirecao === "nenhuma"
        ? 0
        : (voltaDirecao === "recebi" ? 1 : -1) * (Number(voltaValor) || 0);

    startTransition(async () => {
      const result = await criarNegociacao({
        tipo,
        data_negociacao: dataNegociacao,
        contraparte_nome: contraparteNome,
        contraparte_contato: contraparteContato,
        valor_volta: valorVolta,
        status,
        observacoes,
        itens: itensPayload,
      });

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

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={labelClass}>Tipo de negociação</label>
          <select
            className={inputClass}
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoNegociacao)}
          >
            <option value="compra">Compra</option>
            <option value="venda">Venda</option>
            <option value="troca">Troca</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Data</label>
          <input
            type="date"
            className={inputClass}
            value={dataNegociacao}
            onChange={(e) => setDataNegociacao(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Contraparte (nome)</label>
          <input
            className={inputClass}
            value={contraparteNome}
            onChange={(e) => setContraparteNome(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Contraparte (contato)</label>
          <input
            className={inputClass}
            value={contraparteContato}
            onChange={(e) => setContraparteContato(e.target.value)}
            placeholder="Telefone, opcional"
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Volta em dinheiro</label>
          <div className="flex gap-2">
            <select
              className={inputClass}
              value={voltaDirecao}
              onChange={(e) => setVoltaDirecao(e.target.value as typeof voltaDirecao)}
            >
              <option value="nenhuma">Sem volta</option>
              <option value="recebi">Recebi</option>
              <option value="paguei">Paguei</option>
            </select>
            {voltaDirecao !== "nenhuma" && (
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={voltaValor}
                onChange={(e) => setVoltaValor(e.target.value)}
                placeholder="0,00"
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Status</label>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusNegociacao)}
          >
            <option value="concluida">Concluída</option>
            <option value="pendente">Pendente</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </section>

      <div className="space-y-2">
        <label className={labelClass}>Observações</label>
        <textarea
          className={inputClass}
          rows={2}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Veículos</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setItens((atual) => [...atual, novoItemEntrada()])}
              className="rounded-md border border-black/[.08] px-3 py-1.5 text-sm hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
            >
              + Veículo de entrada
            </button>
            <button
              type="button"
              onClick={() => setItens((atual) => [...atual, novoItemSaida()])}
              className="rounded-md border border-black/[.08] px-3 py-1.5 text-sm hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
            >
              + Veículo de saída
            </button>
          </div>
        </div>

        {itens.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nenhum veículo adicionado ainda. Entrada = veículo que você está recebendo (compra ou
            troca). Saída = veículo do seu estoque que está saindo (venda ou dado em troca).
          </p>
        )}

        {itens.map((item, index) =>
          item.direcao === "entrada" ? (
            <div
              key={item.localId}
              className="space-y-4 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  #{index + 1} · Entrada (veículo novo no estoque)
                </span>
                <button
                  type="button"
                  onClick={() => removerItem(item.localId)}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Remover
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className={labelClass}>Tipo</label>
                  <select
                    className={inputClass}
                    value={item.tipo}
                    onChange={(e) =>
                      atualizarItem(item.localId, { tipo: e.target.value as TipoVeiculo })
                    }
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
                    value={item.marca}
                    onChange={(e) => atualizarItem(item.localId, { marca: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Modelo</label>
                  <input
                    className={inputClass}
                    value={item.modelo}
                    onChange={(e) => atualizarItem(item.localId, { modelo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Versão</label>
                  <input
                    className={inputClass}
                    value={item.versao}
                    onChange={(e) => atualizarItem(item.localId, { versao: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Ano fabricação</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={item.anoFabricacao}
                    onChange={(e) =>
                      atualizarItem(item.localId, { anoFabricacao: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Ano modelo</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={item.anoModelo}
                    onChange={(e) => atualizarItem(item.localId, { anoModelo: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Placa</label>
                  <input
                    className={inputClass}
                    value={item.placa}
                    onChange={(e) => atualizarItem(item.localId, { placa: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Cor</label>
                  <input
                    className={inputClass}
                    value={item.cor}
                    onChange={(e) => atualizarItem(item.localId, { cor: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>KM</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={item.km}
                    onChange={(e) => atualizarItem(item.localId, { km: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Combustível</label>
                  <input
                    className={inputClass}
                    value={item.combustivel}
                    onChange={(e) => atualizarItem(item.localId, { combustivel: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Transmissão</label>
                  <select
                    className={inputClass}
                    value={item.transmissao}
                    onChange={(e) =>
                      atualizarItem(item.localId, {
                        transmissao: e.target.value as Transmissao | "",
                      })
                    }
                  >
                    <option value="">Não informado</option>
                    <option value="manual">Manual</option>
                    <option value="automatico">Automático</option>
                    <option value="cvt">CVT</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Valor atribuído (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={item.valorAtribuido}
                    onChange={(e) =>
                      atualizarItem(item.localId, { valorAtribuido: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Condição / observações do veículo</label>
                <input
                  className={inputClass}
                  value={item.condicao}
                  onChange={(e) => atualizarItem(item.localId, { condicao: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div
              key={item.localId}
              className="space-y-4 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  #{index + 1} · Saída (veículo do estoque)
                </span>
                <button
                  type="button"
                  onClick={() => removerItem(item.localId)}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Remover
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className={labelClass}>Veículo em estoque</label>
                  <select
                    className={inputClass}
                    value={item.veiculoId}
                    onChange={(e) => atualizarItem(item.localId, { veiculoId: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {veiculosEmEstoque
                      .filter(
                        (v) => v.id === item.veiculoId || !veiculosJaUsados.has(v.id)
                      )
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {TIPO_VEICULO_LABEL[v.tipo]} · {v.marca} {v.modelo}
                          {v.placa ? ` · ${v.placa}` : ""}
                        </option>
                      ))}
                  </select>
                  {veiculosEmEstoque.length === 0 && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Nenhum veículo em estoque ainda. Registre uma compra primeiro.
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Valor atribuído (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inputClass}
                    value={item.valorAtribuido}
                    onChange={(e) =>
                      atualizarItem(item.localId, { valorAtribuido: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Condição / observações</label>
                <input
                  className={inputClass}
                  value={item.condicao}
                  onChange={(e) => atualizarItem(item.localId, { condicao: e.target.value })}
                />
              </div>
            </div>
          )
        )}
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {pending ? "Salvando..." : "Registrar negociação"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/negocios")}
          className="rounded-md border border-black/[.08] px-4 py-2 text-sm hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
