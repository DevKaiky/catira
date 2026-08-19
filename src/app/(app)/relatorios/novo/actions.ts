"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolverPeriodo } from "@/lib/relatorios/periodo";
import { buscarDadosDoPeriodo, salvarRelatorio } from "@/lib/queries/relatorios";
import { calcularMetricas } from "@/lib/relatorios/metricas";
import { montarPedido } from "@/lib/relatorios/prompt";
import { getProvedorIA } from "@/lib/ai";
import type { AnaliseIA, GranularidadeRelatorio } from "@/types/relatorios";

export type GerarRelatorioInput = {
  granularidade: GranularidadeRelatorio;
  /** Só usado (e obrigatório) quando `granularidade === 'personalizado'`. */
  inicio?: string;
  fim?: string;
};

export type GerarRelatorioState = { error: string };

function validarAnaliseIA(valor: unknown): valor is AnaliseIA {
  if (!valor || typeof valor !== "object") return false;
  const candidato = valor as Record<string, unknown>;

  const ehArrayDeStrings = (x: unknown): x is string[] =>
    Array.isArray(x) && x.every((item) => typeof item === "string");

  return (
    typeof candidato.resumo === "string" &&
    candidato.resumo.trim().length > 0 &&
    ehArrayDeStrings(candidato.destaques) &&
    ehArrayDeStrings(candidato.alertas) &&
    ehArrayDeStrings(candidato.recomendacoes)
  );
}

export async function gerarRelatorio(input: GerarRelatorioInput): Promise<GerarRelatorioState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvido = resolverPeriodo(input);
  if (!resolvido.ok) {
    return { error: resolvido.error };
  }
  const { periodo, periodoAnterior } = resolvido;

  const dados = await buscarDadosDoPeriodo(periodo, periodoAnterior);
  const metricas = calcularMetricas(dados, periodo, periodoAnterior, input.granularidade);

  const semMovimentacaoConcluida =
    metricas.resumo.veiculos_entrada_qtd === 0 && metricas.resumo.veiculos_saida_qtd === 0;
  if (semMovimentacaoConcluida) {
    return { error: "Nenhuma movimentação no período selecionado." };
  }

  const pedido = montarPedido(metricas);

  let respostaIA;
  try {
    respostaIA = await getProvedorIA().gerar(pedido);
  } catch (erro) {
    console.error("Falha ao gerar análise de IA:", erro);
    return {
      error: erro instanceof Error ? erro.message : "Falha ao gerar a análise de IA.",
    };
  }

  let analise: AnaliseIA;
  try {
    const respostaParseada: unknown = JSON.parse(respostaIA.texto);
    if (!validarAnaliseIA(respostaParseada)) {
      throw new Error("Resposta da IA não corresponde ao shape esperado de AnaliseIA.");
    }
    analise = respostaParseada;
  } catch (erro) {
    console.error("Resposta da IA em formato inesperado:", respostaIA.texto, erro);
    return { error: "A IA devolveu uma resposta em formato inesperado. Tente novamente." };
  }

  const { id } = await salvarRelatorio({
    granularidade: input.granularidade,
    periodo_inicio: periodo.inicio,
    periodo_fim: periodo.fim,
    metricas,
    analise,
    provedor: respostaIA.provedor,
    modelo: respostaIA.modelo,
    tokens_entrada: respostaIA.tokensEntrada,
    tokens_saida: respostaIA.tokensSaida,
  });

  revalidatePath("/relatorios");
  redirect(`/relatorios/${id}`);
}
