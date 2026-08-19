import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buscarVeiculo } from "@/lib/queries/veiculos";
import type { NovoVeiculoInput } from "@/types/database";
import { PageHeader } from "@/components/layout/PageHeader";
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
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        titulo={`Editar ${veiculo.marca} ${veiculo.modelo}`}
        subtitulo="O valor de aquisição não é editado aqui — ele mora na negociação de origem."
        acao={
          <Link
            href={`/veiculos/${id}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        }
      />

      <VeiculoEditarFormClient id={id} valoresIniciais={valoresIniciais} />
    </div>
  );
}
