import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { ValorMonetario } from "./ValorMonetario";
import { TIPO_VEICULO_LABEL, formatarMoeda } from "@/lib/format";
import { diferencaEmDias, hojeSaoPaulo } from "@/lib/relatorios/periodo";
import type { VeiculoResumo } from "@/lib/queries/veiculos";

export function VeiculoCard({ veiculo }: { veiculo: VeiculoResumo }) {
  const specs = [
    veiculo.placa,
    veiculo.cor,
    veiculo.km !== null ? `${veiculo.km.toLocaleString("pt-BR")} km` : null,
    veiculo.combustivel,
  ]
    .filter(Boolean)
    .join(" · ");

  const diasEmEstoque =
    veiculo.status === "em_estoque" && veiculo.aquisicao
      ? diferencaEmDias(veiculo.aquisicao.data, hojeSaoPaulo())
      : null;

  return (
    <Link href={`/veiculos/${veiculo.id}`} className="block h-full">
      <Card className="h-full transition-colors hover:bg-muted/40">
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">
                {veiculo.marca} {veiculo.modelo}
                {veiculo.ano_modelo ? ` ${veiculo.ano_modelo}` : ""}
              </p>
              <Badge variant="outline" className="mt-1">
                {TIPO_VEICULO_LABEL[veiculo.tipo]}
              </Badge>
            </div>
            <StatusBadge tipo="veiculo" status={veiculo.status} />
          </div>

          {specs && <p className="font-mono text-xs text-muted-foreground">{specs}</p>}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              Aquisição:{" "}
              {veiculo.aquisicao ? (
                <ValorMonetario valor={veiculo.aquisicao.valor} corPorSinal={false} />
              ) : (
                "—"
              )}
            </span>
            {veiculo.total_despesas > 0 && (
              <span className="text-atencao">Despesas: {formatarMoeda(veiculo.total_despesas)}</span>
            )}
            {diasEmEstoque !== null && <span>{diasEmEstoque}d em estoque</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
