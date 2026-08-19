// Tipo + nome do cookie são client-safe (nenhum import de "next/headers" aqui) porque
// `src/hooks/use-tema.ts`, um Client Component, precisa deles. `lerTema()` (Server Component,
// lê o cookie via `next/headers`) mora à parte em `src/lib/tema-servidor.ts` — se estivesse
// neste arquivo, qualquer import a partir de um Client Component quebraria o build do Next
// ("You're importing a module that depends on next/headers...").

export type Tema = "claro" | "escuro" | "sistema";

export const TEMA_COOKIE = "catira-tema";
