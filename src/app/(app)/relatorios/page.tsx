import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { listarRelatorios } from "@/lib/queries/relatorios";
import { formatarData } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/catira/EmptyState";
import { ValorMonetario } from "@/components/catira/ValorMonetario";

const GRANULARIDADE_LABEL: Record<string, string> = {
  diario: "Diário",
  semanal: "Semanal",
  mensal: "Mensal",
  personalizado: "Personalizado",
};

export default async function RelatoriosPage() {
  const relatorios = await listarRelatorios();

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        titulo="Relatórios"
        subtitulo="Análises de IA geradas sob demanda a partir das suas negociações."
        acao={
          <Button asChild>
            <Link href="/relatorios/novo">
              <Plus />
              Gerar relatório
            </Link>
          </Button>
        }
      />

      {relatorios.length === 0 ? (
        <EmptyState icon={FileText} titulo="Nenhum relatório gerado ainda." />
      ) : (
        <div className="space-y-3">
          {relatorios.map((relatorio) => {
            const lucro = relatorio.metricas.resultado.lucro_bruto;
            return (
              <Link key={relatorio.id} href={`/relatorios/${relatorio.id}`} className="block">
                <Card className="transition-colors hover:bg-muted/40">
                  <CardContent>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {GRANULARIDADE_LABEL[relatorio.granularidade] ?? relatorio.granularidade}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatarData(relatorio.periodo_inicio)} a {formatarData(relatorio.periodo_fim)}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">
                        <ValorMonetario valor={lucro} />
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {relatorio.analise.resumo}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
