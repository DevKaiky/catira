"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { criarNegociacao } from "./actions";
import { hojeSaoPaulo } from "@/lib/relatorios/periodo";
import type {
  ItemNegociacaoInput,
  StatusNegociacao,
  TipoNegociacao,
  TipoVeiculo,
  Transmissao,
  Veiculo,
} from "@/types/database";
import { formatarMoeda, TIPO_VEICULO_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NativeSelect } from "@/components/catira/NativeSelect";

interface EntradaItemState {
  localId: string;
  direcao: "entrada";
  valorAtribuido: string;
  condicao: string;
  tipo: TipoVeiculo;
  marca: string;
  modelo: string;
  versao: string;
  anoFabricacao: string;
  anoModelo: string;
  placa: string;
  cor: string;
  km: string;
  combustivel: string;
  transmissao: Transmissao | "";
  observacoes: string;
  colapsado: boolean;
  detalhesAbertos: boolean;
}

interface SaidaItemState {
  localId: string;
  direcao: "saida";
  valorAtribuido: string;
  condicao: string;
  veiculoId: string;
  colapsado: boolean;
}

type ItemState = EntradaItemState | SaidaItemState;

function novoItemEntrada(): EntradaItemState {
  return {
    localId: crypto.randomUUID(),
    direcao: "entrada",
    valorAtribuido: "",
    condicao: "",
    tipo: "carro",
    marca: "",
    modelo: "",
    versao: "",
    anoFabricacao: "",
    anoModelo: "",
    placa: "",
    cor: "",
    km: "",
    combustivel: "",
    transmissao: "",
    observacoes: "",
    colapsado: false,
    detalhesAbertos: false,
  };
}

function novoItemSaida(veiculoId = ""): SaidaItemState {
  return {
    localId: crypto.randomUUID(),
    direcao: "saida",
    valorAtribuido: "",
    condicao: "",
    veiculoId,
    colapsado: false,
  };
}

function resumoItem(item: ItemState, veiculosEmEstoque: Veiculo[]): string {
  const valor = item.valorAtribuido ? formatarMoeda(Number(item.valorAtribuido) || 0) : "sem valor";

  if (item.direcao === "entrada") {
    const descricao = [item.marca, item.modelo, item.anoModelo].filter(Boolean).join(" ") || "Veículo novo";
    return `${descricao} · ${valor}`;
  }

  const veiculo = veiculosEmEstoque.find((v) => v.id === item.veiculoId);
  const descricao = veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "Selecione o veículo";
  return `${descricao} · ${valor}`;
}

export default function NegociacaoForm({ veiculosEmEstoque }: { veiculosEmEstoque: Veiculo[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<TipoNegociacao>("troca");
  const [dataNegociacao, setDataNegociacao] = useState(hojeSaoPaulo());
  const [contraparteNome, setContraparteNome] = useState("");
  const [contraparteContato, setContraparteContato] = useState("");
  const [voltaDirecao, setVoltaDirecao] = useState<"nenhuma" | "recebi" | "paguei">("nenhuma");
  const [voltaValor, setVoltaValor] = useState("");
  const [status, setStatus] = useState<StatusNegociacao>("concluida");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemState[]>([]);

  const veiculosJaUsados = new Set(
    itens.filter((i): i is SaidaItemState => i.direcao === "saida").map((i) => i.veiculoId)
  );

  function atualizarItem(localId: string, patch: Partial<ItemState>) {
    setItens((atual) =>
      atual.map((item) => (item.localId === localId ? ({ ...item, ...patch } as ItemState) : item))
    );
  }

  function removerItem(localId: string) {
    setItens((atual) => atual.filter((item) => item.localId !== localId));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const itensPayload: ItemNegociacaoInput[] = [];

    for (const item of itens) {
      const valor = Number(item.valorAtribuido);
      if (item.direcao === "entrada") {
        itensPayload.push({
          direcao: "entrada",
          valor_atribuido: valor,
          condicao_na_negociacao: item.condicao || undefined,
          veiculo: {
            tipo: item.tipo,
            marca: item.marca,
            modelo: item.modelo,
            versao: item.versao || undefined,
            ano_fabricacao: item.anoFabricacao ? Number(item.anoFabricacao) : undefined,
            ano_modelo: item.anoModelo ? Number(item.anoModelo) : undefined,
            placa: item.placa || undefined,
            cor: item.cor || undefined,
            km: item.km ? Number(item.km) : undefined,
            combustivel: item.combustivel || undefined,
            transmissao: item.transmissao || undefined,
            observacoes: item.observacoes || undefined,
          },
        });
      } else {
        itensPayload.push({
          direcao: "saida",
          valor_atribuido: valor,
          condicao_na_negociacao: item.condicao || undefined,
          veiculo_id: item.veiculoId,
        });
      }
    }

    const valorVolta =
      voltaDirecao === "nenhuma" ? 0 : (voltaDirecao === "recebi" ? 1 : -1) * (Number(voltaValor) || 0);

    startTransition(async () => {
      const result = await criarNegociacao({
        tipo,
        data_negociacao: dataNegociacao,
        contraparte_nome: contraparteNome,
        contraparte_contato: contraparteContato,
        valor_volta: valorVolta,
        status,
        observacoes,
        itens: itensPayload,
      });

      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20 md:pb-0">
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
        <CardHeader className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">2 · Veículos</CardTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItens((atual) => [...atual, novoItemEntrada()])}
            >
              <Plus />
              Entrada
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItens((atual) => [...atual, novoItemSaida()])}
            >
              <Plus />
              Saída
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {itens.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum veículo adicionado ainda. Entrada = veículo que você está recebendo (compra ou
              troca). Saída = veículo do seu estoque que está saindo (venda ou dado em troca).{" "}
              Nenhum veículo em estoque ainda?{" "}
              <Link href="/veiculos/novo" className="underline hover:text-foreground">
                Cadastre um veículo
              </Link>{" "}
              ou registre uma compra.
            </p>
          )}

          {itens.map((item, index) =>
            item.colapsado ? (
              <div
                key={item.localId}
                className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  {item.direcao === "entrada" ? (
                    <ArrowDownLeft className="size-4 shrink-0 text-positivo" />
                  ) : (
                    <ArrowUpRight className="size-4 shrink-0 text-atencao" />
                  )}
                  <span className="truncate text-foreground">
                    {item.direcao === "entrada" ? "Entrada" : "Saída"} ·{" "}
                    {resumoItem(item, veiculosEmEstoque)}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Editar item"
                    onClick={() => atualizarItem(item.localId, { colapsado: false })}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remover item"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removerItem(item.localId)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ) : item.direcao === "entrada" ? (
              <div key={item.localId} className="space-y-4 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    #{index + 1} · Entrada (veículo novo no estoque)
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => atualizarItem(item.localId, { colapsado: true })}
                    >
                      Concluir
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remover item"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removerItem(item.localId)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label>Tipo</Label>
                    <NativeSelect
                      className="h-11"
                      value={item.tipo}
                      onChange={(e) => atualizarItem(item.localId, { tipo: e.target.value as TipoVeiculo })}
                    >
                      {Object.entries(TIPO_VEICULO_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="space-y-1">
                    <Label>Marca</Label>
                    <Input
                      className="h-11"
                      value={item.marca}
                      onChange={(e) => atualizarItem(item.localId, { marca: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Modelo</Label>
                    <Input
                      className="h-11"
                      value={item.modelo}
                      onChange={(e) => atualizarItem(item.localId, { modelo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Valor atribuído (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      className="h-11"
                      value={item.valorAtribuido}
                      onChange={(e) => atualizarItem(item.localId, { valorAtribuido: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Collapsible
                  open={item.detalhesAbertos}
                  onOpenChange={(open) => atualizarItem(item.localId, { detalhesAbertos: open })}
                >
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
                      <ChevronDown
                        className={cn("size-4 transition-transform", item.detalhesAbertos && "rotate-180")}
                      />
                      Mais detalhes
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="grid gap-3 pt-3 sm:grid-cols-4">
                    <div className="space-y-1">
                      <Label>Versão</Label>
                      <Input
                        className="h-11"
                        value={item.versao}
                        onChange={(e) => atualizarItem(item.localId, { versao: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Ano fabricação</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        className="h-11"
                        value={item.anoFabricacao}
                        onChange={(e) => atualizarItem(item.localId, { anoFabricacao: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Ano modelo</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        className="h-11"
                        value={item.anoModelo}
                        onChange={(e) => atualizarItem(item.localId, { anoModelo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Placa</Label>
                      <Input
                        className="h-11"
                        value={item.placa}
                        onChange={(e) => atualizarItem(item.localId, { placa: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Cor</Label>
                      <Input
                        className="h-11"
                        value={item.cor}
                        onChange={(e) => atualizarItem(item.localId, { cor: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>KM</Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        className="h-11"
                        value={item.km}
                        onChange={(e) => atualizarItem(item.localId, { km: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Combustível</Label>
                      <Input
                        className="h-11"
                        value={item.combustivel}
                        onChange={(e) => atualizarItem(item.localId, { combustivel: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Transmissão</Label>
                      <NativeSelect
                        className="h-11"
                        value={item.transmissao}
                        onChange={(e) =>
                          atualizarItem(item.localId, { transmissao: e.target.value as Transmissao | "" })
                        }
                      >
                        <option value="">Não informado</option>
                        <option value="manual">Manual</option>
                        <option value="automatico">Automático</option>
                        <option value="cvt">CVT</option>
                      </NativeSelect>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label>Condição / observações do veículo</Label>
                      <Input
                        className="h-11"
                        value={item.condicao}
                        onChange={(e) => atualizarItem(item.localId, { condicao: e.target.value })}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ) : (
              <div key={item.localId} className="space-y-4 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    #{index + 1} · Saída (veículo do estoque)
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => atualizarItem(item.localId, { colapsado: true })}
                    >
                      Concluir
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remover item"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removerItem(item.localId)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Veículo em estoque</Label>
                    <NativeSelect
                      className="h-11"
                      value={item.veiculoId}
                      onChange={(e) => atualizarItem(item.localId, { veiculoId: e.target.value })}
                      required
                    >
                      <option value="">Selecione...</option>
                      {veiculosEmEstoque
                        .filter((v) => v.id === item.veiculoId || !veiculosJaUsados.has(v.id))
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {TIPO_VEICULO_LABEL[v.tipo]} · {v.marca} {v.modelo}
                            {v.placa ? ` · ${v.placa}` : ""}
                          </option>
                        ))}
                    </NativeSelect>
                    {veiculosEmEstoque.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhum veículo em estoque ainda.{" "}
                        <Link href="/veiculos/novo" className="underline hover:text-foreground">
                          Cadastre um veículo
                        </Link>{" "}
                        ou registre uma compra.
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Valor atribuído (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      className="h-11"
                      value={item.valorAtribuido}
                      onChange={(e) => atualizarItem(item.localId, { valorAtribuido: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Condição / observações</Label>
                  <Input
                    className="h-11"
                    value={item.condicao}
                    onChange={(e) => atualizarItem(item.localId, { condicao: e.target.value })}
                  />
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">3 · Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </CardContent>
      </Card>

      <div className="hidden gap-3 md:flex">
        <Button type="submit" disabled={pending} className="h-11">
          {pending ? "Salvando..." : "Registrar negociação"}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => router.push("/negocios")}>
          Cancelar
        </Button>
      </div>

      {/* Barra sticky mobile — total de itens + valor da volta + ação principal, acima da BottomNav. */}
      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{itens.length} veículo(s)</span>
          <span>
            Volta: {voltaDirecao === "nenhuma" ? "—" : formatarMoeda(Number(voltaValor) || 0)}
          </span>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="h-11 flex-1">
            {pending ? "Salvando..." : "Registrar negociação"}
          </Button>
          <Button type="button" variant="outline" className="h-11" onClick={() => router.push("/negocios")}>
            Cancelar
          </Button>
        </div>
      </div>
    </form>
  );
}
