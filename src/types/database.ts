// Tipos manuais espelhando o schema de supabase/migrations/0001_init.sql.
// Quando o projeto Supabase estiver criado, isso pode ser substituído por
// tipos gerados via `supabase gen types typescript`.
//
// Usamos `type` (não `interface`) para os shapes de linha porque o SDK do
// Supabase exige que Row/Insert/Update satisfaçam Record<string, unknown>
// estruturalmente — `interface` não passa nessa checagem (não ganha a
// implicit index signature que `type` recebe), o que quebra a inferência
// de tipos do `.rpc()` e de `.from(...)` silenciosamente.

import type { AnaliseIA, GranularidadeRelatorio, MetricasPeriodo } from "@/types/relatorios";

export type TipoVeiculo = "carro" | "moto" | "caminhonete" | "outro";
export type StatusVeiculo = "em_estoque" | "vendido" | "repassado";
export type Transmissao = "manual" | "automatico" | "cvt";

export type TipoNegociacao = "compra" | "venda" | "troca";
export type StatusNegociacao = "concluida" | "pendente" | "cancelada";

export type DirecaoVeiculoNaNegociacao = "entrada" | "saida";

export type CategoriaDespesa =
  | "funilaria"
  | "mecanica"
  | "documentacao"
  | "estetica"
  | "transporte"
  | "outro";

export type Veiculo = {
  id: string;
  created_by: string;

  tipo: TipoVeiculo;
  marca: string;
  modelo: string;
  versao: string | null;
  ano_fabricacao: number | null;
  ano_modelo: number | null;
  placa: string | null;
  cor: string | null;
  km: number | null;
  combustivel: string | null;
  transmissao: Transmissao | null;

  fipe_codigo: string | null;
  fipe_valor_referencia: number | null;
  fipe_consultado_em: string | null;

  status: StatusVeiculo;
  observacoes: string | null;

  created_at: string;
  updated_at: string;
};

export type Negociacao = {
  id: string;
  created_by: string;

  tipo: TipoNegociacao;
  data_negociacao: string;

  contraparte_nome: string;
  contraparte_contato: string | null;

  /** Positivo = usuário recebeu volta; negativo = usuário pagou volta. */
  valor_volta: number;

  status: StatusNegociacao;
  observacoes: string | null;

  created_at: string;
  updated_at: string;
};

export type NegociacaoVeiculo = {
  id: string;
  created_by: string;

  negociacao_id: string;
  veiculo_id: string;

  direcao: DirecaoVeiculoNaNegociacao;
  valor_atribuido: number;
  condicao_na_negociacao: string | null;

  created_at: string;
};

/** Negociação com seus veículos (entrada/saída) já unidos, útil para telas e relatórios. */
export type NegociacaoComVeiculos = Negociacao & {
  itens: (NegociacaoVeiculo & { veiculo: Veiculo })[];
};

export type DespesaVeiculo = {
  id: string;
  created_by: string;

  veiculo_id: string;

  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  data: string;

  created_at: string;
};

/** Payload de aquisição retroativa opcional no cadastro avulso de veículo. */
export type AquisicaoRetroativaInput = {
  valor: number;
  data: string;
  contraparte_nome?: string;
  observacoes?: string;
};

/** Um item existente sendo corrigido na edição de negociação (sem adicionar/remover veículos). */
export type ItemEdicaoInput = {
  id: string;
  valor_atribuido: number;
  condicao_na_negociacao?: string;
};

/** Dados de um veículo novo entrando no estoque, usados no payload de criar_negociacao. */
export type NovoVeiculoInput = {
  tipo: TipoVeiculo;
  marca: string;
  modelo: string;
  versao?: string;
  ano_fabricacao?: number;
  ano_modelo?: number;
  placa?: string;
  cor?: string;
  km?: number;
  combustivel?: string;
  transmissao?: Transmissao;
  observacoes?: string;
};

/** Um item (veículo de entrada ou saída) no payload de criar_negociacao. */
export type ItemNegociacaoInput =
  | {
      direcao: "entrada";
      valor_atribuido: number;
      condicao_na_negociacao?: string;
      veiculo: NovoVeiculoInput;
    }
  | {
      direcao: "saida";
      valor_atribuido: number;
      condicao_na_negociacao?: string;
      veiculo_id: string;
    };

export type Relatorio = {
  id: string;
  created_by: string;

  granularidade: GranularidadeRelatorio;
  periodo_inicio: string;
  periodo_fim: string;

  metricas: MetricasPeriodo;
  analise: AnaliseIA;

  provedor: string;
  modelo: string;
  tokens_entrada: number | null;
  tokens_saida: number | null;

  created_at: string;
};

export type Database = {
  public: {
    Views: Record<string, never>;
    Tables: {
      veiculos: {
        Row: Veiculo;
        Insert: Omit<Veiculo, "id" | "created_by" | "created_at" | "updated_at"> &
          Partial<Pick<Veiculo, "id" | "created_by">>;
        Update: Partial<Veiculo>;
        Relationships: [];
      };
      negociacoes: {
        Row: Negociacao;
        Insert: Omit<Negociacao, "id" | "created_by" | "created_at" | "updated_at"> &
          Partial<Pick<Negociacao, "id" | "created_by">>;
        Update: Partial<Negociacao>;
        Relationships: [];
      };
      negociacao_veiculos: {
        Row: NegociacaoVeiculo;
        Insert: Omit<NegociacaoVeiculo, "id" | "created_by" | "created_at"> &
          Partial<Pick<NegociacaoVeiculo, "id" | "created_by">>;
        Update: Partial<NegociacaoVeiculo>;
        Relationships: [];
      };
      relatorios: {
        Row: Relatorio;
        Insert: Omit<Relatorio, "id" | "created_by" | "created_at"> &
          Partial<Pick<Relatorio, "id" | "created_by">>;
        Update: Partial<Relatorio>;
        Relationships: [];
      };
      despesas_veiculo: {
        Row: DespesaVeiculo;
        Insert: Omit<DespesaVeiculo, "id" | "created_by" | "created_at"> &
          Partial<Pick<DespesaVeiculo, "id" | "created_by">>;
        Update: Partial<DespesaVeiculo>;
        Relationships: [];
      };
    };
    Functions: {
      criar_negociacao: {
        Args: {
          p_tipo: TipoNegociacao;
          p_data_negociacao: string;
          p_contraparte_nome: string;
          p_contraparte_contato: string | null;
          p_valor_volta: number;
          p_status: StatusNegociacao;
          p_observacoes: string | null;
          p_itens: ItemNegociacaoInput[];
        };
        Returns: string;
      };
      criar_veiculo_avulso: {
        Args: {
          p_veiculo: NovoVeiculoInput;
          p_aquisicao: AquisicaoRetroativaInput | null;
        };
        Returns: string;
      };
      editar_negociacao: {
        Args: {
          p_negociacao_id: string;
          p_tipo: TipoNegociacao;
          p_data_negociacao: string;
          p_contraparte_nome: string;
          p_contraparte_contato: string | null;
          p_valor_volta: number;
          p_status: StatusNegociacao;
          p_observacoes: string | null;
          p_itens: ItemEdicaoInput[];
        };
        Returns: string;
      };
      excluir_negociacao: {
        Args: { p_negociacao_id: string };
        Returns: undefined;
      };
    };
  };
};
