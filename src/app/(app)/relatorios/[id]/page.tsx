import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarRelatorio } from "@/lib/queries/relatorios";
import MetricasCards from "@/components/relatorios/MetricasCards";
import AnalisePainel from "@/components/relatorios/AnalisePainel";
import { formatarData, formatarMoeda, TIPO_VEICULO_LABEL } from "@/lib/format";

const GRANULARIDADE_LABEL: Record<string, string> = {
  diario: "Diário",
  semanal: "Semanal",
  mensal: "Mensal",
  personalizado: "Personalizado",
};

export default async function RelatorioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const relatorio = await buscarRelatorio(id);

  if (!relatorio) {
    notFound();
  }

  const { metricas, analise } = relatorio;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              Relatório {GRANULARIDADE_LABEL[relatorio.granularidade] ?? relatorio.granularidade}
            </h1>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {relatorio.provedor} · {relatorio.modelo}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {formatarData(relatorio.periodo_inicio)} a {formatarData(relatorio.periodo_fim)} · gerado em{" "}
            {formatarData(relatorio.created_at.slice(0, 10))}
          </p>
        </div>
        <Link href="/relatorios" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
          ← Todos os relatórios
        </Link>
      </div>

      <div className="space-y-8">
        <MetricasCards metricas={metricas} />

        {metricas.resultado.veiculos.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Veículos realizados no período
            </h2>
            <div className="overflow-x-auto rounded-lg border border-black/[.08] dark:border-white/[.145]">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">Veículo</th>
                    <th className="px-3 py-2 font-medium">Aquisição</th>
                    <th className="px-3 py-2 font-medium">Despesas</th>
                    <th className="px-3 py-2 font-medium">Saída</th>
                    <th className="px-3 py-2 font-medium">Lucro</th>
                    <th className="px-3 py-2 font-medium">Margem</th>
                    <th className="px-3 py-2 font-medium">Dias em estoque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[.08] dark:divide-white/[.08]">
                  {metricas.resultado.veiculos.map((veiculo) => (
                    <tr key={veiculo.veiculo_id}>
                      <td className="px-3 py-2 text-zinc-950 dark:text-zinc-50">
                        {TIPO_VEICULO_LABEL[veiculo.tipo]} {veiculo.descricao}
                      </td>
                      <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                        {veiculo.valor_aquisicao !== null ? formatarMoeda(veiculo.valor_aquisicao) : "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                        {veiculo.despesas !== undefined ? formatarMoeda(veiculo.despesas) : "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                        {formatarMoeda(veiculo.valor_saida)}
                      </td>
                      <td
                        className={`px-3 py-2 font-medium ${
                          veiculo.lucro === null
                            ? "text-zinc-500 dark:text-zinc-400"
                            : veiculo.lucro >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {veiculo.lucro !== null ? formatarMoeda(veiculo.lucro) : "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                        {veiculo.margem_pct !== null ? `${veiculo.margem_pct.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                        {veiculo.dias_em_estoque ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {metricas.resultado.veiculos_omitidos > 0 && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                + {metricas.resultado.veiculos_omitidos} veículo(s) não exibido(s) (mostrando os 20 de
                maior impacto).
              </p>
            )}
          </section>
        )}

        <AnalisePainel analise={analise} />
      </div>
    </div>
  );
}
