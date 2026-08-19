// Tipos do domínio de relatórios de IA (Fase 3). `type`, nunca `interface` — mesmo motivo
// documentado em `src/types/database.ts`: qualquer tipo referenciado dentro de `Database`
// precisa satisfazer `Record<string, unknown>` estruturalmente para o SDK do Supabase inferir
// corretamente os tipos de `.from()`/`.rpc()`. Mantemos a convenção em todo o módulo por
// consistência e para blindar contra o bug se algo daqui for movido para dentro de `Database`.

import type { TipoNegociacao, TipoVeiculo } from "@/types/database";

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
  };
  resultado: {
    veiculos: VeiculoRealizado[];
    veiculos_omitidos: number;
    lucro_bruto: number;
    custo_total: number;
    margem_agregada_pct: number | null;
    qtd_lucro: number;
    qtd_prejuizo: number;
    qtd_sem_custo: number;
    dias_estoque_medio: number | null;
    melhor: VeiculoRealizado | null;
    pior: VeiculoRealizado | null;
  };
  estoque: {
    qtd: number;
    capital_parado: number;
    por_tipo: Record<TipoVeiculo, number>;
    mais_antigo: { veiculo_id: string; descricao: string; dias_em_estoque: number } | null;
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
