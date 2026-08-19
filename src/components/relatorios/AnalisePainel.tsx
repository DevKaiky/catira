import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AnaliseIA } from "@/types/relatorios";

function Secao({ titulo, itens, className }: { titulo: string; itens: string[]; className?: string }) {
  if (itens.length === 0) return null;

  return (
    <div>
      <h3 className={cn("text-sm font-semibold text-foreground", className)}>{titulo}</h3>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {itens.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span aria-hidden="true">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AnalisePainel({ analise }: { analise: AnaliseIA }) {
  return (
    <Card>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Resumo</h3>
          <p className="mt-2 text-sm text-muted-foreground">{analise.resumo}</p>
        </div>

        <Secao titulo="Destaques" itens={analise.destaques} className="text-positivo" />
        <Secao titulo="Alertas" itens={analise.alertas} className="text-atencao" />
        <Secao titulo="Recomendações" itens={analise.recomendacoes} />
      </CardContent>
    </Card>
  );
}
