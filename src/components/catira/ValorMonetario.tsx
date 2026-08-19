import { cn } from "@/lib/utils";
import { formatarMoeda } from "@/lib/format";

/** Valor monetário formatado em pt-BR, com cor por sinal (positivo/negativo/neutro). Substitui
 * os helpers `corPorSinal`/`corResultado` duplicados em vários pontos da UI antiga. */
export function ValorMonetario({
  valor,
  className,
  corPorSinal = true,
  prefixo,
}: {
  valor: number;
  className?: string;
  corPorSinal?: boolean;
  prefixo?: string;
}) {
  const cor = !corPorSinal
    ? "text-foreground"
    : valor > 0
      ? "text-positivo"
      : valor < 0
        ? "text-negativo"
        : "text-foreground";

  return (
    <span className={cn(cor, className)}>
      {prefixo}
      {formatarMoeda(valor)}
    </span>
  );
}
