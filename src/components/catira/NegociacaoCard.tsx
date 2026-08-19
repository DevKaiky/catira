import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { ValorMonetario } from "./ValorMonetario";
import { formatarData, TIPO_NEGOCIACAO_LABEL, TIPO_VEICULO_LABEL } from "@/lib/format";
import type { NegociacaoComVeiculos } from "@/types/database";

export function NegociacaoCard({ negociacao }: { negociacao: NegociacaoComVeiculos }) {
  const entradas = negociacao.itens.filter((i) => i.direcao === "entrada");
  const saidas = negociacao.itens.filter((i) => i.direcao === "saida");

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{TIPO_NEGOCIACAO_LABEL[negociacao.tipo]}</Badge>
          <StatusBadge tipo="negociacao" status={negociacao.status} />
          <span className="text-sm text-muted-foreground">
            {formatarData(negociacao.data_negociacao)}
          </span>
          <span className="text-sm font-medium text-foreground">{negociacao.contraparte_nome}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Ações">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/negocios/${negociacao.id}/editar`}>Editar</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {entradas.length > 0 && (
            <div className="space-y-1">
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase">
                <ArrowDownLeft className="size-3.5" /> Entrada
              </p>
              <ul className="space-y-0.5 text-sm text-foreground">
                {entradas.map((item) => (
                  <li key={item.id}>
                    {TIPO_VEICULO_LABEL[item.veiculo.tipo]} {item.veiculo.marca} {item.veiculo.modelo}{" "}
                    — <ValorMonetario valor={item.valor_atribuido} corPorSinal={false} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {saidas.length > 0 && (
            <div className="space-y-1">
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase">
                <ArrowUpRight className="size-3.5" /> Saída
              </p>
              <ul className="space-y-0.5 text-sm text-foreground">
                {saidas.map((item) => (
                  <li key={item.id}>
                    {TIPO_VEICULO_LABEL[item.veiculo.tipo]} {item.veiculo.marca} {item.veiculo.modelo}{" "}
                    — <ValorMonetario valor={item.valor_atribuido} corPorSinal={false} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {negociacao.valor_volta !== 0 && (
          <p className="text-sm text-muted-foreground">
            Volta em dinheiro:{" "}
            <span
              className={
                negociacao.valor_volta > 0 ? "font-medium text-positivo" : "font-medium text-negativo"
              }
            >
              {negociacao.valor_volta > 0 ? "recebeu " : "pagou "}
              <ValorMonetario valor={Math.abs(negociacao.valor_volta)} corPorSinal={false} />
            </span>
          </p>
        )}

        {negociacao.observacoes && (
          <p className="text-sm text-muted-foreground">{negociacao.observacoes}</p>
        )}
      </CardContent>
    </Card>
  );
}
