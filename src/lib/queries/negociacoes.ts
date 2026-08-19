import { createClient } from "@/lib/supabase/server";
import type { NegociacaoComVeiculos, Veiculo } from "@/types/database";

export async function listarNegociacoes(): Promise<NegociacaoComVeiculos[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("negociacoes")
    .select("*, itens:negociacao_veiculos(*, veiculo:veiculos(*))")
    .order("data_negociacao", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao carregar negociações: ${error.message}`);
  }

  return (data ?? []) as unknown as NegociacaoComVeiculos[];
}

export async function buscarNegociacao(id: string): Promise<NegociacaoComVeiculos | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("negociacoes")
    .select("*, itens:negociacao_veiculos(*, veiculo:veiculos(*))")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar negociação: ${error.message}`);
  }

  return data as unknown as NegociacaoComVeiculos | null;
}

export async function listarVeiculosEmEstoque(): Promise<Veiculo[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("veiculos")
    .select("*")
    .eq("status", "em_estoque")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Falha ao carregar veículos em estoque: ${error.message}`);
  }

  return data ?? [];
}
