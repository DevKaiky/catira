"use client";

import { useState, useTransition } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import type { AquisicaoRetroativaInput, NovoVeiculoInput, TipoVeiculo, Transmissao } from "@/types/database";
import { TIPO_VEICULO_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NativeSelect } from "@/components/catira/NativeSelect";
import { hojeSaoPaulo } from "@/lib/relatorios/periodo";

export type VeiculoFormValores = {
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
};

function valoresIniciaisPadrao(valoresIniciais?: NovoVeiculoInput): VeiculoFormValores {
  return {
    tipo: valoresIniciais?.tipo ?? "carro",
    marca: valoresIniciais?.marca ?? "",
    modelo: valoresIniciais?.modelo ?? "",
    versao: valoresIniciais?.versao ?? "",
    anoFabricacao: valoresIniciais?.ano_fabricacao ? String(valoresIniciais.ano_fabricacao) : "",
    anoModelo: valoresIniciais?.ano_modelo ? String(valoresIniciais.ano_modelo) : "",
    placa: valoresIniciais?.placa ?? "",
    cor: valoresIniciais?.cor ?? "",
    km: valoresIniciais?.km ? String(valoresIniciais.km) : "",
    combustivel: valoresIniciais?.combustivel ?? "",
    transmissao: valoresIniciais?.transmissao ?? "",
    observacoes: valoresIniciais?.observacoes ?? "",
  };
}

function temDetalhesPreenchidos(v?: NovoVeiculoInput): boolean {
  return Boolean(
    v?.versao || v?.ano_fabricacao || v?.ano_modelo || v?.placa || v?.cor || v?.km || v?.combustivel || v?.transmissao
  );
}

export default function VeiculoForm({
  valoresIniciais,
  mostrarAquisicao = true,
  textoBotao = "Salvar",
  onSubmit,
  aoCancelar,
}: {
  valoresIniciais?: NovoVeiculoInput;
  mostrarAquisicao?: boolean;
  textoBotao?: string;
  onSubmit: (
    veiculo: NovoVeiculoInput,
    aquisicao: AquisicaoRetroativaInput | null
  ) => Promise<{ error: string | null }>;
  aoCancelar: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [valores, setValores] = useState<VeiculoFormValores>(valoresIniciaisPadrao(valoresIniciais));
  const [detalhesAbertos, setDetalhesAbertos] = useState(temDetalhesPreenchidos(valoresIniciais));

  const [registrarAquisicao, setRegistrarAquisicao] = useState(false);
  const [aquisicaoValor, setAquisicaoValor] = useState("");
  const [aquisicaoData, setAquisicaoData] = useState(hojeSaoPaulo());
  const [aquisicaoContraparte, setAquisicaoContraparte] = useState("");

  function atualizar(patch: Partial<VeiculoFormValores>) {
    setValores((atual) => ({ ...atual, ...patch }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const veiculo: NovoVeiculoInput = {
      tipo: valores.tipo,
      marca: valores.marca,
      modelo: valores.modelo,
      versao: valores.versao || undefined,
      ano_fabricacao: valores.anoFabricacao ? Number(valores.anoFabricacao) : undefined,
      ano_modelo: valores.anoModelo ? Number(valores.anoModelo) : undefined,
      placa: valores.placa || undefined,
      cor: valores.cor || undefined,
      km: valores.km ? Number(valores.km) : undefined,
      combustivel: valores.combustivel || undefined,
      transmissao: valores.transmissao || undefined,
      observacoes: valores.observacoes || undefined,
    };

    const aquisicao: AquisicaoRetroativaInput | null =
      mostrarAquisicao && registrarAquisicao
        ? {
            valor: Number(aquisicaoValor) || 0,
            data: aquisicaoData,
            contraparte_nome: aquisicaoContraparte || undefined,
          }
        : null;

    startTransition(async () => {
      const result = await onSubmit(veiculo, aquisicao);
      if (result?.error) {
        setError(result.error);
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
          <CardTitle className="text-sm">1 · Dados do veículo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Tipo</Label>
              <NativeSelect
                className="h-11"
                value={valores.tipo}
                onChange={(e) => atualizar({ tipo: e.target.value as TipoVeiculo })}
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
                value={valores.marca}
                onChange={(e) => atualizar({ marca: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Modelo</Label>
              <Input
                className="h-11"
                value={valores.modelo}
                onChange={(e) => atualizar({ modelo: e.target.value })}
                required
              />
            </div>
          </div>

          <Collapsible open={detalhesAbertos} onOpenChange={setDetalhesAbertos}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="-ml-2 gap-1 text-muted-foreground">
                <ChevronDown className={cn("size-4 transition-transform", detalhesAbertos && "rotate-180")} />
                Mais detalhes
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="grid gap-3 pt-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Versão</Label>
                <Input
                  className="h-11"
                  value={valores.versao}
                  onChange={(e) => atualizar({ versao: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Ano fabricação</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  className="h-11"
                  value={valores.anoFabricacao}
                  onChange={(e) => atualizar({ anoFabricacao: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Ano modelo</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  className="h-11"
                  value={valores.anoModelo}
                  onChange={(e) => atualizar({ anoModelo: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Placa</Label>
                <Input
                  className="h-11"
                  value={valores.placa}
                  onChange={(e) => atualizar({ placa: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Cor</Label>
                <Input
                  className="h-11"
                  value={valores.cor}
                  onChange={(e) => atualizar({ cor: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>KM</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  className="h-11"
                  value={valores.km}
                  onChange={(e) => atualizar({ km: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Combustível</Label>
                <Input
                  className="h-11"
                  value={valores.combustivel}
                  onChange={(e) => atualizar({ combustivel: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Transmissão</Label>
                <NativeSelect
                  className="h-11"
                  value={valores.transmissao}
                  onChange={(e) => atualizar({ transmissao: e.target.value as Transmissao | "" })}
                >
                  <option value="">Não informado</option>
                  <option value="manual">Manual</option>
                  <option value="automatico">Automático</option>
                  <option value="cvt">CVT</option>
                </NativeSelect>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea
              rows={2}
              value={valores.observacoes}
              onChange={(e) => atualizar({ observacoes: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {mostrarAquisicao && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={registrarAquisicao}
                  onCheckedChange={(checked) => setRegistrarAquisicao(checked === true)}
                />
                2 · Registrar valor de aquisição (opcional)
              </label>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Sem valor de aquisição, o sistema não consegue calcular o lucro deste veículo quando ele
              for vendido.
            </p>

            {registrarAquisicao && (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label>Valor pago (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    className="h-11"
                    value={aquisicaoValor}
                    onChange={(e) => setAquisicaoValor(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    className="h-11"
                    value={aquisicaoData}
                    onChange={(e) => setAquisicaoData(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Contraparte</Label>
                  <Input
                    className="h-11"
                    value={aquisicaoContraparte}
                    onChange={(e) => setAquisicaoContraparte(e.target.value)}
                    placeholder="Estoque inicial"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="h-11">
          {pending ? "Salvando..." : textoBotao}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={aoCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
