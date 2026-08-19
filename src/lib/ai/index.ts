import "server-only";

// Ponto único de seleção de provedor de IA. Nenhuma camada acima (Server Actions,
// src/lib/relatorios/*) importa gemini.ts diretamente — todas passam por getProvedorIA().
//
// Como adicionar um novo provedor OpenAI-compatible (DeepSeek, Kimi K2, etc.):
//   1. Criar `src/lib/ai/openai-compat.ts` com uma factory
//      `criarProvedorOpenAICompat({ nome, baseURL, apiKey, model })` que faz
//      `POST {baseURL}/chat/completions` com
//      `response_format: { type: 'json_schema', json_schema: { name, schema, strict: true } }`.
//   2. Registrar o novo caso no switch abaixo.
//   3. Trocar `AI_PROVIDER` na Vercel para o novo valor.
// Nenhum outro arquivo do projeto precisa mudar.

import { criarProvedorGemini } from "@/lib/ai/gemini";
import type { ProvedorIA } from "@/lib/ai/types";

type NomeProvedor = "gemini" | "deepseek" | "kimi";

function resolverApiKey(nomeProvedor: NomeProvedor): string {
  const envEspecifica: Record<NomeProvedor, string | undefined> = {
    gemini: process.env.GEMINI_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    kimi: process.env.KIMI_API_KEY,
  };

  const apiKey = envEspecifica[nomeProvedor] ?? process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      `Nenhuma chave de API configurada para o provedor "${nomeProvedor}". Defina a variável de ` +
        `ambiente específica (ex: GEMINI_API_KEY) ou a neutra AI_API_KEY.`
    );
  }

  return apiKey;
}

export function getProvedorIA(): ProvedorIA {
  const nomeProvedor = (process.env.AI_PROVIDER ?? "gemini") as NomeProvedor;
  const modelo = process.env.AI_MODEL;

  switch (nomeProvedor) {
    case "gemini":
      return criarProvedorGemini(resolverApiKey("gemini"), modelo);
    case "deepseek":
    case "kimi":
      throw new Error(
        `Provedor "${nomeProvedor}" ainda não implementado. Crie src/lib/ai/openai-compat.ts ` +
          `(ver comentário no topo deste arquivo) antes de selecioná-lo via AI_PROVIDER.`
      );
    default:
      throw new Error(
        `AI_PROVIDER="${nomeProvedor}" desconhecido. Valores aceitos: gemini, deepseek, kimi.`
      );
  }
}
