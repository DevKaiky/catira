"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <form
        action={action}
        className="w-full max-w-sm space-y-5 rounded-xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Catira</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Controle de negociações de veículos
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-zinc-50"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-black/[.08] bg-transparent px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950 dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-zinc-50"
          />
        </div>

        {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
