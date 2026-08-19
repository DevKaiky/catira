import { formatarMoeda, TIPO_NEGOCIACAO_LABEL } from "@/lib/format";
import { MetricCard } from "@/components/catira/MetricCard";
import { ValorMonetario } from "@/components/catira/ValorMonetario";
import type { MetricasPeriodo } from "@/types/relatorios";

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
      <MetricCard
        titulo="Lucro realizado"
        valor={<ValorMonetario valor={lucro} />}
        delta={delta !== null ? { valor: delta, formatado: formatarMoeda(Math.abs(delta)) } : null}
        rodape={
          <>
            {metricas.resultado.qtd_lucro} com lucro · {metricas.resultado.qtd_prejuizo} com prejuízo
            {metricas.resultado.qtd_sem_custo > 0 &&
              ` · ${metricas.resultado.qtd_sem_custo} sem custo conhecido`}
            {metricas.resultado.despesas_total !== undefined &&
              metricas.resultado.despesas_total > 0 &&
              " · líquido de despesas"}
          </>
        }
      />

      <MetricCard
        titulo="Caixa líquido (volta em dinheiro)"
        valor={<ValorMonetario valor={metricas.resumo.caixa_liquido} />}
        rodape={
          <>
            Recebeu {formatarMoeda(metricas.resumo.dinheiro_recebido)} · Pagou{" "}
            {formatarMoeda(metricas.resumo.dinheiro_pago)}
          </>
        }
      />

      <MetricCard
        titulo="Negociações"
        valor={metricas.resumo.negociacoes_total}
        rodape={
          <>
            {negociacoesPorTipo || "Nenhuma"}
            {metricas.resumo.pendentes > 0 && ` · ${metricas.resumo.pendentes} pendente(s)`}
          </>
        }
      />

      <MetricCard
        titulo="Ticket médio"
        valor={
          <span className="text-base font-medium">
            Entrada:{" "}
            <span className="font-semibold">
              {metricas.resumo.ticket_medio_entrada !== null
                ? formatarMoeda(metricas.resumo.ticket_medio_entrada)
                : "—"}
            </span>
          </span>
        }
        rodape={
          <>
            Saída:{" "}
            {metricas.resumo.ticket_medio_saida !== null
              ? formatarMoeda(metricas.resumo.ticket_medio_saida)
              : "—"}
          </>
        }
      />

      <MetricCard
        titulo="Capital parado em estoque"
        valor={formatarMoeda(metricas.estoque.capital_parado)}
        rodape={
          <>
            {metricas.estoque.qtd} veículo(s)
            {metricas.estoque.mais_antigo &&
              ` · mais antigo: ${metricas.estoque.mais_antigo.descricao} (${metricas.estoque.mais_antigo.dias_em_estoque}d)`}
          </>
        }
      />

      {metricas.resumo.despesas_periodo && metricas.resumo.despesas_periodo.total > 0 && (
        <MetricCard
          titulo="Despesas no período"
          valor={formatarMoeda(metricas.resumo.despesas_periodo.total)}
          valorClassName="text-atencao"
          rodape={`${metricas.resumo.despesas_periodo.qtd} lançamento(s)`}
        />
      )}

      {Math.abs(metricas.resumo.desequilibrio_declarado) > 0.01 && (
        <MetricCard
          titulo="Desequilíbrio declarado"
          valor={formatarMoeda(metricas.resumo.desequilibrio_declarado)}
          valorClassName="text-atencao"
          rodape="Diferença entre entradas, saídas e volta declaradas — não é lucro nem prejuízo."
        />
      )}
    </div>
  );
}
