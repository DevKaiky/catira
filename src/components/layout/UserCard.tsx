"use client";

import { ChevronsUpDown, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useTema } from "@/hooks/use-tema";
import type { Tema } from "@/lib/tema";
import { signOut } from "@/app/login/actions";

function inicialDoEmail(email: string): string {
  return email.trim().charAt(0).toUpperCase() || "?";
}

const OPCOES_TEMA: { valor: Tema; label: string; icon: typeof Sun }[] = [
  { valor: "claro", label: "Claro", icon: Sun },
  { valor: "escuro", label: "Escuro", icon: Moon },
  { valor: "sistema", label: "Sistema", icon: Monitor },
];

function MenuTemaESair({
  email,
  side = "bottom",
}: {
  email: string;
  side?: "top" | "right" | "bottom" | "left";
}) {
  const { tema, setTema } = useTema();

  return (
    <DropdownMenuContent className="w-56" side={side} align="end" sideOffset={4}>
      <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
        {email}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Tema</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={tema} onValueChange={(valor) => setTema(valor as Tema)}>
        {OPCOES_TEMA.map((opcao) => (
          <DropdownMenuRadioItem key={opcao.valor} value={opcao.valor}>
            <opcao.icon className="size-4" />
            {opcao.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild variant="destructive">
        <form action={signOut} className="w-full">
          <button type="submit" className="flex w-full items-center gap-1.5">
            <LogOut className="size-4" />
            Sair
          </button>
        </form>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

/**
 * Cartão de perfil na base da sidebar (desktop) ou avatar compacto na top bar (mobile).
 * Mesmo menu (tema + sair) nos dois casos.
 */
export function UserCard({ email, compact = false }: { email: string; compact?: boolean }) {
  const { isMobile } = useSidebar();
  const inicial = inicialDoEmail(email);

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Conta"
            className="flex size-11 items-center justify-center rounded-full ring-1 ring-border"
          >
            <Avatar size="sm">
              <AvatarFallback>{inicial}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <MenuTemaESair email={email} />
      </DropdownMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <Avatar size="sm">
                <AvatarFallback>{inicial}</AvatarFallback>
              </Avatar>
              <span className="truncate text-sm">{email}</span>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <MenuTemaESair email={email} side={isMobile ? "bottom" : "right"} />
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
