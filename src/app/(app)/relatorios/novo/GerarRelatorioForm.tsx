"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { gerarRelatorio } from "./actions";
import { hojeSaoPaulo, resolverPeriodo } from "@/lib/relatorios/periodo";
import { formatarData } from "@/lib/format";
import type { GranularidadeRelatorio } from "@/types/relatorios";

const CHIPS: { valor: GranularidadeRelatorio; label: string }[] = [
  { valor: "diario", label: "Diário" },
  { valor: "semanal", label: "Semanal" },
  { valor: "mensal", label: "Mensal" },
  { valor: "personalizado", label: "Personalizado" },
];

const inputClass =
  "w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-zinc-50";
const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function GerarRelatorioForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [granularidade, setGranularidade] = useState<GranularidadeRelatorio>("mensal");
  const [inicio, setInicio] = useState(hojeSaoPaulo());
  const [fim, setFim] = useState(hojeSaoPaulo());

  const resolvido = resolverPeriodo({
    granularidade,
    inicio: granularidade === "personalizado" ? inicio : undefined,
    fim: granularidade === "personalizado" ? fim : undefined,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await gerarRelatorio({
        granularidade,
        inicio: granularidade === "personalizado" ? inicio : undefined,
        fim: granularidade === "personalizado" ? fim : undefined,
      });

      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <label className={labelClass}>Período</label>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip.valor}
              type="button"
              onClick={() => setGranularidade(chip.valor)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                granularidade === chip.valor
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
                  : "border-black/[.08] text-zinc-700 hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-white/[.06]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {granularidade === "personalizado" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>Início</label>
            <input
              type="date"
              className={inputClass}
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Fim</label>
            <input
              type="date"
              className={inputClass}
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      <div className="rounded-md border border-black/[.08] px-4 py-3 text-sm dark:border-white/[.145]">
        {resolvido.ok ? (
          <span className="text-zinc-700 dark:text-zinc-300">
            Intervalo: {formatarData(resolvido.periodo.inicio)} a {formatarData(resolvido.periodo.fim)}
          </span>
        ) : (
          <span className="text-red-600 dark:text-red-400">{resolvido.error}</span>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending || !resolvido.ok}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {pending ? "Gerando análise... (pode levar alguns segundos)" : "Gerar relatório"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/relatorios")}
          className="rounded-md border border-black/[.08] px-4 py-2 text-sm hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-white/[.06]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
