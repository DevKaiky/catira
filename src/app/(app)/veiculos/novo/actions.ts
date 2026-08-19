"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AquisicaoRetroativaInput, NovoVeiculoInput } from "@/types/database";

export type NovoVeiculoAvulsoInput = {
  veiculo: NovoVeiculoInput;
  aquisicao: AquisicaoRetroativaInput | null;
};

export interface CriarVeiculoAvulsoState {
  error: string | null;
}

export async function criarVeiculoAvulso(
  input: NovoVeiculoAvulsoInput
): Promise<CriarVeiculoAvulsoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!input.veiculo.marca.trim() || !input.veiculo.modelo.trim()) {
    return { error: "Informe ao menos marca e modelo do veículo." };
  }

  if (input.aquisicao && (!Number.isFinite(input.aquisicao.valor) || input.aquisicao.valor < 0)) {
    return { error: "Valor de aquisição inválido." };
  }

  const { data: veiculoId, error } = await supabase.rpc("criar_veiculo_avulso", {
    p_veiculo: input.veiculo,
    p_aquisicao: input.aquisicao,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/veiculos");
  redirect(`/veiculos/${veiculoId}`);
}
