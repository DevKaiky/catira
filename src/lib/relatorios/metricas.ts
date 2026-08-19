// Cálculo determinístico das métricas de um relatório. Função pura, sem I/O, sem import de
// Supabase — recebe os dados já buscados e devolve o snapshot que será persistido e mostrado.
// A IA nunca faz conta: só interpreta o que sai daqui.

import { diferencaEmDias, duracaoEmDias, hojeSaoPaulo } from "@/lib/relatorios/periodo";
import { arredondar, calcularResultadoVeiculo } from "@/lib/veiculos/resultado";
import type { DadosBrutosPeriodo, LegAquisicao } from "@/lib/queries/relatorios";
import type { NegociacaoComVeiculos, TipoNegociacao, TipoVeiculo, Veiculo } from "@/types/database";
import type { GranularidadeRelatorio, MetricasPeriodo, Periodo, VeiculoRealizado } from "@/types/relatorios";

const CAP_VEICULOS_RESULTADO = 20;

function media(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return arredondar(valores.reduce((soma, v) => soma + v, 0) / valores.length);
}

function descreverVeiculo(veiculo: Veiculo): string {
  const base = `${veiculo.marca} ${veiculo.modelo}`.trim();
  return veiculo.placa ? `${base} (${veiculo.placa})` : base;
}

function negociacaoNoIntervalo(negociacao: NegociacaoComVeiculos, periodo: Periodo): boolean {
  return negociacao.data_negociacao >= periodo.inicio && negociacao.data_negociacao <= periodo.fim;
}

/** Veículos com saída concluída dentro do período — lucro é atribuído ao período da SAÍDA. */
function veiculosRealizadosDoPeriodo(
  negociacoes: NegociacaoComVeiculos[],
  aquisicoes: Record<string, LegAquisicao>,
  despesasPorVeiculo: Record<string, number>,
  hoje: string
): VeiculoRealizado[] {
  const realizados: VeiculoRealizado[] = [];

  for (const negociacao of negociacoes) {
    if (negociacao.status !== "concluida") continue;

    for (const item of negociacao.itens) {
      if (item.direcao !== "saida") continue;

      const aquisicao = aquisicoes[item.veiculo_id] ?? null;
      const valorSaida = item.valor_atribuido;
      const dataSaida = negociacao.data_negociacao;
      const despesas = despesasPorVeiculo[item.veiculo_id] ?? 0;

      const resultado = calcularResultadoVeiculo({
        valorAquisicao: aquisicao ? aquisicao.valor : null,
        dataAquisicao: aquisicao ? aquisicao.data : null,
        valorSaida,
        dataSaida,
        despesas,
        hoje,
      });

      realizados.push({
        veiculo_id: item.veiculo_id,
        descricao: descreverVeiculo(item.veiculo),
        tipo: item.veiculo.tipo,
        valor_aquisicao: aquisicao ? aquisicao.valor : null,
        data_aquisicao: aquisicao ? aquisicao.data : null,
        valor_saida: valorSaida,
        data_saida: dataSaida,
        lucro: resultado.lucro,
        margem_pct: resultado.margem_pct,
        dias_em_estoque: resultado.dias_em_estoque,
        despesas: resultado.despesas,
        custo_total: resultado.custo_total,
      });
    }
  }

  return realizados;
}

function somarLucro(veiculos: VeiculoRealizado[]): number {
  return arredondar(
    veiculos.reduce((soma, v) => soma + (v.lucro ?? 0), 0)
  );
}

export function calcularMetricas(
  dados: DadosBrutosPeriodo,
  periodo: Periodo,
  periodoAnterior: Periodo,
  granularidade: GranularidadeRelatorio
): MetricasPeriodo {
  const hoje = hojeSaoPaulo();
  const negociacoesPeriodo = dados.negociacoes.filter((n) => negociacaoNoIntervalo(n, periodo));
  const negociacoesPeriodoAnterior = dados.negociacoes.filter((n) =>
    negociacaoNoIntervalo(n, periodoAnterior)
  );

  // ---- resumo ------------------------------------------------------------
  const porTipo: Record<TipoNegociacao, number> = { compra: 0, venda: 0, troca: 0 };
  let pendentes = 0;
  for (const n of negociacoesPeriodo) {
    porTipo[n.tipo] += 1;
    if (n.status === "pendente") pendentes += 1;
  }

  const negociacoesConcluidas = negociacoesPeriodo.filter((n) => n.status === "concluida");
  const itensEntradaConcluidos = negociacoesConcluidas.flatMap((n) =>
    n.itens.filter((i) => i.direcao === "entrada")
  );
  const itensSaidaConcluidos = negociacoesConcluidas.flatMap((n) =>
    n.itens.filter((i) => i.direcao === "saida")
  );

  const valorTotalEntradas = arredondar(
    itensEntradaConcluidos.reduce((soma, i) => soma + i.valor_atribuido, 0)
  );
  const valorTotalSaidas = arredondar(
    itensSaidaConcluidos.reduce((soma, i) => soma + i.valor_atribuido, 0)
  );

  const voltasConcluidas = negociacoesConcluidas.map((n) => n.valor_volta);
  const dinheiroRecebido = arredondar(
    voltasConcluidas.filter((v) => v > 0).reduce((soma, v) => soma + v, 0)
  );
  const dinheiroPago = arredondar(
    voltasConcluidas.filter((v) => v < 0).reduce((soma, v) => soma + Math.abs(v), 0)
  );
  const caixaLiquido = arredondar(dinheiroRecebido - dinheiroPago);
  const desequilibrioDeclarado = arredondar(valorTotalEntradas - valorTotalSaidas + caixaLiquido);

  const resumo: MetricasPeriodo["resumo"] = {
    negociacoes_total: negociacoesPeriodo.length,
    por_tipo: porTipo,
    pendentes,
    veiculos_entrada_qtd: itensEntradaConcluidos.length,
    veiculos_saida_qtd: itensSaidaConcluidos.length,
    valor_total_entradas: valorTotalEntradas,
    valor_total_saidas: valorTotalSaidas,
    ticket_medio_entrada:
      itensEntradaConcluidos.length > 0
        ? arredondar(valorTotalEntradas / itensEntradaConcluidos.length)
        : null,
    ticket_medio_saida:
      itensSaidaConcluidos.length > 0
        ? arredondar(valorTotalSaidas / itensSaidaConcluidos.length)
        : null,
    dinheiro_recebido: dinheiroRecebido,
    dinheiro_pago: dinheiroPago,
    caixa_liquido: caixaLiquido,
    desequilibrio_declarado: desequilibrioDeclarado,
    despesas_periodo: dados.despesasPeriodo,
  };

  // ---- resultado (lucro real, cruzando as duas pontas) --------------------
  const veiculosRealizados = veiculosRealizadosDoPeriodo(
    negociacoesPeriodo,
    dados.aquisicoes,
    dados.despesasPorVeiculo,
    hoje
  );

  const comCusto = veiculosRealizados.filter((v) => v.lucro !== null);
  const lucroBruto = somarLucro(comCusto);
  // custo_total agora inclui despesas (não só o valor de aquisição) — ver src/lib/veiculos/resultado.ts.
  const custoTotal = arredondar(comCusto.reduce((soma, v) => soma + (v.custo_total ?? 0), 0));
  const despesasTotal = arredondar(comCusto.reduce((soma, v) => soma + (v.despesas ?? 0), 0));
  const qtdLucro = comCusto.filter((v) => (v.lucro ?? 0) > 0).length;
  const qtdPrejuizo = comCusto.filter((v) => (v.lucro ?? 0) < 0).length;
  const qtdSemCusto = veiculosRealizados.length - comCusto.length;
  const diasEstoqueMedio = media(
    comCusto.filter((v) => v.dias_em_estoque !== null).map((v) => v.dias_em_estoque as number)
  );

  const ordenadosPorLucroAbsoluto = [...veiculosRealizados].sort(
    (a, b) => Math.abs(b.lucro ?? -1) - Math.abs(a.lucro ?? -1)
  );
  const veiculosExibidos = ordenadosPorLucroAbsoluto.slice(0, CAP_VEICULOS_RESULTADO);
  const veiculosOmitidos = veiculosRealizados.length - veiculosExibidos.length;

  const melhor =
    comCusto.length > 0
      ? comCusto.reduce((atual, v) => ((v.lucro ?? -Infinity) > (atual.lucro ?? -Infinity) ? v : atual))
      : null;
  const pior =
    comCusto.length > 0
      ? comCusto.reduce((atual, v) => ((v.lucro ?? Infinity) < (atual.lucro ?? Infinity) ? v : atual))
      : null;

  const resultado: MetricasPeriodo["resultado"] = {
    veiculos: veiculosExibidos,
    veiculos_omitidos: veiculosOmitidos,
    lucro_bruto: lucroBruto,
    custo_total: custoTotal,
    margem_agregada_pct: custoTotal !== 0 ? arredondar((lucroBruto / custoTotal) * 100) : null,
    qtd_lucro: qtdLucro,
    qtd_prejuizo: qtdPrejuizo,
    qtd_sem_custo: qtdSemCusto,
    dias_estoque_medio: diasEstoqueMedio,
    melhor,
    pior,
    despesas_total: despesasTotal,
  };

  // ---- estoque (capital parado, snapshot atual) ----------------------------
  const porTipoEstoque: Record<TipoVeiculo, number> = { carro: 0, moto: 0, caminhonete: 0, outro: 0 };
  let capitalParado = 0;
  let despesasAcumuladas = 0;
  let qtdSemAquisicao = 0;
  let maisAntigo: { veiculo_id: string; descricao: string; dias_em_estoque: number } | null = null;

  for (const { veiculo, aquisicao, despesas } of dados.estoque) {
    porTipoEstoque[veiculo.tipo] += 1;
    despesasAcumuladas += despesas;

    if (!aquisicao) {
      qtdSemAquisicao += 1;
      capitalParado += despesas;
      continue;
    }

    capitalParado += aquisicao.valor + despesas;
    const diasEmEstoque = diferencaEmDias(aquisicao.data, hoje);
    if (!maisAntigo || diasEmEstoque > maisAntigo.dias_em_estoque) {
      maisAntigo = {
        veiculo_id: veiculo.id,
        descricao: descreverVeiculo(veiculo),
        dias_em_estoque: diasEmEstoque,
      };
    }
  }

  const estoque: MetricasPeriodo["estoque"] = {
    qtd: dados.estoque.length,
    capital_parado: arredondar(capitalParado),
    por_tipo: porTipoEstoque,
    mais_antigo: maisAntigo,
    despesas_acumuladas: arredondar(despesasAcumuladas),
    qtd_sem_aquisicao: qtdSemAquisicao,
  };

  // ---- período anterior (comparação) ---------------------------------------
  const negociacoesAnterioresConcluidas = negociacoesPeriodoAnterior.filter(
    (n) => n.status === "concluida"
  );
  const valorEntradasAnterior = arredondar(
    negociacoesAnterioresConcluidas
      .flatMap((n) => n.itens.filter((i) => i.direcao === "entrada"))
      .reduce((soma, i) => soma + i.valor_atribuido, 0)
  );
  const valorSaidasAnterior = arredondar(
    negociacoesAnterioresConcluidas
      .flatMap((n) => n.itens.filter((i) => i.direcao === "saida"))
      .reduce((soma, i) => soma + i.valor_atribuido, 0)
  );
  const veiculosRealizadosAnterior = veiculosRealizadosDoPeriodo(
    negociacoesPeriodoAnterior,
    dados.aquisicoes,
    dados.despesasPorVeiculo,
    hoje
  );

  const periodoAnteriorMetricas: MetricasPeriodo["periodo_anterior"] = {
    periodo: periodoAnterior,
    resumo: {
      negociacoes_total: negociacoesPeriodoAnterior.length,
      valor_total_entradas: valorEntradasAnterior,
      valor_total_saidas: valorSaidasAnterior,
    },
    lucro_bruto: somarLucro(veiculosRealizadosAnterior.filter((v) => v.lucro !== null)),
  };

  return {
    periodo: {
      inicio: periodo.inicio,
      fim: periodo.fim,
      dias: duracaoEmDias(periodo),
      granularidade,
    },
    resumo,
    resultado,
    estoque,
    periodo_anterior: periodoAnteriorMetricas,
  };
}
