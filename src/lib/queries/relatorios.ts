import { createClient } from "@/lib/supabase/server";
import type { NegociacaoComVeiculos, Relatorio, Veiculo } from "@/types/database";
import type { AnaliseIA, GranularidadeRelatorio, MetricasPeriodo, Periodo } from "@/types/relatorios";

/** Uma ponta de entrada (aquisição) de um veículo: quanto custou e quando entrou. */
export type LegAquisicao = { valor: number; data: string };

export type DadosBrutosPeriodo = {
  /** Negociações não canceladas na janela estendida [periodoAnterior.inicio .. periodo.fim]. */
  negociacoes: NegociacaoComVeiculos[];
  /** veiculo_id -> ponta de entrada, mesmo que fora da janela (cruzamento p/ lucro real). */
  aquisicoes: Record<string, LegAquisicao>;
  /** Snapshot do estoque atual (capital parado), com a aquisição de cada veículo. */
  estoque: { veiculo: Veiculo; aquisicao: LegAquisicao | null }[];
};

const TAMANHO_LOTE = 100;

function emLotes<T>(itens: T[], tamanho: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    lotes.push(itens.slice(i, i + tamanho));
  }
  return lotes;
}

/** Linha bruta de `negociacao_veiculos` com a negociação embutida (usada nas queries 2 e 3). */
type ItemComNegociacao = {
  veiculo_id?: string;
  valor_atribuido: number;
  negociacao: { data_negociacao: string; status?: string } | null;
};

type ItemComVeiculo = {
  valor_atribuido: number;
  negociacao: { data_negociacao: string } | null;
  veiculo: Veiculo | null;
};

export async function buscarDadosDoPeriodo(
  periodo: Periodo,
  periodoAnterior: Periodo
): Promise<DadosBrutosPeriodo> {
  const supabase = await createClient();

  // 1. Negociações da janela estendida (período anterior + período atual), numa só chamada.
  const { data: negociacoesData, error: erroNegociacoes } = await supabase
    .from("negociacoes")
    .select("*, itens:negociacao_veiculos(*, veiculo:veiculos(*))")
    .gte("data_negociacao", periodoAnterior.inicio)
    .lte("data_negociacao", periodo.fim)
    .neq("status", "cancelada")
    .order("data_negociacao");

  if (erroNegociacoes) {
    throw new Error(`Falha ao carregar negociações do período: ${erroNegociacoes.message}`);
  }

  const negociacoes = (negociacoesData ?? []) as unknown as NegociacaoComVeiculos[];

  // 2. Pontas de aquisição dos veículos que saíram na janela — podem estar fora dela
  // (ex: veículo comprado em março, vendido em agosto). Sem isso não dá pra calcular lucro real.
  const idsVeiculosSaida = Array.from(
    new Set(
      negociacoes.flatMap((n) => n.itens.filter((i) => i.direcao === "saida").map((i) => i.veiculo_id))
    )
  );

  const aquisicoes: Record<string, LegAquisicao> = {};

  for (const lote of emLotes(idsVeiculosSaida, TAMANHO_LOTE)) {
    const { data: aquisicoesData, error: erroAquisicoes } = await supabase
      .from("negociacao_veiculos")
      .select("veiculo_id, valor_atribuido, negociacao:negociacoes!inner(data_negociacao, status)")
      .eq("direcao", "entrada")
      .in("veiculo_id", lote)
      .neq("negociacao.status", "cancelada");

    if (erroAquisicoes) {
      throw new Error(`Falha ao carregar pontas de aquisição: ${erroAquisicoes.message}`);
    }

    for (const item of (aquisicoesData ?? []) as unknown as ItemComNegociacao[]) {
      if (!item.veiculo_id || !item.negociacao) continue;
      aquisicoes[item.veiculo_id] = {
        valor: item.valor_atribuido,
        data: item.negociacao.data_negociacao,
      };
    }
  }

  // 3. Snapshot do estoque atual: todo veículo ainda em_estoque, com sua ponta de entrada.
  const { data: estoqueData, error: erroEstoque } = await supabase
    .from("negociacao_veiculos")
    .select("valor_atribuido, negociacao:negociacoes!inner(data_negociacao), veiculo:veiculos!inner(*)")
    .eq("direcao", "entrada")
    .eq("veiculo.status", "em_estoque");

  if (erroEstoque) {
    throw new Error(`Falha ao carregar estoque atual: ${erroEstoque.message}`);
  }

  const estoque = ((estoqueData ?? []) as unknown as ItemComVeiculo[])
    .filter((item): item is ItemComVeiculo & { veiculo: Veiculo } => item.veiculo !== null)
    .map((item) => ({
      veiculo: item.veiculo,
      aquisicao: item.negociacao
        ? { valor: item.valor_atribuido, data: item.negociacao.data_negociacao }
        : null,
    }));

  return { negociacoes, aquisicoes, estoque };
}

export async function listarRelatorios(): Promise<Relatorio[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("relatorios")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao carregar relatórios: ${error.message}`);
  }

  return data ?? [];
}

export async function buscarRelatorio(id: string): Promise<Relatorio | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("relatorios").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar relatório: ${error.message}`);
  }

  return data;
}

export type NovoRelatorioInput = {
  granularidade: GranularidadeRelatorio;
  periodo_inicio: string;
  periodo_fim: string;
  metricas: MetricasPeriodo;
  analise: AnaliseIA;
  provedor: string;
  modelo: string;
  tokens_entrada: number | null;
  tokens_saida: number | null;
};

export async function salvarRelatorio(dados: NovoRelatorioInput): Promise<{ id: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("relatorios").insert(dados).select("id").single();

  if (error) {
    throw new Error(`Falha ao salvar relatório: ${error.message}`);
  }

  return { id: data.id };
}
