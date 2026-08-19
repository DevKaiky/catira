import "server-only";

import { GoogleGenAI } from "@google/genai";
import type { PedidoIA, ProvedorIA, RespostaIA } from "@/lib/ai/types";

const MODELO_DEFAULT = "gemini-3.7-flash";
const TIMEOUT_MS_DEFAULT = 45_000;

export function criarProvedorGemini(apiKey: string, modelo: string = MODELO_DEFAULT): ProvedorIA {
  const cliente = new GoogleGenAI({ apiKey });

  return {
    nome: "gemini",
    async gerar(pedido: PedidoIA): Promise<RespostaIA> {
      const timeoutMs = pedido.timeoutMs ?? TIMEOUT_MS_DEFAULT;

      let interacao;
      try {
        interacao = await cliente.interactions.create(
          {
            model: modelo,
            input: pedido.entrada,
            system_instruction: pedido.instrucaoSistema,
            // `generation_config` da API de interactions não expõe `temperature` (só
            // thinking_level e afins — conferido em @google/genai/dist/genai.d.ts), então
            // `pedido.temperatura` é ignorado aqui. Segue disponível no contrato `PedidoIA`
            // para os futuros provedores OpenAI-compatible (DeepSeek/Kimi), que o usam.
            generation_config: {
              thinking_level: "low",
            },
            response_format: {
              type: "text",
              mime_type: "application/json",
              schema: pedido.schemaResposta,
            },
          },
          {
            fetchOptions: { signal: AbortSignal.timeout(timeoutMs) },
          }
        );
      } catch (erro) {
        throw new Error(
          `Falha ao consultar a IA (Gemini): ${erro instanceof Error ? erro.message : String(erro)}`
        );
      }

      if (!interacao.output_text) {
        throw new Error("A IA (Gemini) não devolveu nenhum conteúdo de texto.");
      }

      return {
        texto: interacao.output_text,
        provedor: "gemini",
        modelo,
        tokensEntrada: interacao.usage?.total_input_tokens ?? null,
        tokensSaida: interacao.usage?.total_output_tokens ?? null,
      };
    },
  };
}
