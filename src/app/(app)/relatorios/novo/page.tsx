import { PageHeader } from "@/components/layout/PageHeader";
import GerarRelatorioForm from "./GerarRelatorioForm";

// Server Actions chamadas a partir desta página herdam este timeout — a chamada de IA pode
// levar alguns segundos. Configurado no segmento da página, não da Server Action (ver
// node_modules/next/dist/docs/.../maxDuration.md).
export const maxDuration = 60;

export default function NovoRelatorioPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <PageHeader
        titulo="Gerar relatório"
        subtitulo="Escolha o período. As métricas são calculadas na hora e enviadas para a IA interpretar."
      />
      <GerarRelatorioForm />
    </div>
  );
}
