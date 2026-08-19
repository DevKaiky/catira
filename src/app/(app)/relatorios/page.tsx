import Link from "next/link";
import { listarRelatorios } from "@/lib/queries/relatorios";
import { formatarData, formatarMoeda } from "@/lib/format";

const GRANULARIDADE_LABEL: Record<string, string> = {
  diario: "Diário",
  semanal: "Semanal",
  mensal: "Mensal",
  personalizado: "Personalizado",
};

export default async function RelatoriosPage() {
  const relatorios = await listarRelatorios();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Relatórios</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Análises de IA geradas sob demanda a partir das suas negociações.
          </p>
        </div>
        <Link
          href="/relatorios/novo"
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          + Gerar relatório
        </Link>
      </div>

      {relatorios.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/[.12] p-8 text-center text-sm text-zinc-500 dark:border-white/[.15] dark:text-zinc-400">
          Nenhum relatório gerado ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {relatorios.map((relatorio) => {
            const lucro = relatorio.metricas.resultado.lucro_bruto;
            return (
              <li key={relatorio.id}>
                <Link
                  href={`/relatorios/${relatorio.id}`}
                  className="block rounded-lg border border-black/[.08] p-4 transition-colors hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.04]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {GRANULARIDADE_LABEL[relatorio.granularidade] ?? relatorio.granularidade}
                      </span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        {formatarData(relatorio.periodo_inicio)} a {formatarData(relatorio.periodo_fim)}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        lucro > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : lucro < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-zinc-950 dark:text-zinc-50"
                      }`}
                    >
                      {formatarMoeda(lucro)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {relatorio.analise.resumo}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
