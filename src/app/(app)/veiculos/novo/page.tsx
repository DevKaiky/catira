import Link from "next/link";
import VeiculoNovoFormClient from "./VeiculoNovoFormClient";

export default function NovoVeiculoPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Novo veículo</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Cadastre um veículo direto no estoque, com ou sem valor de aquisição.
          </p>
        </div>
        <Link href="/veiculos" className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
          Voltar
        </Link>
      </div>

      <VeiculoNovoFormClient />
    </div>
  );
}
