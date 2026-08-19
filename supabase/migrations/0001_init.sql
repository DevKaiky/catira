-- ============================================================================
-- Catira | Fase 1: estrutura básica do banco de dados
-- ============================================================================
-- Modelagem pensada para negociações de catira: uma negociação pode envolver
-- N veículos entrando no estoque e M veículos saindo, além de volta em
-- dinheiro em qualquer direção. Um veículo comprado numa negociação pode
-- reaparecer, meses depois, como item de saída em outra negociação (venda),
-- o que permite calcular o lucro real ao cruzar as duas pontas.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- veiculos: cada linha é um veículo físico que já passou pelas mãos do
-- usuário (comprado, recebido em troca, ou ainda em estoque).
-- ----------------------------------------------------------------------------
create table if not exists public.veiculos (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,

  tipo text not null check (tipo in ('carro', 'moto', 'caminhonete', 'outro')),
  marca text not null,
  modelo text not null,
  versao text,
  ano_fabricacao smallint,
  ano_modelo smallint,
  placa text,
  cor text,
  km integer,
  combustivel text,
  transmissao text check (transmissao in ('manual', 'automatico', 'cvt', null)),

  fipe_codigo text,
  fipe_valor_referencia numeric(12, 2),
  fipe_consultado_em timestamptz,

  status text not null default 'em_estoque'
    check (status in ('em_estoque', 'vendido', 'repassado')),

  observacoes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.veiculos is 'Veículos que já passaram pelo estoque do usuário (comprados, recebidos em troca ou ainda em posse).';
comment on column public.veiculos.status is 'em_estoque = ainda com o usuário; vendido/repassado = já saiu em outra negociação.';

-- ----------------------------------------------------------------------------
-- negociacoes: o "negócio" em si — compra, venda ou troca — com uma
-- contraparte, numa data, com eventual volta em dinheiro.
-- ----------------------------------------------------------------------------
create table if not exists public.negociacoes (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,

  tipo text not null check (tipo in ('compra', 'venda', 'troca')),
  data_negociacao date not null default current_date,

  contraparte_nome text not null,
  contraparte_contato text,

  -- volta em dinheiro: positivo = usuário recebeu; negativo = usuário pagou.
  valor_volta numeric(12, 2) not null default 0,

  status text not null default 'concluida'
    check (status in ('concluida', 'pendente', 'cancelada')),

  observacoes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.negociacoes is 'Uma negociação de catira: compra, venda ou troca (com N veículos de cada lado + volta em dinheiro).';
comment on column public.negociacoes.valor_volta is 'Diferença em dinheiro. Positivo = usuário recebeu volta; negativo = usuário pagou volta.';

-- ----------------------------------------------------------------------------
-- negociacao_veiculos: tabela de junção — quais veículos entraram e quais
-- saíram em cada negociação, com o valor atribuído a cada um.
-- ----------------------------------------------------------------------------
create table if not exists public.negociacao_veiculos (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,

  negociacao_id uuid not null references public.negociacoes (id) on delete cascade,
  veiculo_id uuid not null references public.veiculos (id) on delete restrict,

  -- entrada = veículo passou a ficar com o usuário (compra ou recebido em troca)
  -- saida   = veículo deixou de ficar com o usuário (venda ou dado em troca)
  direcao text not null check (direcao in ('entrada', 'saida')),

  valor_atribuido numeric(12, 2) not null,
  condicao_na_negociacao text,

  created_at timestamptz not null default now(),

  unique (negociacao_id, veiculo_id)
);

comment on table public.negociacao_veiculos is 'Junção N:N entre negociações e veículos, com direção (entrada/saída) e valor atribuído.';

-- ----------------------------------------------------------------------------
-- Índices de apoio
-- ----------------------------------------------------------------------------
create index if not exists idx_veiculos_created_by on public.veiculos (created_by);
create index if not exists idx_veiculos_status on public.veiculos (status);
create index if not exists idx_negociacoes_created_by on public.negociacoes (created_by);
create index if not exists idx_negociacoes_data on public.negociacoes (data_negociacao desc);
create index if not exists idx_negociacao_veiculos_negociacao on public.negociacao_veiculos (negociacao_id);
create index if not exists idx_negociacao_veiculos_veiculo on public.negociacao_veiculos (veiculo_id);

-- ----------------------------------------------------------------------------
-- updated_at automático
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_veiculos_updated_at on public.veiculos;
create trigger trg_veiculos_updated_at
  before update on public.veiculos
  for each row execute function public.set_updated_at();

drop trigger if exists trg_negociacoes_updated_at on public.negociacoes;
create trigger trg_negociacoes_updated_at
  before update on public.negociacoes
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security: cada usuário autenticado só vê/edita o que criou.
-- Hoje é uso individual, mas isso já deixa o sistema pronto caso o usuário
-- decida abrir para mais gente no futuro, sem precisar remodelar nada.
-- ----------------------------------------------------------------------------
alter table public.veiculos enable row level security;
alter table public.negociacoes enable row level security;
alter table public.negociacao_veiculos enable row level security;

drop policy if exists "veiculos_owner_all" on public.veiculos;
create policy "veiculos_owner_all" on public.veiculos
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

drop policy if exists "negociacoes_owner_all" on public.negociacoes;
create policy "negociacoes_owner_all" on public.negociacoes
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

drop policy if exists "negociacao_veiculos_owner_all" on public.negociacao_veiculos;
create policy "negociacao_veiculos_owner_all" on public.negociacao_veiculos
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);
