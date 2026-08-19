import Link from "next/link";
import { Car, Plus } from "lucide-react";
import { listarVeiculos, type FiltroStatusVeiculo } from "@/lib/queries/veiculos";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { FiltroChips, type FiltroChip } from "@/components/catira/FiltroChips";
import { VeiculoCard } from "@/components/catira/VeiculoCard";
import { EmptyState } from "@/components/catira/EmptyState";

const FILTROS: FiltroChip<FiltroStatusVeiculo>[] = [
  { valor: "em_estoque", label: "Em estoque" },
  { valor: "vendido", label: "Vendidos" },
  { valor: "repassado", label: "Repassados" },
  { valor: "todos", label: "Todos" },
];

export default async function VeiculosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filtroAtivo: FiltroStatusVeiculo =
    status === "vendido" || status === "repassado" || status === "todos" ? status : "em_estoque";

  const veiculos = await listarVeiculos(filtroAtivo);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        titulo="Veículos"
        subtitulo="Estoque de veículos, com ou sem negociação de origem."
        acao={
          <Button asChild>
            <Link href="/veiculos/novo">
              <Plus />
              Novo veículo
            </Link>
          </Button>
        }
      />

      <FiltroChips chips={FILTROS} ativo={filtroAtivo} paramNome="status" basePath="/veiculos" />

      {veiculos.length === 0 ? (
        <EmptyState icon={Car} titulo="Nenhum veículo encontrado para este filtro." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {veiculos.map((veiculo) => (
            <VeiculoCard key={veiculo.id} veiculo={veiculo} />
          ))}
        </div>
      )}
    </div>
  );
}
