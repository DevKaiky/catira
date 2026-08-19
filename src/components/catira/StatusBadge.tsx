import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_VEICULO_LABEL } from "@/lib/format";
import type { StatusNegociacao, StatusVeiculo } from "@/types/database";

// `format.ts` só tem o label de status de VEÍCULO (STATUS_VEICULO_LABEL). O de negociação vive
// aqui — decisão do plano de arquitetura para não tocar em format.ts além do estritamente
// necessário.
export const STATUS_NEGOCIACAO_LABEL: Record<StatusNegociacao, string> = {
  concluida: "Concluída",
  pendente: "Pendente",
  cancelada: "Cancelada",
};

const statusBadgeVariants = cva("gap-1.5 border-transparent", {
  variants: {
    tom: {
      positivo: "bg-positivo-suave text-positivo",
      negativo: "bg-negativo-suave text-negativo",
      atencao: "bg-atencao-suave text-atencao",
      primario: "bg-primary/10 text-primary",
      neutro: "bg-muted text-muted-foreground",
    },
  },
  defaultVariants: { tom: "neutro" },
});

type Tom = NonNullable<VariantProps<typeof statusBadgeVariants>["tom"]>;

const TOM_POR_STATUS_VEICULO: Record<StatusVeiculo, Tom> = {
  em_estoque: "positivo",
  vendido: "primario",
  repassado: "neutro",
};

const TOM_POR_STATUS_NEGOCIACAO: Record<StatusNegociacao, Tom> = {
  concluida: "positivo",
  pendente: "atencao",
  cancelada: "negativo",
};

type StatusBadgeProps =
  | { tipo: "veiculo"; status: StatusVeiculo; className?: string }
  | { tipo: "negociacao"; status: StatusNegociacao; className?: string };

/** Badge de status com cor semântica (nunca usado para tipo de veículo/negociação, que é neutro). */
export function StatusBadge(props: StatusBadgeProps) {
  const { tipo, status, className } = props;
  const tom =
    tipo === "veiculo"
      ? TOM_POR_STATUS_VEICULO[status]
      : TOM_POR_STATUS_NEGOCIACAO[status];
  const label =
    tipo === "veiculo" ? STATUS_VEICULO_LABEL[status] : STATUS_NEGOCIACAO_LABEL[status];

  return (
    <Badge variant="outline" className={cn(statusBadgeVariants({ tom }), className)}>
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {label}
    </Badge>
  );
}
