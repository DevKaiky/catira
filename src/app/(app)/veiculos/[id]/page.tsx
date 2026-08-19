import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarVeiculo } from "@/lib/queries/veiculos";
import { calcularResultadoVeiculo } from "@/lib/veiculos/resultado";
import { hojeSaoPaulo } from "@/lib/relatorios/periodo";
import {
  CATEGORIA_DESPESA_LABEL,
  formatarData,
  formatarMoeda,
  STATUS_VEICULO_LABEL,
  TIPO_NEGOCIACAO_LABEL,
  TIPO_VEICULO_LABEL,
} from "@/lib/format";
import DespesaForm from "./DespesaForm";
import { ExcluirDespesaButton, VeiculoAcoes } from "./BotoesAcao";

function corResultado(valor: number | null): string {
  if (valor === null) return "text-zinc-500 dark:text-zinc-400";
  if (valor > 0) return "text-emerald-600 dark:text-emerald-400";
  if (valor < 0) return "text-red-600 dark:text-red-400";
  return "text-zinc-950 dark:text-zinc-50";
}

export default async function VeiculoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const veiculo = await buscarVeiculo(id);

  if (!veiculo) {
    notFound();
  }

  const entrada = veiculo.movimentacoes.find((m) => m.direcao === "entrada") ?? null;
  const saida =
    veiculo.movimentacoes.find((m) => m.direcao === "saida" && m.negociacao.status !== "cancelada") ??
    null;
  const totalDespesas = veiculo.despesas.reduce((soma, d) => soma + d.valor, 0);

  const resultado = calcularResultadoVeiculo({
    valorAquisicao: entrada ? entrada.valor_atribuido : null,
    dataAquisicao: entrada ? entrada.negociacao.data_negociacao : null,
    valorSaida: saida ? saida.valor_atribuido : null,
    dataSaida: saida ? saida.negociacao.data_negociacao : null,
    despesas: totalDespesas,
    hoje: hojeSaoPaulo(),
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              {veiculo.marca} {veiculo.modelo}
              {veiculo.ano_modelo ? ` ${veiculo.ano_modelo}` : ""}
            </h1>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {TIPO_VEICULO_LABEL[veiculo.tipo]}
            </span>
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {STATUS_VEICULO_LABEL[veiculo.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {[veiculo.versao, veiculo.placa, veiculo.cor, veiculo.combustivel]
              .filter(Boolean)
              .join(" · ") || "Sem detalhes adicionais"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <VeiculoAcoes id={veiculo.id} />
          <Link href="/veiculos" className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
            Voltar
          </Link>
        </div>
      </div>

      <section className="mb-8 grid gap-4 rounded-lg border border-black/[.08] p-4 dark:border-white/[.145] sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase text-zinc-400">Aquisição</p>
          <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {entrada ? formatarMoeda(entrada.valor_atribuido) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-zinc-400">Despesas</p>
          <p className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
            {formatarMoeda(resultado.despesas)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-zinc-400">Custo total</p>
          <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {resultado.custo_total !== null ? formatarMoeda(resultado.custo_total) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-zinc-400">Saída</p>
          <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {saida ? formatarMoeda(saida.valor_atribuido) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-zinc-400">Lucro</p>
          <p className={`mt-1 text-sm font-semibold ${corResultado(resultado.lucro)}`}>
            {resultado.lucro !== null ? formatarMoeda(resultado.lucro) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-zinc-400">Margem</p>
          <p className={`mt-1 text-sm font-semibold ${corResultado(resultado.margem_pct)}`}>
            {resultado.margem_pct !== null ? `${resultado.margem_pct.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-zinc-400">Dias em estoque</p>
          <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {resultado.dias_em_estoque ?? "—"}
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-zinc-950 dark:text-zinc-50">
          Movimentações
        </h2>
        {veiculo.movimentacoes.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhuma negociação vinculada.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-black/[.08] dark:border-white/[.145]">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Direção</th>
                  <th className="px-3 py-2 font-medium">Contraparte</th>
                  <th className="px-3 py-2 font-medium">Valor</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[.08] dark:divide-white/[.08]">
                {veiculo.movimentacoes.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                      {formatarData(m.negociacao.data_negociacao)}
                    </td>
                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                      {TIPO_NEGOCIACAO_LABEL[m.negociacao.tipo]}
                    </td>
                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                      {m.direcao === "entrada" ? "Entrada" : "Saída"}
                    </td>
                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                      {m.negociacao.contraparte_nome}
                    </td>
                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                      {formatarMoeda(m.valor_atribuido)}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/negocios/${m.negociacao_id}/editar`}
                        className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
                      >
                        Editar negociação
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Despesas</h2>

        <DespesaForm veiculoId={veiculo.id} />

        {veiculo.despesas.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhuma despesa lançada.</p>
        ) : (
          <ul className="space-y-2">
            {veiculo.despesas.map((despesa) => (
              <li
                key={despesa.id}
                className="flex items-center justify-between rounded-lg border border-black/[.08] px-4 py-2.5 dark:border-white/[.145]"
              >
                <div className="text-sm">
                  <span className="font-medium text-zinc-950 dark:text-zinc-50">
                    {CATEGORIA_DESPESA_LABEL[despesa.categoria]}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400"> · {despesa.descricao}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {" "}
                    · {formatarData(despesa.data)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {formatarMoeda(despesa.valor)}
                  </span>
                  <ExcluirDespesaButton id={despesa.id} veiculoId={veiculo.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
