import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buscarNegociacao } from "@/lib/queries/negociacoes";
import { PageHeader } from "@/components/layout/PageHeader";
import EditarNegociacaoForm from "./EditarNegociacaoForm";

export default async function EditarNegociacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const negociacao = await buscarNegociacao(id);

  if (!negociacao) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        titulo="Editar negociação"
        subtitulo="Corrija dados da negociação e o valor atribuído a cada veículo."
        acao={
          <Link
            href="/negocios"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        }
      />

      <EditarNegociacaoForm negociacao={negociacao} />
    </div>
  );
}
