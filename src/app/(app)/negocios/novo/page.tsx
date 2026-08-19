import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listarVeiculosEmEstoque } from "@/lib/queries/negociacoes";
import { PageHeader } from "@/components/layout/PageHeader";
import NegociacaoForm from "./NegociacaoForm";

export default async function NovaNegociacaoPage() {
  const veiculosEmEstoque = await listarVeiculosEmEstoque();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        titulo="Nova negociação"
        subtitulo="Registre uma compra, venda ou troca de veículos."
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

      <NegociacaoForm veiculosEmEstoque={veiculosEmEstoque} />
    </div>
  );
}
