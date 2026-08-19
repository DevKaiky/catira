"use client";

import { useRouter } from "next/navigation";
import VeiculoForm from "./VeiculoForm";
import { criarVeiculoAvulso } from "./actions";

export default function VeiculoNovoFormClient() {
  const router = useRouter();

  return (
    <VeiculoForm
      mostrarAquisicao
      textoBotao="Cadastrar veículo"
      onSubmit={(veiculo, aquisicao) => criarVeiculoAvulso({ veiculo, aquisicao })}
      aoCancelar={() => router.push("/veiculos")}
    />
  );
}
