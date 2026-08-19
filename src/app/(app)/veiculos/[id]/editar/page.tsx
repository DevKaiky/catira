import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarVeiculo } from "@/lib/queries/veiculos";
import type { NovoVeiculoInput } from "@/types/database";
import VeiculoEditarFormClient from "./VeiculoEditarFormClient";

export default async function EditarVeiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const veiculo = await buscarVeiculo(id);

  if (!veiculo) {
    notFound();
  }

  const valoresIniciais: NovoVeiculoInput = {
    tipo: veiculo.tipo,
    marca: veiculo.marca,
    modelo: veiculo.modelo,
    versao: veiculo.versao ?? undefined,
    ano_fabricacao: veiculo.ano_fabricacao ?? undefined,
    ano_modelo: veiculo.ano_modelo ?? undefined,
    placa: veiculo.placa ?? undefined,
    cor: veiculo.cor ?? undefined,
    km: veiculo.km ?? undefined,
    combustivel: veiculo.combustivel ?? undefined,
    transmissao: veiculo.transmissao ?? undefined,
    observacoes: veiculo.observacoes ?? undefined,
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Editar {veiculo.marca} {veiculo.modelo}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            O valor de aquisição não é editado aqui — ele mora na negociação de origem.
          </p>
        </div>
        <Link
          href={`/veiculos/${id}`}
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          Voltar
        </Link>
      </div>

      <VeiculoEditarFormClient id={id} valoresIniciais={valoresIniciais} />
    </div>
  );
}
