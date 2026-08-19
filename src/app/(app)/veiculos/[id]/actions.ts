"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CategoriaDespesa } from "@/types/database";

export interface AcaoState {
  error: string | null;
}

export type NovaDespesaInput = {
  veiculo_id: string;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  data: string;
};

export async function criarDespesa(input: NovaDespesaInput): Promise<AcaoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!input.descricao.trim()) {
    return { error: "Informe uma descrição para a despesa." };
  }

  if (!Number.isFinite(input.valor) || input.valor <= 0) {
    return { error: "Informe um valor válido (maior que zero)." };
  }

  const { error } = await supabase.from("despesas_veiculo").insert({
    veiculo_id: input.veiculo_id,
    categoria: input.categoria,
    descricao: input.descricao.trim(),
    valor: input.valor,
    data: input.data,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/veiculos/${input.veiculo_id}`);
  return { error: null };
}

export async function excluirDespesa(id: string, veiculoId: string): Promise<AcaoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("despesas_veiculo").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/veiculos/${veiculoId}`);
  return { error: null };
}

export async function excluirVeiculo(id: string): Promise<AcaoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("veiculos").delete().eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return {
        error: "Este veículo participa de uma negociação registrada. Exclua a negociação primeiro.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/veiculos");
  redirect("/veiculos");
}
