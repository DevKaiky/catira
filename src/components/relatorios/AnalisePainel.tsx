import type { AnaliseIA } from "@/types/relatorios";

function Secao({ titulo, itens, corTitulo }: { titulo: string; itens: string[]; corTitulo?: string }) {
  if (itens.length === 0) return null;

  return (
    <div>
      <h3 className={`text-sm font-semibold ${corTitulo ?? "text-zinc-950 dark:text-zinc-50"}`}>
        {titulo}
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
        {itens.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span aria-hidden="true">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AnalisePainel({ analise }: { analise: AnaliseIA }) {
  return (
    <div className="space-y-6 rounded-lg border border-black/[.08] p-6 dark:border-white/[.145]">
      <div>
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Resumo</h3>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{analise.resumo}</p>
      </div>

      <Secao
        titulo="Destaques"
        itens={analise.destaques}
        corTitulo="text-emerald-700 dark:text-emerald-400"
      />
      <Secao titulo="Alertas" itens={analise.alertas} corTitulo="text-amber-700 dark:text-amber-400" />
      <Secao titulo="Recomendações" itens={analise.recomendacoes} />
    </div>
  );
}
