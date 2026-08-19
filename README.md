# Catira

Sistema pessoal de controle de negociações de veículos (compra, venda e troca), com IA como
copiloto de análise e decisão.

## Status

**Fase 1 concluída:** estrutura do banco de dados e autenticação de usuário único.

- `supabase/migrations/0001_init.sql` — tabelas `veiculos`, `negociacoes` e
  `negociacao_veiculos` (junção N:N com direção de entrada/saída e valor atribuído), RLS por
  `created_by`.
- Autenticação por e-mail/senha via Supabase Auth, com `src/proxy.ts` protegendo todas as rotas
  exceto `/login`.

## Setup

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor do projeto, rode o conteúdo de `supabase/migrations/0001_init.sql`.
3. Em **Authentication > Users**, crie seu usuário manualmente (e-mail + senha). Não há tela de
   cadastro público — o sistema é de uso individual.
4. Copie `.env.local.example` para `.env.local` e preencha com a URL e a `anon key` do projeto
   (em **Project Settings > API**).
5. Instale as dependências e rode o servidor de desenvolvimento:

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) — você será redirecionado para `/login`.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres + Auth).

## Próximas fases

2. Cadastro manual de negócios realizados.
3. Relatórios de IA (diário/semanal/mensal).
4. Simulação de negócios futuros com parecer de IA.
5. Integração com tabela Fipe e pesquisa de mercado.
6. Refino como PWA.
