import { createClient } from "@/lib/supabase/server";
import type { CategoriaDespesa, NegociacaoComVeiculos, Relatorio, Veiculo } from "@/types/database";
import type { AnaliseIA, GranularidadeRelatorio, MetricasPeriodo, Periodo } from "@/types/relatorios";

/** Uma ponta de entrada (aquisição) de um veículo: quanto custou e quando entrou. */
export type LegAquisicao = { valor: number; data: string };

export type DadosBrutosPeriodo = {
  /** Negociações não canceladas na janela estendida [periodoAnterior.inicio .. periodo.fim]. */
  negociacoes: NegociacaoComVeiculos[];
  /** veiculo_id -> ponta de entrada, mesmo que fora da janela (cruzamento p/ lucro real). */
  aquisicoes: Record<string, LegAquisicao>;
  /** veiculo_id -> soma de TODAS as despesas do veículo, sem filtro de data. */
  despesasPorVeiculo: Record<string, number>;
  /** Snapshot do estoque atual (capital parado), com a aquisição e despesas de cada veículo. */
  estoque: { veiculo: Veiculo; aquisicao: LegAquisicao | null; despesas: number }[];
  /** Despesas lançadas dentro da janela do período (não da janela estendida). */
  despesasPeriodo: { total: number; qtd: number; por_categoria: Record<CategoriaDespesa, number> };
};

const TAMANHO_LOTE = 100;

function emLotes<T>(itens: T[], tamanho: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    lotes.push(itens.slice(i, i + tamanho));
  }
  return lotes;
}

/** Linha bruta de `negociacao_veiculos` com a negociação embutida (usada em `buscarAquisicoes`). */
type ItemComNegociacao = {
  veiculo_id?: string;
  valor_atribuido: number;
  negociacao: { data_negociacao: string; status?: string } | null;
};

/** Busca a ponta de entrada (aquisição) de cada veículo em `ids`, em lotes. */
async function buscarAquisicoes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[]
): Promise<Record<string, LegAquisicao>> {
  const aquisicoes: Record<string, LegAquisicao> = {};

  for (const lote of emLotes(ids, TAMANHO_LOTE)) {
    if (lote.length === 0) continue;

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

  return aquisicoes;
}

/** Soma de todas as despesas de cada veículo em `ids` (sem filtro de data), em lotes. */
async function buscarDespesasPorVeiculo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[]
): Promise<Record<string, number>> {
  const despesas: Record<string, number> = {};

  for (const lote of emLotes(ids, TAMANHO_LOTE)) {
    if (lote.length === 0) continue;

    const { data, error } = await supabase
      .from("despesas_veiculo")
      .select("veiculo_id, valor")
      .in("veiculo_id", lote);

    if (error) {
      throw new Error(`Falha ao carregar despesas por veículo: ${error.message}`);
    }

    for (const item of data ?? []) {
      despesas[item.veiculo_id] = (despesas[item.veiculo_id] ?? 0) + item.valor;
    }
  }

  return despesas;
}

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

  const aquisicoes = await buscarAquisicoes(supabase, idsVeiculosSaida);

  // 3. Snapshot do estoque atual: TODO veículo ainda em_estoque, mesmo sem negociação de
  // aquisição (ex: cadastro avulso sem valor informado). Partir de `veiculos`, não de
  // `negociacao_veiculos`, senão esse veículo nunca apareceria aqui.
  const { data: estoqueVeiculosData, error: erroEstoque } = await supabase
    .from("veiculos")
    .select("*")
    .eq("status", "em_estoque");

  if (erroEstoque) {
    throw new Error(`Falha ao carregar estoque atual: ${erroEstoque.message}`);
  }

  const veiculosEstoque = (estoqueVeiculosData ?? []) as Veiculo[];
  const idsEstoque = veiculosEstoque.map((v) => v.id);
  const aquisicoesEstoque = await buscarAquisicoes(supabase, idsEstoque);

  // 4. Despesas por veículo — união dos ids de saída da janela com os do estoque atual.
  const idsDespesas = Array.from(new Set([...idsVeiculosSaida, ...idsEstoque]));
  const despesasPorVeiculo = await buscarDespesasPorVeiculo(supabase, idsDespesas);

  const estoque = veiculosEstoque.map((veiculo) => ({
    veiculo,
    aquisicao: aquisicoesEstoque[veiculo.id] ?? null,
    despesas: despesasPorVeiculo[veiculo.id] ?? 0,
  }));

  // 5. Despesas lançadas DENTRO da janela do período (não da janela estendida).
  const { data: despesasPeriodoData, error: erroDespesasPeriodo } = await supabase
    .from("despesas_veiculo")
    .select("valor, categoria")
    .gte("data", periodo.inicio)
    .lte("data", periodo.fim);

  if (erroDespesasPeriodo) {
    throw new Error(`Falha ao carregar despesas do período: ${erroDespesasPeriodo.message}`);
  }

  const porCategoria = {} as Record<CategoriaDespesa, number>;
  let despesasPeriodoTotal = 0;
  for (const item of despesasPeriodoData ?? []) {
    despesasPeriodoTotal += item.valor;
    const categoria = item.categoria as CategoriaDespesa;
    porCategoria[categoria] = (porCategoria[categoria] ?? 0) + item.valor;
  }

  const despesasPeriodo = {
    total: despesasPeriodoTotal,
    qtd: (despesasPeriodoData ?? []).length,
    por_categoria: porCategoria,
  };

  return { negociacoes, aquisicoes, despesasPorVeiculo, estoque, despesasPeriodo };
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
