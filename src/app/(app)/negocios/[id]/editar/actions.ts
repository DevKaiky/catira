"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ItemEdicaoInput, StatusNegociacao, TipoNegociacao } from "@/types/database";

export type EditarNegociacaoInput = {
  id: string;
  tipo: TipoNegociacao;
  data_negociacao: string;
  contraparte_nome: string;
  contraparte_contato: string;
  valor_volta: number;
  status: StatusNegociacao;
  observacoes: string;
  itens: ItemEdicaoInput[];
};

export interface AcaoNegociacaoState {
  error: string | null;
}

export async function editarNegociacao(input: EditarNegociacaoInput): Promise<AcaoNegociacaoState> {
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

  if (input.status === "cancelada") {
    return {
      error:
        'Não é possível marcar uma negociação como "cancelada" pela edição. Para desfazer, exclua a negociação.',
    };
  }

  for (const item of input.itens) {
    if (!Number.isFinite(item.valor_atribuido) || item.valor_atribuido < 0) {
      return { error: "Todo veículo precisa de um valor atribuído válido." };
    }
  }

  const { error } = await supabase.rpc("editar_negociacao", {
    p_negociacao_id: input.id,
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
  revalidatePath("/veiculos");
  redirect("/negocios");
}

export async function excluirNegociacao(id: string): Promise<AcaoNegociacaoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc("excluir_negociacao", { p_negociacao_id: id });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/negocios");
  revalidatePath("/veiculos");
  redirect("/negocios");
}
