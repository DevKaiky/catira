import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavPrincipal } from "./NavPrincipal";
import { UserCard } from "./UserCard";

/** Sidebar desktop (>= md). Server Component — só recebe o e-mail do usuário já resolvido. */
export function AppSidebar({ email }: { email: string }) {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 py-1">
          <Link href="/" className="text-base font-semibold text-foreground">
            Catira
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavPrincipal />
      </SidebarContent>
      <SidebarFooter>
        <UserCard email={email} />
      </SidebarFooter>
    </Sidebar>
  );
}
