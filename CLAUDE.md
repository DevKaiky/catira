@AGENTS.md

# Catira — sistema pessoal de controle de negociações de veículos

Sistema de uso individual (não multiusuário por enquanto) para o usuário controlar compras,
vendas e trocas de veículos ("catira"), com IA como copiloto de análise e decisão.

## Stack

Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS + Supabase (Postgres + Auth).
Deploy planejado na Vercel. PWA é objetivo de fase final, não implementado ainda.

**Atenção Next.js 16:** `middleware.ts` foi renomeado para `proxy.ts` (função `proxy`, não
`middleware`). Ver `AGENTS.md` — sempre checar `node_modules/next/dist/docs/` antes de usar APIs
do Next, pois a versão instalada é mais recente que o conhecimento do modelo.

## Status das fases

- [x] **Fase 1** — banco de dados + autenticação de usuário único (e-mail/senha via Supabase
      Auth, sem tela de cadastro público — o usuário é criado manualmente no dashboard).
- [x] **Fase 2** — cadastro manual de negócios (compra/venda/troca) com formulário completo.
- [ ] Fase 3 — relatórios de IA (diário/semanal/mensal).
- [ ] Fase 4 — simulação de negócios futuros com parecer de IA.
- [ ] Fase 5 — integração com tabela Fipe (ex: API `parallelum.com.br/fipe`, gratuita) e pesquisa
      de mercado (OLX/Webmotors não têm API pública nem permitem scraping — usar campo manual de
      referência de preço por enquanto).
- [ ] Fase 6 — refino como PWA.

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

Rodar manualmente no SQL Editor do Supabase, em ordem:
1. `supabase/migrations/0001_init.sql` — tabelas base + RLS.
2. `supabase/migrations/0002_criar_negociacao.sql` — função RPC transacional.

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

O usuário tem contas no Supabase, Vercel e Railway, e autorizou acesso via MCP a todas.

- **Railway**: MCP já funcionando (escopo de usuário, `railway mcp`, stdio).
- **Supabase**: registrado via `claude mcp add --scope user --transport http supabase https://mcp.supabase.com/mcp`.
  Falta autenticar via `/mcp` no chat (OAuth por navegador).
- **Vercel**: registrado via `claude mcp add --scope user vercel --transport http https://mcp.vercel.com`.
  Falta autenticar via `/mcp` no chat (OAuth por navegador).

**Pegadinha de escopo:** na primeira tentativa, os dois foram adicionados com `--scope local`
(padrão do comando), o que os prendeu ao diretório do projeto `catira`. Como esta sessão de chat
roda a partir de `C:\Users\Usuario` (não de dentro de `catira`), os servidores não apareciam no
painel `/mcp`. Foram removidos e re-adicionados com `--scope user` para ficarem disponíveis em
qualquer sessão, igual ao Railway. Mesmo assim, servidores adicionados **durante** uma sessão só
aparecem no painel `/mcp` dela após reiniciar o Claude Code — o painel não recarrega a lista
dinamicamente em uma sessão já em andamento.

**Assim que a sessão for reiniciada com os MCPs autenticados**, o próximo passo é: criar o projeto
real no Supabase, rodar as duas migrations nele, preencher `.env.local` a partir de
`.env.local.example`, e configurar o deploy na Vercel — tudo via MCP, sem o usuário precisar
mexer nos painéis manualmente.

## Preferências de trabalho

- Responder sempre em pt-BR.
- Só criar/commitar no git quando o usuário pedir explicitamente (repo já foi `git init`, mas sem
  commits ainda).
- Rodar `npx tsc --noEmit`, `npm run build` e `npm run lint` depois de mudanças estruturais antes
  de reportar como concluído.
