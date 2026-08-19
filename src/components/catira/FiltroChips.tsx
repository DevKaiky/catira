import Link from "next/link";
import { cn } from "@/lib/utils";

export type FiltroChip<T extends string> = { valor: T; label: string };

/** Chips de filtro baseados em Link (preserva `?param=`, sem JS de estado) — sticky no topo. */
export function FiltroChips<T extends string>({
  chips,
  ativo,
  paramNome,
  basePath,
}: {
  chips: FiltroChip<T>[];
  ativo: T;
  paramNome: string;
  basePath: string;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-4 mb-4 flex gap-2 overflow-x-auto bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-8 md:px-8">
      {chips.map((chip) => (
        <Link
          key={chip.valor}
          href={`${basePath}?${paramNome}=${chip.valor}`}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
            ativo === chip.valor
              ? "border-primary bg-primary/10 font-medium text-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}
