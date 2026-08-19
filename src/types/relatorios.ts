// Tipos do domínio de relatórios de IA (Fase 3). `type`, nunca `interface` — mesmo motivo
// documentado em `src/types/database.ts`: qualquer tipo referenciado dentro de `Database`
// precisa satisfazer `Record<string, unknown>` estruturalmente para o SDK do Supabase inferir
// corretamente os tipos de `.from()`/`.rpc()`. Mantemos a convenção em todo o módulo por
// consistência e para blindar contra o bug se algo daqui for movido para dentro de `Database`.
//
// `relatorios.metricas` é um snapshot jsonb já persistido em produção (Fase 3). Todo campo
// NOVO em `MetricasPeriodo`/`VeiculoRealizado` precisa ser OPCIONAL — declará-lo obrigatório
// mentiria sobre linhas antigas que nunca tiveram esse campo calculado.

import type { CategoriaDespesa, TipoNegociacao, TipoVeiculo } from "@/types/database";

export type GranularidadeRelatorio = "diario" | "semanal" | "mensal" | "personalizado";

/** Uma janela de datas fechada (inclusive nos dois extremos), em formato `YYYY-MM-DD`. */
export type Periodo = {
  inicio: string;
  fim: string;
};

/** Um veículo com as duas pontas (aquisição + saída) resolvidas, usado no resultado do período. */
export type VeiculoRealizado = {
  veiculo_id: string;
  descricao: string;
  tipo: TipoVeiculo;
  valor_aquisicao: number | null;
  data_aquisicao: string | null;
  valor_saida: number;
  data_saida: string;
  lucro: number | null;
  margem_pct: number | null;
  dias_em_estoque: number | null;
  // Campos novos (despesas por veículo). Opcionais: `relatorios.metricas` é jsonb já
  // persistido em produção — declará-los obrigatórios mentiria sobre snapshots antigos.
  despesas?: number;
  custo_total?: number | null;
};

export type MetricasPeriodo = {
  periodo: {
    inicio: string;
    fim: string;
    dias: number;
    granularidade: GranularidadeRelatorio;
  };
  resumo: {
    negociacoes_total: number;
    por_tipo: Record<TipoNegociacao, number>;
    pendentes: number;
    veiculos_entrada_qtd: number;
    veiculos_saida_qtd: number;
    valor_total_entradas: number;
    valor_total_saidas: number;
    ticket_medio_entrada: number | null;
    ticket_medio_saida: number | null;
    dinheiro_recebido: number;
    dinheiro_pago: number;
    caixa_liquido: number;
    desequilibrio_declarado: number;
    // Despesas lançadas DENTRO da janela do relatório (tenha o veículo sido vendido ou não).
    // Não confundir com as despesas embutidas em `resultado.custo_total`, que podem ter sido
    // gastas em períodos anteriores. Opcional: snapshot jsonb antigo não tem esse campo.
    despesas_periodo?: { total: number; qtd: number; por_categoria: Record<CategoriaDespesa, number> };
  };
  resultado: {
    veiculos: VeiculoRealizado[];
    veiculos_omitidos: number;
    lucro_bruto: number;
    /** Aquisições + despesas dos veículos com custo conhecido. Muda de significado a partir
     *  da introdução de despesas — antes era só a soma das aquisições. */
    custo_total: number;
    margem_agregada_pct: number | null;
    qtd_lucro: number;
    qtd_prejuizo: number;
    qtd_sem_custo: number;
    dias_estoque_medio: number | null;
    melhor: VeiculoRealizado | null;
    pior: VeiculoRealizado | null;
    despesas_total?: number;
  };
  estoque: {
    qtd: number;
    capital_parado: number;
    por_tipo: Record<TipoVeiculo, number>;
    mais_antigo: { veiculo_id: string; descricao: string; dias_em_estoque: number } | null;
    despesas_acumuladas?: number;
    qtd_sem_aquisicao?: number;
  };
  periodo_anterior: {
    periodo: { inicio: string; fim: string };
    resumo: { negociacoes_total: number; valor_total_entradas: number; valor_total_saidas: number };
    lucro_bruto: number;
  } | null;
};

/** Resposta estruturada da IA — interpretação em cima das métricas já calculadas. */
export type AnaliseIA = {
  resumo: string;
  destaques: string[];
  alertas: string[];
  recomendacoes: string[];
};
