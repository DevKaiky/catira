"use client";

import { useCallback, useState } from "react";
import { TEMA_COOKIE, type Tema } from "@/lib/tema";

const UM_ANO_EM_SEGUNDOS = 60 * 60 * 24 * 365;

function aplicarClasseDark(tema: Tema) {
  const escuro =
    tema === "escuro" ||
    (tema === "sistema" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", escuro);
}

function lerTemaCookie(): Tema {
  const match = document.cookie.match(new RegExp(`(?:^|; )${TEMA_COOKIE}=([^;]*)`));
  const valor = match ? decodeURIComponent(match[1]) : null;
  return valor === "claro" || valor === "escuro" || valor === "sistema" ? valor : "sistema";
}

/**
 * Estado + persistência do tema, 100% client-side via cookie (sem Server Action, sem
 * round-trip). O cookie é lido no servidor em `src/lib/tema.ts` para renderizar a classe
 * correta no <html> antes da primeira pintura.
 */
export function useTema() {
  // Lazy initializer: no servidor não há `document`, então cai no default "sistema" (igual ao
  // <html> renderizado por layout.tsx); no cliente já lê o cookie real na primeira renderização,
  // sem precisar de um efeito (que causaria um re-render em cascata logo após o mount).
  const [tema, setTemaState] = useState<Tema>(() =>
    typeof document === "undefined" ? "sistema" : lerTemaCookie()
  );

  const setTema = useCallback((novoTema: Tema) => {
    document.cookie = `${TEMA_COOKIE}=${novoTema}; path=/; max-age=${UM_ANO_EM_SEGUNDOS}; SameSite=Lax`;
    aplicarClasseDark(novoTema);
    setTemaState(novoTema);
  }, []);

  return { tema, setTema };
}
