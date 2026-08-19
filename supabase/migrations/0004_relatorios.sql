-- ============================================================================
-- Catira | Fase 3: histórico de relatórios de IA
-- ============================================================================
-- Cada linha é UM relatório gerado sob demanda. Guardamos os dois lados:
--   metricas -> snapshot determinístico calculado em TS no momento da geração
--   analise  -> texto estruturado devolvido pela IA em cima daquelas métricas
-- Guardar as métricas junto é o que torna o relatório auditável e re-renderizável
-- sem recalcular: os negócios podem mudar depois, o relatório não.
-- ============================================================================

create table if not exists public.relatorios (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,

  granularidade text not null
    check (granularidade in ('diario', 'semanal', 'mensal', 'personalizado')),
  periodo_inicio date not null,
  periodo_fim date not null,

  metricas jsonb not null,
  analise jsonb not null,

  provedor text not null,
  modelo text not null,
  tokens_entrada integer,
  tokens_saida integer,

  created_at timestamptz not null default now(),

  constraint relatorios_periodo_valido check (periodo_fim >= periodo_inicio)
);

comment on table public.relatorios is 'Relatórios de IA gerados sob demanda, com snapshot das métricas que embasaram a análise.';
comment on column public.relatorios.metricas is 'Snapshot determinístico calculado em TypeScript. A IA não produz números — só interpreta estes.';
comment on column public.relatorios.provedor is 'Provedor de IA usado (gemini/deepseek/kimi). Permite comparar qualidade entre provedores no histórico.';

create index if not exists idx_relatorios_created_by on public.relatorios (created_by);
create index if not exists idx_relatorios_recentes on public.relatorios (created_by, created_at desc);
create index if not exists idx_relatorios_periodo on public.relatorios (created_by, periodo_inicio, periodo_fim);

alter table public.relatorios enable row level security;

drop policy if exists "relatorios_owner_all" on public.relatorios;
create policy "relatorios_owner_all" on public.relatorios
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);
