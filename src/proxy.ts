import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renomeou middleware.ts -> proxy.ts (mesma função, novo nome).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas, exceto assets estáticos e imagens,
     * para não interferir em performance nem em arquivos públicos.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
