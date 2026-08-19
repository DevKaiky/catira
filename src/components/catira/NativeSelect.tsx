import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * `<select>` nativo estilizado para espelhar o `Input` do shadcn. Deliberadamente NÃO usamos o
 * componente `select` do shadcn (Radix): o nativo abre o picker do sistema no mobile, melhor
 * para o caso de uso do app (usuário na rua, uma mão). Ver plano de arquitetura seção 2.
 */
export function NativeSelect({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80",
        className
      )}
      {...props}
    />
  );
}
