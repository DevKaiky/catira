import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buscarVeiculo } from "@/lib/queries/veiculos";
import { calcularResultadoVeiculo } from "@/lib/veiculos/resultado";
import { hojeSaoPaulo } from "@/lib/relatorios/periodo";
import {
  CATEGORIA_DESPESA_LABEL,
  formatarData,
  formatarMoeda,
  TIPO_NEGOCIACAO_LABEL,
  TIPO_VEICULO_LABEL,
} from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/catira/StatusBadge";
import { ValorMonetario } from "@/components/catira/ValorMonetario";
import DespesaForm from "./DespesaForm";
import { ExcluirDespesaButton, VeiculoAcoes } from "./BotoesAcao";

export default async function VeiculoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const veiculo = await buscarVeiculo(id);

  if (!veiculo) {
    notFound();
  }

  const entrada = veiculo.movimentacoes.find((m) => m.direcao === "entrada") ?? null;
  const saida =
    veiculo.movimentacoes.find((m) => m.direcao === "saida" && m.negociacao.status !== "cancelada") ??
    null;
  const totalDespesas = veiculo.despesas.reduce((soma, d) => soma + d.valor, 0);

  const resultado = calcularResultadoVeiculo({
    valorAquisicao: entrada ? entrada.valor_atribuido : null,
    dataAquisicao: entrada ? entrada.negociacao.data_negociacao : null,
    valorSaida: saida ? saida.valor_atribuido : null,
    dataSaida: saida ? saida.negociacao.data_negociacao : null,
    despesas: totalDespesas,
    hoje: hojeSaoPaulo(),
  });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        titulo={`${veiculo.marca} ${veiculo.modelo}${veiculo.ano_modelo ? ` ${veiculo.ano_modelo}` : ""}`}
        subtitulo={
          [veiculo.versao, veiculo.placa, veiculo.cor, veiculo.combustivel].filter(Boolean).join(" · ") ||
          "Sem detalhes adicionais"
        }
        acao={
          <>
            <VeiculoAcoes id={veiculo.id} />
            <Link
              href="/veiculos"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
            >
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{TIPO_VEICULO_LABEL[veiculo.tipo]}</Badge>
        <StatusBadge tipo="veiculo" status={veiculo.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <Tabs defaultValue="resultado">
            <TabsList>
              <TabsTrigger value="resultado">Resultado</TabsTrigger>
              <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
              <TabsTrigger value="despesas">Despesas</TabsTrigger>
            </TabsList>

            <TabsContent value="resultado" className="mt-4">
              <Card>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <Estatistica titulo="Aquisição" valor={entrada ? formatarMoeda(entrada.valor_atribuido) : "—"} />
                  <Estatistica titulo="Despesas" valor={formatarMoeda(resultado.despesas)} tomAtencao />
                  <Estatistica
                    titulo="Custo total"
                    valor={resultado.custo_total !== null ? formatarMoeda(resultado.custo_total) : "—"}
                  />
                  <Estatistica titulo="Saída" valor={saida ? formatarMoeda(saida.valor_atribuido) : "—"} />
                  <Estatistica
                    titulo="Lucro"
                    valor={resultado.lucro !== null ? <ValorMonetario valor={resultado.lucro} /> : "—"}
                  />
                  <Estatistica
                    titulo="Margem"
                    valor={resultado.margem_pct !== null ? `${resultado.margem_pct.toFixed(1)}%` : "—"}
                  />
                  <Estatistica titulo="Dias em estoque" valor={resultado.dias_em_estoque ?? "—"} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="movimentacoes" className="mt-4">
              {veiculo.movimentacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma negociação vinculada.</p>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Direção</TableHead>
                          <TableHead>Contraparte</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {veiculo.movimentacoes.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>{formatarData(m.negociacao.data_negociacao)}</TableCell>
                            <TableCell>{TIPO_NEGOCIACAO_LABEL[m.negociacao.tipo]}</TableCell>
                            <TableCell>{m.direcao === "entrada" ? "Entrada" : "Saída"}</TableCell>
                            <TableCell>{m.negociacao.contraparte_nome}</TableCell>
                            <TableCell>{formatarMoeda(m.valor_atribuido)}</TableCell>
                            <TableCell>
                              <Link
                                href={`/negocios/${m.negociacao_id}/editar`}
                                className="text-sm text-muted-foreground hover:underline"
                              >
                                Editar negociação
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="despesas" className="mt-4 space-y-4">
              <DespesaForm veiculoId={veiculo.id} />

              {veiculo.despesas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma despesa lançada.</p>
              ) : (
                <ul className="space-y-2">
                  {veiculo.despesas.map((despesa) => (
                    <li key={despesa.id}>
                      <Card>
                        <CardContent className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium text-foreground">
                              {CATEGORIA_DESPESA_LABEL[despesa.categoria]}
                            </span>
                            <span className="text-muted-foreground"> · {despesa.descricao}</span>
                            <span className="text-muted-foreground"> · {formatarData(despesa.data)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-foreground">
                              {formatarMoeda(despesa.valor)}
                            </span>
                            <ExcluirDespesaButton id={despesa.id} veiculoId={veiculo.id} />
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm">Dados do veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <DadoLinha label="Tipo" valor={TIPO_VEICULO_LABEL[veiculo.tipo]} />
            <DadoLinha label="Versão" valor={veiculo.versao} />
            <DadoLinha label="Ano fab./modelo" valor={[veiculo.ano_fabricacao, veiculo.ano_modelo].filter(Boolean).join("/") || null} />
            <DadoLinha label="Placa" valor={veiculo.placa} />
            <DadoLinha label="Cor" valor={veiculo.cor} />
            <DadoLinha label="KM" valor={veiculo.km !== null ? veiculo.km.toLocaleString("pt-BR") : null} />
            <DadoLinha label="Combustível" valor={veiculo.combustivel} />
            <DadoLinha label="Transmissão" valor={veiculo.transmissao} />
            {veiculo.observacoes && (
              <div className="pt-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">Observações</p>
                <p className="mt-1 text-foreground">{veiculo.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Estatistica({
  titulo,
  valor,
  tomAtencao = false,
}: {
  titulo: string;
  valor: React.ReactNode;
  tomAtencao?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{titulo}</p>
      <p className={`mt-1 text-sm font-semibold ${tomAtencao ? "text-atencao" : "text-foreground"}`}>{valor}</p>
    </div>
  );
}

function DadoLinha({ label, valor }: { label: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{valor}</span>
    </div>
  );
}
