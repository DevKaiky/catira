"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { CategoriaDespesa } from "@/types/database";
import { CATEGORIA_DESPESA_LABEL } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/catira/NativeSelect";
import { criarDespesa } from "./actions";
import { hojeSaoPaulo } from "@/lib/relatorios/periodo";

export default function DespesaForm({ veiculoId }: { veiculoId: string }) {
  const [pending, startTransition] = useTransition();
  const [categoria, setCategoria] = useState<CategoriaDespesa>("outro");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hojeSaoPaulo());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const result = await criarDespesa({
        veiculo_id: veiculoId,
        categoria,
        descricao,
        valor: Number(valor),
        data,
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Despesa adicionada.");
      setDescricao("");
      setValor("");
      setData(hojeSaoPaulo());
      setCategoria("outro");
    });
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label>Categoria</Label>
              <NativeSelect
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaDespesa)}
              >
                {Object.entries(CATEGORIA_DESPESA_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Descrição</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
          </div>

          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            <Plus />
            {pending ? "Adicionando..." : "Adicionar despesa"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
