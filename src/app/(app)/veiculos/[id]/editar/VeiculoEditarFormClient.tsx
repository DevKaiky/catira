"use client";

import { useRouter } from "next/navigation";
import VeiculoForm from "../../novo/VeiculoForm";
import type { NovoVeiculoInput } from "@/types/database";
import { atualizarVeiculo } from "./actions";

export default function VeiculoEditarFormClient({
  id,
  valoresIniciais,
}: {
  id: string;
  valoresIniciais: NovoVeiculoInput;
}) {
  const router = useRouter();

  return (
    <VeiculoForm
      valoresIniciais={valoresIniciais}
      mostrarAquisicao={false}
      textoBotao="Salvar alterações"
      onSubmit={(veiculo) => atualizarVeiculo(id, veiculo)}
      aoCancelar={() => router.push(`/veiculos/${id}`)}
    />
  );
}
