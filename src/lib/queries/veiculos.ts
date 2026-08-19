import { createClient } from "@/lib/supabase/server";
import type { DespesaVeiculo, Negociacao, NegociacaoVeiculo, StatusVeiculo, Veiculo } from "@/types/database";
import type { LegAquisicao } from "@/lib/queries/relatorios";

export type FiltroStatusVeiculo = StatusVeiculo | "todos";

export type VeiculoResumo = Veiculo & {
  aquisicao: LegAquisicao | null;
  total_despesas: number;
};

export type MovimentacaoVeiculo = NegociacaoVeiculo & { negociacao: Negociacao };

export type VeiculoDetalhado = Veiculo & {
  movimentacoes: MovimentacaoVeiculo[];
  despesas: DespesaVeiculo[];
};

const TAMANHO_LOTE = 100;

function emLotes<T>(itens: T[], tamanho: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    lotes.push(itens.slice(i, i + tamanho));
  }
  return lotes;
}

type PernaEntradaComNegociacao = {
  veiculo_id: string;
  valor_atribuido: number;
  negociacao: { data_negociacao: string } | null;
};

export async function listarVeiculos(filtro: FiltroStatusVeiculo): Promise<VeiculoResumo[]> {
  const supabase = await createClient();

  let query = supabase.from("veiculos").select("*").order("created_at", { ascending: false });
  if (filtro !== "todos") {
    query = query.eq("status", filtro);
  }

  const { data: veiculosData, error: erroVeiculos } = await query;

  if (erroVeiculos) {
    throw new Error(`Falha ao carregar veículos: ${erroVeiculos.message}`);
  }

  const veiculos = veiculosData ?? [];
  const ids = veiculos.map((v) => v.id);

  const aquisicoes: Record<string, LegAquisicao> = {};
  const despesas: Record<string, number> = {};

  for (const lote of emLotes(ids, TAMANHO_LOTE)) {
    if (lote.length === 0) continue;

    const { data: aquisicoesData, error: erroAquisicoes } = await supabase
      .from("negociacao_veiculos")
      .select("veiculo_id, valor_atribuido, negociacao:negociacoes!inner(data_negociacao, status)")
      .eq("direcao", "entrada")
      .in("veiculo_id", lote)
      .neq("negociacao.status", "cancelada");

    if (erroAquisicoes) {
      throw new Error(`Falha ao carregar aquisições: ${erroAquisicoes.message}`);
    }

    for (const item of (aquisicoesData ?? []) as unknown as PernaEntradaComNegociacao[]) {
      if (!item.negociacao) continue;
      aquisicoes[item.veiculo_id] = {
        valor: item.valor_atribuido,
        data: item.negociacao.data_negociacao,
      };
    }

    const { data: despesasData, error: erroDespesas } = await supabase
      .from("despesas_veiculo")
      .select("veiculo_id, valor")
      .in("veiculo_id", lote);

    if (erroDespesas) {
      throw new Error(`Falha ao carregar despesas: ${erroDespesas.message}`);
    }

    for (const item of despesasData ?? []) {
      despesas[item.veiculo_id] = (despesas[item.veiculo_id] ?? 0) + item.valor;
    }
  }

  return veiculos.map((veiculo) => ({
    ...veiculo,
    aquisicao: aquisicoes[veiculo.id] ?? null,
    total_despesas: despesas[veiculo.id] ?? 0,
  }));
}

export async function buscarVeiculo(id: string): Promise<VeiculoDetalhado | null> {
  const supabase = await createClient();

  const { data: veiculo, error: erroVeiculo } = await supabase
    .from("veiculos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (erroVeiculo) {
    throw new Error(`Falha ao carregar veículo: ${erroVeiculo.message}`);
  }

  if (!veiculo) {
    return null;
  }

  const { data: movimentacoesData, error: erroMovimentacoes } = await supabase
    .from("negociacao_veiculos")
    .select("*, negociacao:negociacoes(*)")
    .eq("veiculo_id", id);

  if (erroMovimentacoes) {
    throw new Error(`Falha ao carregar movimentações: ${erroMovimentacoes.message}`);
  }

  const movimentacoes = ((movimentacoesData ?? []) as unknown as MovimentacaoVeiculo[])
    .filter((m) => m.negociacao !== null)
    .sort((a, b) => {
      const porData = a.negociacao.data_negociacao.localeCompare(b.negociacao.data_negociacao);
      if (porData !== 0) return porData;
      return a.created_at.localeCompare(b.created_at);
    });

  const { data: despesasData, error: erroDespesas } = await supabase
    .from("despesas_veiculo")
    .select("*")
    .eq("veiculo_id", id)
    .order("data", { ascending: false });

  if (erroDespesas) {
    throw new Error(`Falha ao carregar despesas: ${erroDespesas.message}`);
  }

  return {
    ...veiculo,
    movimentacoes,
    despesas: despesasData ?? [],
  };
}
