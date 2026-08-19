"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { editarNegociacao, excluirNegociacao } from "./actions";
import type { NegociacaoComVeiculos, StatusNegociacao, TipoNegociacao } from "@/types/database";
import { TIPO_VEICULO_LABEL } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { NativeSelect } from "@/components/catira/NativeSelect";

type ItemFormState = {
  id: string;
  direcao: "entrada" | "saida";
  descricao: string;
  valorAtribuido: string;
  condicao: string;
};

export default function EditarNegociacaoForm({
  negociacao,
}: {
  negociacao: NegociacaoComVeiculos;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [excluindo, startExclusao] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<TipoNegociacao>(negociacao.tipo);
  const [dataNegociacao, setDataNegociacao] = useState(negociacao.data_negociacao);
  const [contraparteNome, setContraparteNome] = useState(negociacao.contraparte_nome);
  const [contraparteContato, setContraparteContato] = useState(negociacao.contraparte_contato ?? "");
  const [voltaDirecao, setVoltaDirecao] = useState<"nenhuma" | "recebi" | "paguei">(
    negociacao.valor_volta > 0 ? "recebi" : negociacao.valor_volta < 0 ? "paguei" : "nenhuma"
  );
  const [voltaValor, setVoltaValor] = useState(
    negociacao.valor_volta !== 0 ? String(Math.abs(negociacao.valor_volta)) : ""
  );
  const [status, setStatus] = useState<StatusNegociacao>(
    negociacao.status === "cancelada" ? "concluida" : negociacao.status
  );
  const [observacoes, setObservacoes] = useState(negociacao.observacoes ?? "");
  const [itens, setItens] = useState<ItemFormState[]>(
    negociacao.itens.map((item) => ({
      id: item.id,
      direcao: item.direcao,
      descricao: `${TIPO_VEICULO_LABEL[item.veiculo.tipo]} · ${item.veiculo.marca} ${item.veiculo.modelo}${
        item.veiculo.placa ? ` · ${item.veiculo.placa}` : ""
      }`,
      valorAtribuido: String(item.valor_atribuido),
      condicao: item.condicao_na_negociacao ?? "",
    }))
  );

  function atualizarItem(id: string, patch: Partial<ItemFormState>) {
    setItens((atual) => atual.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const valorVolta =
      voltaDirecao === "nenhuma" ? 0 : (voltaDirecao === "recebi" ? 1 : -1) * (Number(voltaValor) || 0);

    startTransition(async () => {
      const result = await editarNegociacao({
        id: negociacao.id,
        tipo,
        data_negociacao: dataNegociacao,
        contraparte_nome: contraparteNome,
        contraparte_contato: contraparteContato,
        valor_volta: valorVolta,
        status,
        observacoes,
        itens: itens.map((item) => ({
          id: item.id,
          valor_atribuido: Number(item.valorAtribuido),
          condicao_na_negociacao: item.condicao || undefined,
        })),
      });

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  function handleExcluir() {
    setError(null);
    startExclusao(async () => {
      const result = await excluirNegociacao(negociacao.id);
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

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">1 · Dados do negócio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de negociação</Label>
            <NativeSelect
              className="h-11"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoNegociacao)}
            >
              <option value="compra">Compra</option>
              <option value="venda">Venda</option>
              <option value="troca">Troca</option>
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              className="h-11"
              value={dataNegociacao}
              onChange={(e) => setDataNegociacao(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Contraparte (nome)</Label>
            <Input
              className="h-11"
              value={contraparteNome}
              onChange={(e) => setContraparteNome(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Contraparte (contato)</Label>
            <Input
              className="h-11"
              value={contraparteContato}
              onChange={(e) => setContraparteContato(e.target.value)}
              placeholder="Telefone, opcional"
            />
          </div>

          <div className="space-y-2">
            <Label>Volta em dinheiro</Label>
            <div className="flex gap-2">
              <NativeSelect
                className="h-11"
                value={voltaDirecao}
                onChange={(e) => setVoltaDirecao(e.target.value as typeof voltaDirecao)}
              >
                <option value="nenhuma">Sem volta</option>
                <option value="recebi">Recebi</option>
                <option value="paguei">Paguei</option>
              </NativeSelect>
              {voltaDirecao !== "nenhuma" && (
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="h-11"
                  value={voltaValor}
                  onChange={(e) => setVoltaValor(e.target.value)}
                  placeholder="0,00"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <NativeSelect
              className="h-11"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusNegociacao)}
            >
              <option value="concluida">Concluída</option>
              <option value="pendente">Pendente</option>
            </NativeSelect>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">2 · Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">3 · Veículos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Para mudar quais veículos participaram, exclua esta negociação e registre de novo.
          </p>

          {itens.map((item, index) => (
            <div key={item.id} className="space-y-3 rounded-lg border border-border p-4">
              <span className="text-sm font-medium text-foreground">
                #{index + 1} · {item.direcao === "entrada" ? "Entrada" : "Saída"} · {item.descricao}
              </span>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Valor atribuído (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    className="h-11"
                    value={item.valorAtribuido}
                    onChange={(e) => atualizarItem(item.id, { valorAtribuido: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Condição / observações</Label>
                  <Input
                    className="h-11"
                    value={item.condicao}
                    onChange={(e) => atualizarItem(item.id, { condicao: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="h-11">
          {pending ? "Salvando..." : "Salvar alterações"}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => router.push("/negocios")}>
          Cancelar
        </Button>
      </div>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-sm text-destructive">Zona de perigo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Excluir esta negociação reverte seus efeitos: veículos que saíram voltam ao estoque,
            veículos que entraram são apagados. Bloqueado se algum desses veículos já foi movimentado
            em outra negociação ou tem despesas registradas.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={excluindo}>
                {excluindo ? "Excluindo..." : "Excluir negociação"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir esta negociação?</AlertDialogTitle>
                <AlertDialogDescription>
                  Veículos que saíram voltam ao estoque; veículos que entraram são apagados. Essa
                  ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleExcluir}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </form>
  );
}
