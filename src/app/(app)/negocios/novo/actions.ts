"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ItemNegociacaoInput,
  StatusNegociacao,
  TipoNegociacao,
} from "@/types/database";

export interface NovaNegociacaoInput {
  tipo: TipoNegociacao;
  data_negociacao: string;
  contraparte_nome: string;
  contraparte_contato: string;
  valor_volta: number;
  status: StatusNegociacao;
  observacoes: string;
  itens: ItemNegociacaoInput[];
}

export interface CriarNegociacaoState {
  error: string | null;
}

export async function criarNegociacao(input: NovaNegociacaoInput): Promise<CriarNegociacaoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!input.contraparte_nome.trim()) {
    return { error: "Informe o nome da contraparte." };
  }

  if (input.itens.length === 0) {
    return { error: "Adicione ao menos um veículo à negociação." };
  }

  for (const item of input.itens) {
    if (!Number.isFinite(item.valor_atribuido) || item.valor_atribuido < 0) {
      return { error: "Todo veículo precisa de um valor atribuído válido." };
    }
    if (item.direcao === "entrada" && (!item.veiculo.marca.trim() || !item.veiculo.modelo.trim())) {
      return { error: "Todo veículo de entrada precisa de marca e modelo." };
    }
    if (item.direcao === "saida" && !item.veiculo_id) {
      return { error: "Selecione o veículo em estoque para cada item de saída." };
    }
  }

  const { error } = await supabase.rpc("criar_negociacao", {
    p_tipo: input.tipo,
    p_data_negociacao: input.data_negociacao,
    p_contraparte_nome: input.contraparte_nome.trim(),
    p_contraparte_contato: input.contraparte_contato.trim() || null,
    p_valor_volta: input.valor_volta,
    p_status: input.status,
    p_observacoes: input.observacoes.trim() || null,
    p_itens: input.itens,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/negocios");
  redirect("/negocios");
}
