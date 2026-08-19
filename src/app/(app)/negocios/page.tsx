import Link from "next/link";
import { Plus, ArrowLeftRight } from "lucide-react";
import { listarNegociacoes } from "@/lib/queries/negociacoes";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/catira/EmptyState";
import { NegociacaoCard } from "@/components/catira/NegociacaoCard";

export default async function NegociosPage() {
  const negociacoes = await listarNegociacoes();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        titulo="Negócios"
        subtitulo="Histórico de compras, vendas e trocas."
        acao={
          <Button asChild>
            <Link href="/negocios/novo">
              <Plus />
              Novo negócio
            </Link>
          </Button>
        }
      />

      {negociacoes.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} titulo="Nenhum negócio registrado ainda." />
      ) : (
        <div className="space-y-3">
          {negociacoes.map((negociacao) => (
            <NegociacaoCard key={negociacao.id} negociacao={negociacao} />
          ))}
        </div>
      )}
    </div>
  );
}
