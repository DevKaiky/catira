"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, itemEstaAtivo } from "./NavPrincipal";

/**
 * Barra fixa inferior para mobile (< md). Visibilidade decidida por breakpoint CSS
 * (`md:hidden`) no elemento pai em `(app)/layout.tsx`, nunca por `useIsMobile` — evita flash.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const ativo = itemEstaAtivo(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors",
                  ativo && "text-primary"
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
