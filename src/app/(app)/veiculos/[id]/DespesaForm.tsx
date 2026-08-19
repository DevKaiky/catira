"use client";

import { useState, useTransition } from "react";
import type { CategoriaDespesa } from "@/types/database";
import { CATEGORIA_DESPESA_LABEL } from "@/lib/format";
import { criarDespesa } from "./actions";

const inputClass =
  "w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-zinc-50";
const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DespesaForm({ veiculoId }: { veiculoId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<CategoriaDespesa>("outro");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hoje());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await criarDespesa({
        veiculo_id: veiculoId,
        categoria,
        descricao,
        valor: Number(valor),
        data,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      setDescricao("");
      setValor("");
      setData(hoje());
      setCategoria("outro");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <label className={labelClass}>Categoria</label>
          <select
            className={inputClass}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as CategoriaDespesa)}
          >
            {Object.entries(CATEGORIA_DESPESA_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className={labelClass}>Descrição</label>
          <input
            className={inputClass}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Valor (R$)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className={inputClass}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Data</label>
          <input
            type="date"
            className={inputClass}
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-black/[.08] px-3 py-1.5 text-sm hover:bg-black/[.04] disabled:opacity-60 dark:border-white/[.145] dark:hover:bg-white/[.06]"
      >
        {pending ? "Adicionando..." : "+ Adicionar despesa"}
      </button>
    </form>
  );
}
