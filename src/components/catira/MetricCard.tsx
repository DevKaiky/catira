import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Card de métrica com título, valor grande e delta opcional (seta ▲/▼ colorida — sem
 * sparkline, não há série temporal disponível ainda; ver plano de arquitetura seção 6). */
export function MetricCard({
  titulo,
  valor,
  valorClassName,
  delta,
  rodape,
}: {
  titulo: string;
  valor: ReactNode;
  valorClassName?: string;
  delta?: { valor: number; formatado: string } | null;
  rodape?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className={cn("text-2xl font-semibold text-foreground", valorClassName)}>{valor}</p>
        {delta && (
          <p
            className={cn(
              "text-xs font-medium",
              delta.valor > 0
                ? "text-positivo"
                : delta.valor < 0
                  ? "text-negativo"
                  : "text-muted-foreground"
            )}
          >
            {delta.valor > 0 ? "▲" : delta.valor < 0 ? "▼" : "—"} {delta.formatado}
          </p>
        )}
        {rodape && <p className="text-xs text-muted-foreground">{rodape}</p>}
      </CardContent>
    </Card>
  );
}
