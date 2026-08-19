"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { gerarRelatorio } from "./actions";
import { hojeSaoPaulo, resolverPeriodo } from "@/lib/relatorios/periodo";
import { formatarData } from "@/lib/format";
import type { GranularidadeRelatorio } from "@/types/relatorios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const CHIPS: { valor: GranularidadeRelatorio; label: string }[] = [
  { valor: "diario", label: "Diário" },
  { valor: "semanal", label: "Semanal" },
  { valor: "mensal", label: "Mensal" },
  { valor: "personalizado", label: "Personalizado" },
];

export default function GerarRelatorioForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [granularidade, setGranularidade] = useState<GranularidadeRelatorio>("mensal");
  const [inicio, setInicio] = useState(hojeSaoPaulo());
  const [fim, setFim] = useState(hojeSaoPaulo());

  const resolvido = resolverPeriodo({
    granularidade,
    inicio: granularidade === "personalizado" ? inicio : undefined,
    fim: granularidade === "personalizado" ? fim : undefined,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await gerarRelatorio({
        granularidade,
        inicio: granularidade === "personalizado" ? inicio : undefined,
        fim: granularidade === "personalizado" ? fim : undefined,
      });

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Período</Label>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip.valor}
              type="button"
              onClick={() => setGranularidade(chip.valor)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                granularidade === chip.valor
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {granularidade === "personalizado" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Início</Label>
            <Input
              type="date"
              className="h-11"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Fim</Label>
            <Input
              type="date"
              className="h-11"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      <Card>
        <CardContent className="text-sm">
          {resolvido.ok ? (
            <span className="text-muted-foreground">
              Intervalo: {formatarData(resolvido.periodo.inicio)} a {formatarData(resolvido.periodo.fim)}
            </span>
          ) : (
            <span className="text-destructive">{resolvido.error}</span>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending || !resolvido.ok} className="h-11">
          {pending ? "Gerando análise... (pode levar alguns segundos)" : "Gerar relatório"}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => router.push("/relatorios")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
