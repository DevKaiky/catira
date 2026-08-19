-- ============================================================================
-- Catira | Fix: search_path mutável nas funções (alerta do linter de segurança
-- do Supabase — function_search_path_mutable). Sem search_path fixo, uma
-- função SECURITY DEFINER/INVOKER pode ser enganada por objetos criados em
-- outro schema que entre antes de "public" no search_path da sessão.
-- ============================================================================

alter function public.set_updated_at() set search_path = public;
alter function public.criar_negociacao(text, date, text, text, numeric, text, text, jsonb) set search_path = public;
