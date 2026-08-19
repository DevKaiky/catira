@AGENTS.md

# Catira — sistema pessoal de controle de negociações de veículos

Sistema de uso individual (não multiusuário por enquanto) para o usuário controlar compras,
vendas e trocas de veículos ("catira"), com IA como copiloto de análise e decisão.

## Stack

Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS + Supabase (Postgres + Auth).
Deploy em produção na Vercel: https://catira.vercel.app (projeto `catira`, org `devkaikys-projects`).
PWA é objetivo de fase final, não implementado ainda.

**Atenção Next.js 16:** `middleware.ts` foi renomeado para `proxy.ts` (função `proxy`, não
`middleware`). Ver `AGENTS.md` — sempre checar `node_modules/next/dist/docs/` antes de usar APIs
do Next, pois a versão instalada é mais recente que o conhecimento do modelo.

## Status das fases

- [x] **Fase 1** — banco de dados + autenticação de usuário único (e-mail/senha via Supabase
      Auth, sem tela de cadastro público — o usuário é criado manualmente no dashboard).
- [x] **Fase 2** — cadastro manual de negócios (compra/venda/troca) com formulário completo.
- [x] **Fase 3** — relatórios de IA sob demanda (diário/semanal/mensal/personalizado) em
      `/relatorios`. Métricas (incluindo lucro real cruzando as duas pontas de cada veículo) são
      calculadas em TypeScript puro (`src/lib/relatorios/metricas.ts`) — a IA só interpreta os
      números prontos, nunca faz conta. Relatório é persistido na tabela `relatorios`
      (`supabase/migrations/0004_relatorios.sql`), com snapshot das métricas + análise em JSON
      estruturado. Ver "Camada de IA trocável" abaixo.
- [ ] Fase 4 — simulação de negócios futuros com parecer de IA.
- [ ] Fase 5 — integração com tabela Fipe (ex: API `parallelum.com.br/fipe`, gratuita) e pesquisa
      de mercado (OLX/Webmotors não têm API pública nem permitem scraping — usar campo manual de
      referência de preço por enquanto).
- [ ] Fase 6 — refino como PWA.

## Camada de IA trocável (Fase 3+)

O usuário quer poder alternar entre provedores de IA (Gemini Flash hoje; Deepseek e Kimi K2 são
candidatos futuros) sem reescrever a integração. `src/lib/ai/types.ts` define o contrato
`ProvedorIA` (`gerar(pedido) -> RespostaIA`, texto cru, sem validar shape). `src/lib/ai/index.ts`
(`getProvedorIA()`) escolhe a implementação pela env var `AI_PROVIDER` (`gemini` por padrão).
Nenhuma camada acima (`actions.ts`, `src/lib/relatorios/*`) importa um provedor específico
diretamente — sempre passam por `getProvedorIA()`.

- Implementação atual: `src/lib/ai/gemini.ts`, SDK `@google/genai`, usando `ai.interactions.create`
  (não `ai.models.generateContent`, que é o caminho legado) com o modelo `gemini-3.7-flash`.
- Para adicionar Deepseek/Kimi K2 (ambos OpenAI-compatible): criar `src/lib/ai/openai-compat.ts`
  com uma factory parametrizada por `baseURL`/`model`, registrar no switch de `getProvedorIA()`, e
  trocar `AI_PROVIDER` na Vercel. Nenhum outro arquivo muda.
- API key resolvida nesta ordem: env específica do provedor (`GEMINI_API_KEY`,
  `DEEPSEEK_API_KEY`, `KIMI_API_KEY`) → fallback `AI_API_KEY`. `AI_MODEL` opcional sobrescreve o
  modelo default. Todas server-only, sem prefixo `NEXT_PUBLIC_`.
- **Decisão explícita:** não usar a camada OpenAI-compatible do próprio Gemini para unificar tudo
  numa implementação só — ela ignora silenciosamente parâmetros não suportados, o que quebraria
  structured output sem erro claro.
- Nos relatórios, a IA **nunca faz conta**: todas as métricas são calculadas em TypeScript puro
  (`src/lib/relatorios/metricas.ts`) antes de montar o prompt; a IA só interpreta os números já
  prontos e devolve um JSON estruturado (`resumo`, `destaques`, `alertas`, `recomendacoes`),
  validado manualmente em `actions.ts` antes de persistir.

## Modelagem do banco (decisão central do projeto)

Uma negociação de catira **não é uma venda simples** — pode envolver N veículos entrando e M
veículos saindo, mais volta em dinheiro em qualquer direção. O schema reflete isso:

- `veiculos` — cada linha é um veículo físico que já passou pela mão do usuário. Tem `status`
  (`em_estoque` / `vendido` / `repassado`) para saber o que ainda está disponível para dar em
  troca ou vender.
- `negociacoes` — o negócio em si (tipo, data, contraparte, `valor_volta` com sinal: positivo =
  usuário recebeu, negativo = usuário pagou).
- `negociacao_veiculos` — junção N:N entre negociação e veículo, com `direcao`
  (`entrada`/`saida`) e `valor_atribuido`. É isso que permite modelar uma troca real (3 motos +
  1 carro por 1 caminhonete + volta de R$ 5.000) e também cruzar as duas pontas do mesmo veículo
  (comprado numa negociação, vendido em outra meses depois) para calcular lucro real nos
  relatórios de IA da Fase 3.

RLS habilitado em todas as tabelas, escopado por `created_by = auth.uid()`. É uso individual
hoje, mas isso já deixa a porta aberta para multiusuário sem remodelar nada.

**Criar uma negociação é atômico via RPC**, não via múltiplas chamadas do client: a função
Postgres `public.criar_negociacao` (em `supabase/migrations/0002_criar_negociacao.sql`) insere a
negociação, cria os veículos de entrada, marca como vendidos os veículos de saída, e liga tudo em
`negociacao_veiculos` — tudo em uma única transação. Chamada via `supabase.rpc('criar_negociacao', {...})`
em `src/app/(app)/negocios/novo/actions.ts`.

## Migrations

Projeto Supabase real: `catira` (ref `oupdxblwdtmqpczaqqyl`, região `sa-east-1`). Aplicadas via
MCP do Supabase (`mcp__supabase__apply_migration`), em ordem — se o MCP não estiver disponível,
rodar manualmente no SQL Editor do Supabase, na mesma ordem:
1. `supabase/migrations/0001_init.sql` — tabelas base + RLS.
2. `supabase/migrations/0002_criar_negociacao.sql` — função RPC transacional.
3. `supabase/migrations/0003_fix_search_path.sql` — corrige alerta do linter de segurança
   (`function_search_path_mutable`) fixando `search_path` nas funções.
4. `supabase/migrations/0004_relatorios.sql` — tabela `relatorios` (histórico de relatórios de IA
   da Fase 3) + RLS.

## Gotcha de tipagem TypeScript + Supabase

Em `src/types/database.ts`, os tipos de linha (`Veiculo`, `Negociacao`, etc.) usam `type`, **não**
`interface`. Motivo: o SDK do Supabase exige que `Row`/`Insert`/`Update`/`Args` satisfaçam
`Record<string, unknown>` estruturalmente para inferir os tipos de `.from()` e `.rpc()`.
`interface` não ganha a "implicit index signature" que `type` ganha, então uma interface falha
essa checagem *silenciosamente* — o retorno de `.rpc()` vira `any`/`never` sem erro óbvio até
tentar chamar com argumentos tipados. Se _algum dia_ voltar a usar `interface` em qualquer tipo
referenciado dentro de `Database`, os tipos de `.rpc()`/`.from()` quebram de novo.

## Estrutura de rotas

- `src/app/page.tsx` — apenas redireciona: `/negocios` se autenticado, `/login` se não.
- `src/app/login/` — página e Server Actions de login/logout (`signIn`, `signOut`).
- `src/app/(app)/layout.tsx` — layout autenticado com header (nome, e-mail, botão sair). Redireciona
  para `/login` se não houver sessão (dupla proteção, já que `src/proxy.ts` também protege).
- `src/app/(app)/negocios/page.tsx` — lista de negociações.
- `src/app/(app)/negocios/novo/` — formulário de nova negociação (`NegociacaoForm.tsx`, client
  component com itens dinâmicos de entrada/saída) + `actions.ts` (Server Action `criarNegociacao`).
- `src/lib/supabase/{client,server,proxy}.ts` — clientes Supabase (browser, server, proxy/sessão).
- `src/lib/queries/negociacoes.ts` — queries de leitura server-side.
- `src/lib/format.ts` — formatação pt-BR (moeda, data) e labels de enums.

## Infraestrutura / MCP

MCP autenticado e em uso para Supabase, Vercel e Railway (escopo de usuário, disponível em
qualquer sessão). Estado atual, já provisionado:

- **Supabase**: projeto `catira` (ref `oupdxblwdtmqpczaqqyl`, `sa-east-1`). Migrations aplicadas
  via `mcp__supabase__apply_migration`. Usuário de login criado via API Admin de Auth (não há tela
  de cadastro público — login manual em `/login`).
- **Vercel**: projeto `catira` em produção (https://catira.vercel.app, org `devkaikys-projects`).
  Repositório `DevKaiky/catira` no GitHub conectado para deploy automático a cada push em
  `master`. Vercel CLI também instalada e linkada localmente (`vercel` na PATH) — útil para
  `vercel env add/pull` e deploys manuais (`vercel --prod`) quando o MCP não cobre algo (ex: a
  Vercel MCP não tem tool para setar env vars, só a CLI/dashboard tem).
- **Railway**: MCP funcionando, ainda sem uso neste projeto.

Env vars da Vercel (Production/Preview/Development): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_PROVIDER`, `GEMINI_API_KEY`.

## Preferências de trabalho

- Responder sempre em pt-BR.
- Só criar/commitar no git quando o usuário pedir explicitamente.
- Rodar `npx tsc --noEmit`, `npm run build` e `npm run lint` depois de mudanças estruturais antes
  de reportar como concluído.
- Para features novas de porte médio/grande, passar primeiro pelo agente `system-architect` (plano
  sem código) e só depois pelo `feature-lead` (implementação) — evita decisões de arquitetura
  tomadas às pressas no meio da implementação.
