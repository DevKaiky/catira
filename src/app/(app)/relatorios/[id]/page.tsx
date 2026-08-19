import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buscarRelatorio } from "@/lib/queries/relatorios";
import MetricasCards from "@/components/relatorios/MetricasCards";
import AnalisePainel from "@/components/relatorios/AnalisePainel";
import { formatarData, formatarMoeda, TIPO_VEICULO_LABEL } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ValorMonetario } from "@/components/catira/ValorMonetario";

const GRANULARIDADE_LABEL: Record<string, string> = {
  diario: "Diário",
  semanal: "Semanal",
  mensal: "Mensal",
  personalizado: "Personalizado",
};

export default async function RelatorioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const relatorio = await buscarRelatorio(id);

  if (!relatorio) {
    notFound();
  }

  const { metricas, analise } = relatorio;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        titulo={`Relatório ${GRANULARIDADE_LABEL[relatorio.granularidade] ?? relatorio.granularidade}`}
        subtitulo={`${formatarData(relatorio.periodo_inicio)} a ${formatarData(relatorio.periodo_fim)} · gerado em ${formatarData(relatorio.created_at.slice(0, 10))}`}
        acao={
          <Link
            href="/relatorios"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="size-4" />
            Todos os relatórios
          </Link>
        }
      />

      <div className="mb-6">
        <Badge variant="outline">
          {relatorio.provedor} · {relatorio.modelo}
        </Badge>
      </div>

      <div className="space-y-6">
        <MetricasCards metricas={metricas} />

        <Tabs defaultValue="analise">
          <TabsList>
            <TabsTrigger value="analise">Análise</TabsTrigger>
            <TabsTrigger value="veiculos">Veículos</TabsTrigger>
          </TabsList>

          <TabsContent value="analise" className="mt-4">
            <AnalisePainel analise={analise} />
          </TabsContent>

          <TabsContent value="veiculos" className="mt-4">
            {metricas.resultado.veiculos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum veículo realizado no período.</p>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Aquisição</TableHead>
                        <TableHead>Despesas</TableHead>
                        <TableHead>Saída</TableHead>
                        <TableHead>Lucro</TableHead>
                        <TableHead>Margem</TableHead>
                        <TableHead>Dias em estoque</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metricas.resultado.veiculos.map((veiculo) => (
                        <TableRow key={veiculo.veiculo_id}>
                          <TableCell className="text-foreground">
                            {TIPO_VEICULO_LABEL[veiculo.tipo]} {veiculo.descricao}
                          </TableCell>
                          <TableCell>
                            {veiculo.valor_aquisicao !== null ? formatarMoeda(veiculo.valor_aquisicao) : "—"}
                          </TableCell>
                          <TableCell>
                            {veiculo.despesas !== undefined ? formatarMoeda(veiculo.despesas) : "—"}
                          </TableCell>
                          <TableCell>{formatarMoeda(veiculo.valor_saida)}</TableCell>
                          <TableCell className="font-medium">
                            {veiculo.lucro !== null ? <ValorMonetario valor={veiculo.lucro} /> : "—"}
                          </TableCell>
                          <TableCell>
                            {veiculo.margem_pct !== null ? `${veiculo.margem_pct.toFixed(1)}%` : "—"}
                          </TableCell>
                          <TableCell>{veiculo.dias_em_estoque ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
            {metricas.resultado.veiculos_omitidos > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                + {metricas.resultado.veiculos_omitidos} veículo(s) não exibido(s) (mostrando os 20 de
                maior impacto).
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
