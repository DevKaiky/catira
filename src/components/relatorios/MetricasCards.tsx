import { formatarMoeda, TIPO_NEGOCIACAO_LABEL } from "@/lib/format";
import type { MetricasPeriodo } from "@/types/relatorios";

function corPorSinal(valor: number): string {
  if (valor > 0) return "text-emerald-600 dark:text-emerald-400";
  if (valor < 0) return "text-red-600 dark:text-red-400";
  return "text-zinc-950 dark:text-zinc-50";
}

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]">
      <p className="text-xs font-medium uppercase text-zinc-400">{titulo}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export default function MetricasCards({ metricas }: { metricas: MetricasPeriodo }) {
  const lucro = metricas.resultado.lucro_bruto;
  const lucroAnterior = metricas.periodo_anterior?.lucro_bruto ?? null;
  const delta = lucroAnterior !== null ? Math.round((lucro - lucroAnterior) * 100) / 100 : null;

  const negociacoesPorTipo = Object.entries(metricas.resumo.por_tipo)
    .filter(([, qtd]) => qtd > 0)
    .map(([tipo, qtd]) => `${qtd} ${TIPO_NEGOCIACAO_LABEL[tipo] ?? tipo}`)
    .join(" · ");

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card titulo="Lucro realizado">
        <p className={`text-2xl font-semibold ${corPorSinal(lucro)}`}>{formatarMoeda(lucro)}</p>
        {delta !== null && (
          <p className={`mt-1 text-xs ${corPorSinal(delta)}`}>
            {delta >= 0 ? "+" : ""}
            {formatarMoeda(delta)} vs período anterior
          </p>
        )}
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {metricas.resultado.qtd_lucro} com lucro · {metricas.resultado.qtd_prejuizo} com prejuízo
          {metricas.resultado.qtd_sem_custo > 0 &&
            ` · ${metricas.resultado.qtd_sem_custo} sem custo conhecido`}
          {metricas.resultado.despesas_total !== undefined &&
            metricas.resultado.despesas_total > 0 &&
            " · líquido de despesas"}
        </p>
      </Card>

      <Card titulo="Caixa líquido (volta em dinheiro)">
        <p className={`text-2xl font-semibold ${corPorSinal(metricas.resumo.caixa_liquido)}`}>
          {formatarMoeda(metricas.resumo.caixa_liquido)}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Recebeu {formatarMoeda(metricas.resumo.dinheiro_recebido)} · Pagou{" "}
          {formatarMoeda(metricas.resumo.dinheiro_pago)}
        </p>
      </Card>

      <Card titulo="Negociações">
        <p className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {metricas.resumo.negociacoes_total}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {negociacoesPorTipo || "Nenhuma"}
          {metricas.resumo.pendentes > 0 && ` · ${metricas.resumo.pendentes} pendente(s)`}
        </p>
      </Card>

      <Card titulo="Ticket médio">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Entrada:{" "}
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">
            {metricas.resumo.ticket_medio_entrada !== null
              ? formatarMoeda(metricas.resumo.ticket_medio_entrada)
              : "—"}
          </span>
        </p>
        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          Saída:{" "}
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">
            {metricas.resumo.ticket_medio_saida !== null
              ? formatarMoeda(metricas.resumo.ticket_medio_saida)
              : "—"}
          </span>
        </p>
      </Card>

      <Card titulo="Capital parado em estoque">
        <p className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {formatarMoeda(metricas.estoque.capital_parado)}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {metricas.estoque.qtd} veículo(s)
          {metricas.estoque.mais_antigo &&
            ` · mais antigo: ${metricas.estoque.mais_antigo.descricao} (${metricas.estoque.mais_antigo.dias_em_estoque}d)`}
        </p>
      </Card>

      {metricas.resumo.despesas_periodo && metricas.resumo.despesas_periodo.total > 0 && (
        <Card titulo="Despesas no período">
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
            {formatarMoeda(metricas.resumo.despesas_periodo.total)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {metricas.resumo.despesas_periodo.qtd} lançamento(s)
          </p>
        </Card>
      )}

      {Math.abs(metricas.resumo.desequilibrio_declarado) > 0.01 && (
        <Card titulo="Desequilíbrio declarado">
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
            {formatarMoeda(metricas.resumo.desequilibrio_declarado)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Diferença entre entradas, saídas e volta declaradas — não é lucro nem prejuízo.
          </p>
        </Card>
      )}
    </div>
  );
}
