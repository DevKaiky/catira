import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { UserCard } from "@/components/layout/UserCard";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

// Mesmo nome de cookie usado internamente por src/components/ui/sidebar.tsx (não exportado por
// lá) para persistir o estado aberto/fechado da sidebar entre reloads.
const SIDEBAR_COOKIE_NAME = "sidebar_state";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const sidebarAberta = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarAberta}>
      <AppSidebar email={user.email ?? ""} />
      <SidebarInset className="pb-24 md:pb-0">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <Link href="/" className="text-base font-semibold text-foreground">
            Catira
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserCard email={user.email ?? ""} compact />
          </div>
        </header>
        <div className="flex-1 px-4 py-6 md:px-8 md:py-10">{children}</div>
      </SidebarInset>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
