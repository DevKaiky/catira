// Contrato trocável de provedor de IA. Nenhum SDK é importado aqui — cada implementação
// (gemini.ts, futuramente openai-compat.ts) fica isolada atrás deste tipo. As camadas acima
// (Server Actions, prompt.ts) só conhecem `ProvedorIA`, nunca detalhes de um provedor específico.

export type PedidoIA = {
  instrucaoSistema: string;
  /** Prompt do usuário — na prática, as métricas já calculadas, serializadas em texto. */
  entrada: string;
  /** JSON Schema da resposta esperada (shape de `AnaliseIA`). */
  schemaResposta: Record<string, unknown>;
  /** Default 0.3 — redação analítica sobre números prontos, não geração criativa. */
  temperatura?: number;
  /** Default 45_000ms. */
  timeoutMs?: number;
};

export type RespostaIA = {
  /** JSON cru devolvido pelo modelo, ainda NÃO validado — validação é responsabilidade do chamador. */
  texto: string;
  provedor: string;
  modelo: string;
  tokensEntrada: number | null;
  tokensSaida: number | null;
};

export type ProvedorIA = {
  nome: string;
  gerar(pedido: PedidoIA): Promise<RespostaIA>;
};
