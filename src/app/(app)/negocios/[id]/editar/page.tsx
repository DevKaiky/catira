import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarNegociacao } from "@/lib/queries/negociacoes";
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
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Editar negociação
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Corrija dados da negociação e o valor atribuído a cada veículo.
          </p>
        </div>
        <Link href="/negocios" className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
          Voltar
        </Link>
      </div>

      <EditarNegociacaoForm negociacao={negociacao} />
    </div>
  );
}
