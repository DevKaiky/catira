"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { NovoVeiculoInput } from "@/types/database";

export interface AtualizarVeiculoState {
  error: string | null;
}

export async function atualizarVeiculo(
  id: string,
  veiculo: NovoVeiculoInput
): Promise<AtualizarVeiculoState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!veiculo.marca.trim() || !veiculo.modelo.trim()) {
    return { error: "Informe ao menos marca e modelo do veículo." };
  }

  const { error } = await supabase
    .from("veiculos")
    .update({
      tipo: veiculo.tipo,
      marca: veiculo.marca.trim(),
      modelo: veiculo.modelo.trim(),
      versao: veiculo.versao || null,
      ano_fabricacao: veiculo.ano_fabricacao ?? null,
      ano_modelo: veiculo.ano_modelo ?? null,
      placa: veiculo.placa || null,
      cor: veiculo.cor || null,
      km: veiculo.km ?? null,
      combustivel: veiculo.combustivel || null,
      transmissao: veiculo.transmissao || null,
      observacoes: veiculo.observacoes || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/veiculos/${id}`);
  revalidatePath("/veiculos");
  redirect(`/veiculos/${id}`);
}
