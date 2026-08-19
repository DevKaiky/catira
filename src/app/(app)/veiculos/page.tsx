import Link from "next/link";
import { listarVeiculos, type FiltroStatusVeiculo } from "@/lib/queries/veiculos";
import { formatarMoeda, STATUS_VEICULO_LABEL, TIPO_VEICULO_LABEL } from "@/lib/format";

const FILTROS: { valor: FiltroStatusVeiculo; label: string }[] = [
  { valor: "em_estoque", label: "Em estoque" },
  { valor: "vendido", label: "Vendidos" },
  { valor: "repassado", label: "Repassados" },
  { valor: "todos", label: "Todos" },
];

function statusBadgeClass(status: string): string {
  if (status === "em_estoque") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  }
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
}

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
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Veículos</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Estoque de veículos, com ou sem negociação de origem.
          </p>
        </div>
        <Link
          href="/veiculos/novo"
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          + Novo veículo
        </Link>
      </div>

      <div className="mb-6 flex gap-2">
        {FILTROS.map((filtro) => (
          <Link
            key={filtro.valor}
            href={`/veiculos?status=${filtro.valor}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              filtroAtivo === filtro.valor
                ? "bg-zinc-100 font-medium text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-600 hover:bg-black/[.04] dark:text-zinc-400 dark:hover:bg-white/[.06]"
            }`}
          >
            {filtro.label}
          </Link>
        ))}
      </div>

      {veiculos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/[.12] p-8 text-center text-sm text-zinc-500 dark:border-white/[.15] dark:text-zinc-400">
          Nenhum veículo encontrado para este filtro.
        </p>
      ) : (
        <ul className="space-y-3">
          {veiculos.map((veiculo) => (
            <li key={veiculo.id}>
              <Link
                href={`/veiculos/${veiculo.id}`}
                className="block rounded-lg border border-black/[.08] p-4 transition-colors hover:bg-black/[.02] dark:border-white/[.145] dark:hover:bg-white/[.04]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {TIPO_VEICULO_LABEL[veiculo.tipo]}
                    </span>
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {veiculo.marca} {veiculo.modelo}
                      {veiculo.ano_modelo ? ` ${veiculo.ano_modelo}` : ""}
                    </span>
                    {veiculo.placa && (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">{veiculo.placa}</span>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(veiculo.status)}`}>
                    {STATUS_VEICULO_LABEL[veiculo.status]}
                  </span>
                </div>

                <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {veiculo.aquisicao !== null ? (
                    <span>Aquisição: {formatarMoeda(veiculo.aquisicao.valor)}</span>
                  ) : (
                    <span className="text-zinc-500 dark:text-zinc-400">
                      sem aquisição registrada
                    </span>
                  )}
                  {veiculo.total_despesas > 0 && (
                    <span> · Despesas: {formatarMoeda(veiculo.total_despesas)}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
