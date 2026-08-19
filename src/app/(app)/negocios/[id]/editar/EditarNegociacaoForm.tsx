"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editarNegociacao, excluirNegociacao } from "./actions";
import type { NegociacaoComVeiculos, StatusNegociacao, TipoNegociacao } from "@/types/database";
import { TIPO_VEICULO_LABEL } from "@/lib/format";

const inputClass =
  "w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-zinc-50";
const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

type ItemFormState = {
  id: string;
  direcao: "entrada" | "saida";
  descricao: string;
  valorAtribuido: string;
  condicao: string;
};

export default function EditarNegociacaoForm({
  negociacao,
}: {
  negociacao: NegociacaoComVeiculos;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [excluindo, startExclusao] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<TipoNegociacao>(negociacao.tipo);
  const [dataNegociacao, setDataNegociacao] = useState(negociacao.data_negociacao);
  const [contraparteNome, setContraparteNome] = useState(negociacao.contraparte_nome);
  const [contraparteContato, setContraparteContato] = useState(negociacao.contraparte_contato ?? "");
  const [voltaDirecao, setVoltaDirecao] = useState<"nenhuma" | "recebi" | "paguei">(
    negociacao.valor_volta > 0 ? "recebi" : negociacao.valor_volta < 0 ? "paguei" : "nenhuma"
  );
  const [voltaValor, setVoltaValor] = useState(
    negociacao.valor_volta !== 0 ? String(Math.abs(negociacao.valor_volta)) : ""
  );
  const [status, setStatus] = useState<StatusNegociacao>(
    negociacao.status === "cancelada" ? "concluida" : negociacao.status
  );
  const [observacoes, setObservacoes] = useState(negociacao.observacoes ?? "");
  const [itens, setItens] = useState<ItemFormState[]>(
    negociacao.itens.map((item) => ({
      id: item.id,
      direcao: item.direcao,
      descricao: `${TIPO_VEICULO_LABEL[item.veiculo.tipo]} · ${item.veiculo.marca} ${item.veiculo.modelo}${
        item.veiculo.placa ? ` · ${item.veiculo.placa}` : ""
      }`,
      valorAtribuido: String(item.valor_atribuido),
      condicao: item.condicao_na_negociacao ?? "",
    }))
  );

  function atualizarItem(id: string, patch: Partial<ItemFormState>) {
    setItens((atual) => atual.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const valorVolta =
      voltaDirecao === "nenhuma" ? 0 : (voltaDirecao === "recebi" ? 1 : -1) * (Number(voltaValor) || 0);

    startTransition(async () => {
      const result = await editarNegociacao({
        id: negociacao.id,
        tipo,
        data_negociacao: dataNegociacao,
        contraparte_nome: contraparteNome,
        contraparte_contato: contraparteContato,
        valor_volta: valorVolta,
        status,
        observacoes,
        itens: itens.map((item) => ({
          id: item.id,
          valor_atribuido: Number(item.valorAtribuido),
          condicao_na_negociacao: item.condicao || undefined,
        })),
      });

      if (result?.error) {
        setError(result.error);
      }
    });
  }

  function handleExcluir() {
    if (
      !confirm(
        "Excluir esta negociação? Veículos que saíram voltam ao estoque; veículos que entraram são apagados. Essa ação não pode ser desfeita."
      )
    ) {
      return;
    }

    setError(null);
    startExclusao(async () => {
      const result = await excluirNegociacao(negociacao.id);
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
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Veículos</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Para mudar quais veículos participaram, exclua esta negociação e registre de novo.
        </p>

        {itens.map((item, index) => (
          <div
            key={item.id}
            className="space-y-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
          >
            <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              #{index + 1} · {item.direcao === "entrada" ? "Entrada" : "Saída"} · {item.descricao}
            </span>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className={labelClass}>Valor atribuído (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={item.valorAtribuido}
                  onChange={(e) => atualizarItem(item.id, { valorAtribuido: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Condição / observações</label>
                <input
                  className={inputClass}
                  value={item.condicao}
                  onChange={(e) => atualizarItem(item.id, { condicao: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/negocios")}
          className="rounded-md border border-black/[.08] px-4 py-2 text-sm hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
        >
          Cancelar
        </button>
      </div>

      <section className="space-y-3 rounded-lg border border-red-200 p-4 dark:border-red-900">
        <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">Zona de perigo</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Excluir esta negociação reverte seus efeitos: veículos que saíram voltam ao estoque,
          veículos que entraram são apagados. Bloqueado se algum desses veículos já foi movimentado
          em outra negociação ou tem despesas registradas.
        </p>
        <button
          type="button"
          onClick={handleExcluir}
          disabled={excluindo}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          {excluindo ? "Excluindo..." : "Excluir negociação"}
        </button>
      </section>
    </form>
  );
}
