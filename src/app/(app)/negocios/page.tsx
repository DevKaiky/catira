import Link from "next/link";
import { listarNegociacoes } from "@/lib/queries/negociacoes";
import {
  formatarData,
  formatarMoeda,
  TIPO_NEGOCIACAO_LABEL,
  TIPO_VEICULO_LABEL,
} from "@/lib/format";

export default async function NegociosPage() {
  const negociacoes = await listarNegociacoes();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Negócios</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Histórico de compras, vendas e trocas.
          </p>
        </div>
        <Link
          href="/negocios/novo"
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          + Novo negócio
        </Link>
      </div>

      {negociacoes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-black/[.12] p-8 text-center text-sm text-zinc-500 dark:border-white/[.15] dark:text-zinc-400">
          Nenhum negócio registrado ainda.
        </p>
      ) : (
        <ul className="space-y-3">
          {negociacoes.map((negociacao) => {
            const entradas = negociacao.itens.filter((i) => i.direcao === "entrada");
            const saidas = negociacao.itens.filter((i) => i.direcao === "saida");

            return (
              <li
                key={negociacao.id}
                className="rounded-lg border border-black/[.08] p-4 dark:border-white/[.145]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {TIPO_NEGOCIACAO_LABEL[negociacao.tipo]}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {formatarData(negociacao.data_negociacao)}
                    </span>
                    {negociacao.status !== "concluida" && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {negociacao.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {negociacao.contraparte_nome}
                    </span>
                    <Link
                      href={`/negocios/${negociacao.id}/editar`}
                      className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
                    >
                      Editar
                    </Link>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  {entradas.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase text-zinc-400">Entrada</p>
                      <ul className="mt-1 space-y-0.5 text-zinc-700 dark:text-zinc-300">
                        {entradas.map((item) => (
                          <li key={item.id}>
                            {TIPO_VEICULO_LABEL[item.veiculo.tipo]} {item.veiculo.marca}{" "}
                            {item.veiculo.modelo} — {formatarMoeda(item.valor_atribuido)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {saidas.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase text-zinc-400">Saída</p>
                      <ul className="mt-1 space-y-0.5 text-zinc-700 dark:text-zinc-300">
                        {saidas.map((item) => (
                          <li key={item.id}>
                            {TIPO_VEICULO_LABEL[item.veiculo.tipo]} {item.veiculo.marca}{" "}
                            {item.veiculo.modelo} — {formatarMoeda(item.valor_atribuido)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {negociacao.valor_volta !== 0 && (
                  <p className="mt-3 text-sm">
                    Volta em dinheiro:{" "}
                    <span
                      className={
                        negociacao.valor_volta > 0
                          ? "font-medium text-emerald-600 dark:text-emerald-400"
                          : "font-medium text-red-600 dark:text-red-400"
                      }
                    >
                      {negociacao.valor_volta > 0 ? "recebeu " : "pagou "}
                      {formatarMoeda(Math.abs(negociacao.valor_volta))}
                    </span>
                  </p>
                )}

                {negociacao.observacoes && (
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {negociacao.observacoes}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
