import "server-only";
import { cookies } from "next/headers";
import { TEMA_COOKIE, type Tema } from "@/lib/tema";

/** Lê a preferência de tema salva em cookie (Server Component). Default: "sistema". */
export async function lerTema(): Promise<Tema> {
  const cookieStore = await cookies();
  const valor = cookieStore.get(TEMA_COOKIE)?.value;

  if (valor === "claro" || valor === "escuro" || valor === "sistema") {
    return valor;
  }

  return "sistema";
}
