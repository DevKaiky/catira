// Cálculo de janelas de período para relatórios. Função pura, sem I/O: trabalha só com strings
// de data `YYYY-MM-DD` (o formato de `negociacoes.data_negociacao`, que é `date` sem hora) e
// `Date` fixado ao meio-dia UTC para aritmética — nunca aritmética ingênua de `Date` local, que
// quebra em torno de mudanças de horário de verão.

import type { GranularidadeRelatorio, Periodo } from "@/types/relatorios";

const DATA_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATA_MINIMA = "2000-01-01";
const JANELA_MAX_DIAS = 366;

/** "Hoje" no fuso do usuário (America/Sao_Paulo), como `YYYY-MM-DD`. */
export function hojeSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function paraDataUtcMeioDia(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`);
}

function paraIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function somarDias(isoDate: string, dias: number): string {
  const data = paraDataUtcMeioDia(isoDate);
  data.setUTCDate(data.getUTCDate() + dias);
  return paraIsoDate(data);
}

/** Diferença em dias entre duas datas ISO (fim - inicio), sem contar o dia inicial. */
export function diferencaEmDias(inicio: string, fim: string): number {
  const ms = paraDataUtcMeioDia(fim).getTime() - paraDataUtcMeioDia(inicio).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function dataIsoValida(isoDate: string): boolean {
  if (!DATA_ISO_REGEX.test(isoDate)) return false;
  const data = paraDataUtcMeioDia(isoDate);
  return !Number.isNaN(data.getTime()) && paraIsoDate(data) === isoDate;
}

export type ResolverPeriodoInput = {
  granularidade: GranularidadeRelatorio;
  /** Só usado (e obrigatório) quando `granularidade === 'personalizado'`. */
  inicio?: string;
  fim?: string;
};

export type ResolverPeriodoResultado =
  | { ok: true; periodo: Periodo; periodoAnterior: Periodo }
  | { ok: false; error: string };

/**
 * Resolve a janela de datas de um preset (diário/semanal/mensal) ou de um período
 * personalizado, junto com o período anterior equivalente (mesma duração, imediatamente
 * anterior) usado para calcular deltas nos relatórios.
 */
export function resolverPeriodo(input: ResolverPeriodoInput): ResolverPeriodoResultado {
  const hoje = hojeSaoPaulo();
  let periodo: Periodo;

  switch (input.granularidade) {
    case "diario":
      periodo = { inicio: hoje, fim: hoje };
      break;
    case "semanal":
      periodo = { inicio: somarDias(hoje, -6), fim: hoje };
      break;
    case "mensal":
      periodo = { inicio: `${hoje.slice(0, 7)}-01`, fim: hoje };
      break;
    case "personalizado":
      if (!input.inicio || !input.fim) {
        return { ok: false, error: "Informe as duas datas do período personalizado." };
      }
      periodo = { inicio: input.inicio, fim: input.fim };
      break;
    default: {
      const desconhecida: never = input.granularidade;
      return { ok: false, error: `Granularidade desconhecida: ${String(desconhecida)}` };
    }
  }

  if (!dataIsoValida(periodo.inicio) || !dataIsoValida(periodo.fim)) {
    return { ok: false, error: "Data inválida. Use o formato AAAA-MM-DD." };
  }

  if (periodo.inicio > periodo.fim) {
    return { ok: false, error: "A data de início não pode ser depois da data de fim." };
  }

  if (periodo.inicio < DATA_MINIMA) {
    return { ok: false, error: `A data de início não pode ser anterior a ${DATA_MINIMA}.` };
  }

  const dias = diferencaEmDias(periodo.inicio, periodo.fim) + 1;
  if (dias > JANELA_MAX_DIAS) {
    return { ok: false, error: `O período não pode ter mais que ${JANELA_MAX_DIAS} dias.` };
  }

  const periodoAnterior: Periodo = {
    inicio: somarDias(periodo.inicio, -dias),
    fim: somarDias(periodo.inicio, -1),
  };

  return { ok: true, periodo, periodoAnterior };
}

/** Quantidade de dias (inclusive) de um período — usado no snapshot de métricas. */
export function duracaoEmDias(periodo: Periodo): number {
  return diferencaEmDias(periodo.inicio, periodo.fim) + 1;
}
