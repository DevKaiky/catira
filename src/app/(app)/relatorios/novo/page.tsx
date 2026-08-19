import GerarRelatorioForm from "./GerarRelatorioForm";

// Server Actions chamadas a partir desta página herdam este timeout — a chamada de IA pode
// levar alguns segundos. Configurado no segmento da página, não da Server Action (ver
// node_modules/next/dist/docs/.../maxDuration.md).
export const maxDuration = 60;

export default function NovoRelatorioPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Gerar relatório</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Escolha o período. As métricas são calculadas na hora e enviadas para a IA interpretar.
        </p>
      </div>
      <GerarRelatorioForm />
    </div>
  );
}
