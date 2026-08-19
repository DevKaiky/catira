import Link from "next/link";
import { listarVeiculosEmEstoque } from "@/lib/queries/negociacoes";
import NegociacaoForm from "./NegociacaoForm";

export default async function NovaNegociacaoPage() {
  const veiculosEmEstoque = await listarVeiculosEmEstoque();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            Nova negociação
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Registre uma compra, venda ou troca de veículos.
          </p>
        </div>
        <Link
          href="/negocios"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          Voltar
        </Link>
      </div>

      <NegociacaoForm veiculosEmEstoque={veiculosEmEstoque} />
    </div>
  );
}
