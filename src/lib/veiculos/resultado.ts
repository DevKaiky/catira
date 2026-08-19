// Cálculo puro de custo/lucro/margem/dias em estoque de um veículo. Sem I/O, sem import de
// Supabase — usado tanto pelos relatórios (Fase 3) quanto pela página de detalhe do veículo,
// pra garantir que "lucro" signifique exatamente a mesma coisa nos dois lugares.

import { diferencaEmDias } from "@/lib/relatorios/periodo";

export function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export type EntradaResultadoVeiculo = {
  valorAquisicao: number | null;
  dataAquisicao: string | null;
  valorSaida: number | null;
  dataSaida: string | null;
  /** Soma de TODAS as despesas do veículo, sem filtro de data. */
  despesas: number;
  /** "Hoje" (YYYY-MM-DD) usado como fim da contagem de dias quando o veículo ainda não saiu. */
  hoje: string;
};

export type ResultadoVeiculo = {
  despesas: number;
  custo_total: number | null;
  lucro: number | null;
  margem_pct: number | null;
  dias_em_estoque: number | null;
};

/**
 * custo_total = aquisição + despesas (só existe se a aquisição for conhecida — despesas
 * sozinhas não são um custo completo). lucro exige custo_total E valor de saída conhecidos.
 */
export function calcularResultadoVeiculo(entrada: EntradaResultadoVeiculo): ResultadoVeiculo {
  const { valorAquisicao, dataAquisicao, valorSaida, dataSaida, despesas, hoje } = entrada;

  const custoTotal = valorAquisicao === null ? null : arredondar(valorAquisicao + despesas);

  const lucro =
    custoTotal === null || valorSaida === null ? null : arredondar(valorSaida - custoTotal);

  const margemPct =
    lucro !== null && custoTotal !== null && custoTotal !== 0
      ? arredondar((lucro / custoTotal) * 100)
      : null;

  const diasEmEstoque =
    dataAquisicao === null ? null : diferencaEmDias(dataAquisicao, dataSaida ?? hoje);

  return {
    despesas,
    custo_total: custoTotal,
    lucro,
    margem_pct: margemPct,
    dias_em_estoque: diasEmEstoque,
  };
}
