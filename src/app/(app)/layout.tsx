import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-black/[.08] px-6 py-4 dark:border-white/[.145]">
        <div className="flex items-center gap-8">
          <Link href="/negocios" className="flex flex-col">
            <span className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Catira</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/negocios"
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Negócios
            </Link>
            <Link
              href="/veiculos"
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Veículos
            </Link>
            <Link
              href="/relatorios"
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Relatórios
            </Link>
          </nav>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-black/[.08] px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-300 dark:hover:bg-white/[.06]"
          >
            Sair
          </button>
        </form>
      </header>

      {children}
    </div>
  );
}
