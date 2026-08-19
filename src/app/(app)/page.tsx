import Link from "next/link";
import { ArrowLeftRight, Car, Plus } from "lucide-react";
import { resolverPeriodo } from "@/lib/relatorios/periodo";
import { buscarDadosDoPeriodo } from "@/lib/queries/relatorios";
import { calcularMetricas } from "@/lib/relatorios/metricas";
import { listarNegociacoes } from "@/lib/queries/negociacoes";
import { listarVeiculos } from "@/lib/queries/veiculos";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/catira/EmptyState";
import { NegociacaoCard } from "@/components/catira/NegociacaoCard";
import { VeiculoCard } from "@/components/catira/VeiculoCard";
import MetricasCards from "@/components/relatorios/MetricasCards";

const QUANTIDADE_RECENTES = 5;

export default async function DashboardPage() {
  // Reuso total das métricas de relatório (sem IA, sem query nova) — mesma composição usada em
  // /relatorios/[id], só que sempre para o mês corrente.
  const resolvido = resolverPeriodo({ granularidade: "mensal" });
  if (!resolvido.ok) {
    // "mensal" nunca depende de input do usuário — só falharia com o relógio do servidor quebrado.
    throw new Error(resolvido.error);
  }
  const { periodo, periodoAnterior } = resolvido;

  const [dados, negociacoes, veiculosEmEstoque] = await Promise.all([
    buscarDadosDoPeriodo(periodo, periodoAnterior),
    listarNegociacoes(),
    listarVeiculos("em_estoque"),
  ]);

  const metricas = calcularMetricas(dados, periodo, periodoAnterior, "mensal");

  const ultimosNegocios = negociacoes.slice(0, QUANTIDADE_RECENTES);
  const emEstoqueHaMaisTempo = [...veiculosEmEstoque]
    .sort((a, b) => {
      const dataA = a.aquisicao?.data ?? a.created_at;
      const dataB = b.aquisicao?.data ?? b.created_at;
      return dataA.localeCompare(dataB);
    })
    .slice(0, QUANTIDADE_RECENTES);

  const mesAtual = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        titulo="Visão geral"
        subtitulo={`Mensal · ${mesAtual}`}
        acao={
          <Button asChild>
            <Link href="/negocios/novo">
              <Plus />
              Novo negócio
            </Link>
          </Button>
        }
      />

      <div className="space-y-8">
        <MetricasCards metricas={metricas} />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Últimos negócios</h2>
              <Link href="/negocios" className="text-sm text-muted-foreground hover:underline">
                Ver todos
              </Link>
            </div>
            {ultimosNegocios.length === 0 ? (
              <EmptyState icon={ArrowLeftRight} titulo="Nenhum negócio registrado ainda." />
            ) : (
              <div className="space-y-3">
                {ultimosNegocios.map((negociacao) => (
                  <NegociacaoCard key={negociacao.id} negociacao={negociacao} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Em estoque há mais tempo</h2>
              <Link href="/veiculos" className="text-sm text-muted-foreground hover:underline">
                Ver todos
              </Link>
            </div>
            {emEstoqueHaMaisTempo.length === 0 ? (
              <EmptyState icon={Car} titulo="Nenhum veículo em estoque." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {emEstoqueHaMaisTempo.map((veiculo) => (
                  <VeiculoCard key={veiculo.id} veiculo={veiculo} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
