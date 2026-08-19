"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTema } from "@/hooks/use-tema";

/**
 * Toggle compacto claro/escuro (2 estados) para a top bar mobile. O tri-state completo
 * (claro/escuro/sistema) fica no menu de tema dentro de `UserCard`.
 */
export function ThemeToggle() {
  const { tema, setTema } = useTema();
  const escuro =
    tema === "escuro" ||
    (tema === "sistema" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-11"
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      onClick={() => setTema(escuro ? "claro" : "escuro")}
    >
      {escuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
