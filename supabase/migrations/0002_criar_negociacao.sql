-- ============================================================================
-- Catira | Fase 2: função transacional para registrar uma negociação completa
-- ============================================================================
-- Cadastrar uma negociação envolve vários passos que precisam acontecer juntos
-- ou não acontecer: criar a negociação, criar os veículos que estão entrando
-- no estoque, marcar como vendidos os veículos que estão saindo, e ligar tudo
-- via negociacao_veiculos. Fazer isso como múltiplas chamadas separadas do
-- client arrisca deixar o cadastro pela metade se algo falhar no meio. Uma
-- função Postgres chamada via RPC roda como uma única transação.
-- ============================================================================

create or replace function public.criar_negociacao(
  p_tipo text,
  p_data_negociacao date,
  p_contraparte_nome text,
  p_contraparte_contato text,
  p_valor_volta numeric,
  p_status text,
  p_observacoes text,
  p_itens jsonb
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_negociacao_id uuid;
  v_item jsonb;
  v_veiculo_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  if jsonb_array_length(p_itens) = 0 then
    raise exception 'A negociação precisa de ao menos um veículo';
  end if;

  insert into public.negociacoes (
    created_by, tipo, data_negociacao, contraparte_nome, contraparte_contato,
    valor_volta, status, observacoes
  ) values (
    v_uid, p_tipo, p_data_negociacao, p_contraparte_nome, nullif(p_contraparte_contato, ''),
    p_valor_volta, coalesce(nullif(p_status, ''), 'concluida'), nullif(p_observacoes, '')
  )
  returning id into v_negociacao_id;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    if (v_item->>'direcao') = 'entrada' then
      -- Veículo novo entrando no estoque do usuário (comprado ou recebido em troca).
      insert into public.veiculos (
        created_by, tipo, marca, modelo, versao, ano_fabricacao, ano_modelo,
        placa, cor, km, combustivel, transmissao, observacoes, status
      ) values (
        v_uid,
        v_item->'veiculo'->>'tipo',
        v_item->'veiculo'->>'marca',
        v_item->'veiculo'->>'modelo',
        nullif(v_item->'veiculo'->>'versao', ''),
        nullif(v_item->'veiculo'->>'ano_fabricacao', '')::smallint,
        nullif(v_item->'veiculo'->>'ano_modelo', '')::smallint,
        nullif(v_item->'veiculo'->>'placa', ''),
        nullif(v_item->'veiculo'->>'cor', ''),
        nullif(v_item->'veiculo'->>'km', '')::integer,
        nullif(v_item->'veiculo'->>'combustivel', ''),
        nullif(v_item->'veiculo'->>'transmissao', ''),
        nullif(v_item->'veiculo'->>'observacoes', ''),
        'em_estoque'
      )
      returning id into v_veiculo_id;

    elsif (v_item->>'direcao') = 'saida' then
      -- Veículo existente (já em estoque) saindo — vendido ou dado em troca.
      v_veiculo_id := (v_item->>'veiculo_id')::uuid;

      update public.veiculos
      set status = 'vendido'
      where id = v_veiculo_id and created_by = v_uid and status = 'em_estoque';

      if not found then
        raise exception 'Veículo % não está disponível em estoque', v_veiculo_id;
      end if;
    else
      raise exception 'Direção inválida: %', v_item->>'direcao';
    end if;

    insert into public.negociacao_veiculos (
      created_by, negociacao_id, veiculo_id, direcao, valor_atribuido, condicao_na_negociacao
    ) values (
      v_uid, v_negociacao_id, v_veiculo_id, v_item->>'direcao',
      (v_item->>'valor_atribuido')::numeric, nullif(v_item->>'condicao_na_negociacao', '')
    );
  end loop;

  return v_negociacao_id;
end;
$$;

comment on function public.criar_negociacao is 'Registra uma negociação completa (compra/venda/troca) com seus veículos de entrada e saída em uma única transação.';
