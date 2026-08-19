-- ============================================================================
-- Catira | Despesas por veículo: gastos que somam ao custo de aquisição
-- ============================================================================
-- Funilaria, mecânica, documentação etc. lançados sobre um veículo já em posse
-- do usuário. Somam ao valor de aquisição no cálculo de lucro real (Fase 3).
-- ============================================================================

create table if not exists public.despesas_veiculo (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,

  veiculo_id uuid not null references public.veiculos (id) on delete cascade,

  categoria text not null default 'outro'
    check (categoria in ('funilaria', 'mecanica', 'documentacao', 'estetica', 'transporte', 'outro')),
  descricao text not null,
  valor numeric(12, 2) not null check (valor > 0),
  data date not null default current_date,

  created_at timestamptz not null default now()
);

comment on table public.despesas_veiculo is 'Gastos lançados sobre um veículo já em posse do usuário. Somam ao custo de aquisição no cálculo de lucro real.';
comment on column public.despesas_veiculo.valor is 'Sempre positivo — é saída de dinheiro. O sinal é implícito na semântica da tabela.';
comment on column public.despesas_veiculo.data is 'Data em que o gasto ocorreu. Usada para o total de despesas DO PERÍODO; o custo do veículo soma todas, independente da data.';

create index if not exists idx_despesas_veiculo_created_by on public.despesas_veiculo (created_by);
create index if not exists idx_despesas_veiculo_veiculo on public.despesas_veiculo (veiculo_id);
create index if not exists idx_despesas_veiculo_data on public.despesas_veiculo (created_by, data desc);

alter table public.despesas_veiculo enable row level security;

drop policy if exists "despesas_veiculo_owner_all" on public.despesas_veiculo;
create policy "despesas_veiculo_owner_all" on public.despesas_veiculo
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);
