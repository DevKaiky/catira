// Monta o pedido para o provedor de IA: instrução de sistema + métricas já calculadas + o JSON
// Schema da resposta esperada. Nenhuma conta é feita aqui — só serialização e redação de prompt.

import type { PedidoIA } from "@/lib/ai/types";
import type { MetricasPeriodo } from "@/types/relatorios";

const INSTRUCAO_SISTEMA = `Você é um analista que ajuda um revendedor autônomo de veículos (compra, venda e troca — "catira") a interpretar o desempenho de um período do negócio.

REGRA MAIS IMPORTANTE: todos os números que você vai ler já foram calculados de forma determinística em código. Você NUNCA deve recalcular, estimar, arredondar diferente ou citar qualquer valor que não esteja explicitamente no JSON de entrada. Sua função é só interpretar os números prontos — não fazer contas.

Contexto de domínio, para você interpretar corretamente:
- Uma negociação de catira pode envolver vários veículos entrando e vários saindo ao mesmo tempo, mais uma volta em dinheiro (positiva = o usuário recebeu; negativa = o usuário pagou).
- "lucro" de um veículo só existe quando as duas pontas (aquisição e saída) são conhecidas. "qtd_sem_custo" conta veículos vendidos sem ponta de aquisição registrada no sistema — isso é uma lacuna de dado histórico, não um erro do usuário.
- "desequilibrio_declarado" mede a diferença entre o que entrou, o que saiu e a volta em dinheiro declarados numa negociação de troca. Um desvio grande é sinal de qualidade de dado (valor atribuído mal preenchido) ou de avaliação enviesada de veículo — NÃO é lucro nem prejuízo, e você não deve tratá-lo como tal.
- "capital_parado" é dinheiro já investido em veículos que ainda estão em estoque (não vendidos).
- "periodo_anterior" é uma janela imediatamente anterior, de mesma duração, para comparação de tendência.

Responda em português do Brasil, tom direto e prático, como se estivesse aconselhando o dono do negócio pessoalmente. Evite jargão financeiro desnecessário. Seja específico — cite valores e nomes de veículos que aparecem no JSON quando fizer sentido. Se um campo de contagem estiver zerado (ex: nenhuma negociação no período), diga isso com naturalidade em vez de inventar contexto.`;

export const ANALISE_IA_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    resumo: {
      type: "string",
      description: "Um parágrafo (3 a 5 frases) resumindo o desempenho do período em linguagem natural.",
    },
    destaques: {
      type: "array",
      items: { type: "string" },
      description: "Pontos positivos ou padrões notáveis do período, frases curtas.",
    },
    alertas: {
      type: "array",
      items: { type: "string" },
      description:
        "Riscos a observar: capital parado alto, veículo encalhado há muito tempo, pendências acumulando, desequilíbrio declarado alto, etc.",
    },
    recomendacoes: {
      type: "array",
      items: { type: "string" },
      description: "Próximos passos acionáveis para o dono do negócio.",
    },
  },
  required: ["resumo", "destaques", "alertas", "recomendacoes"],
};

export function montarPedido(metricas: MetricasPeriodo): PedidoIA {
  return {
    instrucaoSistema: INSTRUCAO_SISTEMA,
    entrada: JSON.stringify(metricas),
    schemaResposta: ANALISE_IA_JSON_SCHEMA,
    temperatura: 0.3,
  };
}
