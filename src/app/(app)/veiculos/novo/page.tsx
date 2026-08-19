import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import VeiculoNovoFormClient from "./VeiculoNovoFormClient";

export default function NovoVeiculoPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        titulo="Novo veículo"
        subtitulo="Cadastre um veículo direto no estoque, com ou sem valor de aquisição."
        acao={
          <Link
            href="/veiculos"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        }
      />

      <VeiculoNovoFormClient />
    </div>
  );
}
