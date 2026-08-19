"use client";

import { useTransition } from "react";
import Link from "next/link";
import { excluirDespesa, excluirVeiculo } from "./actions";

export function ExcluirDespesaButton({ id, veiculoId }: { id: string; veiculoId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Remover esta despesa?")) return;
    startTransition(async () => {
      await excluirDespesa(id, veiculoId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-sm text-red-600 hover:underline disabled:opacity-60 dark:text-red-400"
    >
      Remover
    </button>
  );
}

export function VeiculoAcoes({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleExcluir() {
    if (
      !confirm(
        "Excluir este veículo? Só é possível se ele não estiver vinculado a nenhuma negociação."
      )
    )
      return;
    startTransition(async () => {
      const result = await excluirVeiculo(id);
      if (result?.error) {
        alert(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/veiculos/${id}/editar`}
        className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
      >
        Editar
      </Link>
      <button
        type="button"
        onClick={handleExcluir}
        disabled={pending}
        className="text-sm text-red-600 hover:underline disabled:opacity-60 dark:text-red-400"
      >
        {pending ? "Excluindo..." : "Excluir"}
      </button>
    </div>
  );
}
