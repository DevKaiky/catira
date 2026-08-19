-- ============================================================================
-- Catira | Veículos avulsos, edição e exclusão transacional de negociações
-- ============================================================================
-- Fecha o ciclo de vida dos dados: veículo passa a existir independente de
-- negociação (criar_veiculo_avulso), negociações ganham edição restrita
-- (editar_negociacao) e exclusão com reversão segura (excluir_negociacao).
-- ============================================================================

create or replace function public.criar_veiculo_avulso(
  p_veiculo jsonb,
  p_aquisicao jsonb default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_veiculo_id uuid;
  v_negociacao_id uuid;
  v_valor numeric;
  v_data date;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  if coalesce(nullif(trim(p_veiculo->>'marca'), ''), '') = ''
     or coalesce(nullif(trim(p_veiculo->>'modelo'), ''), '') = '' then
    raise exception 'Informe ao menos marca e modelo do veículo';
  end if;

  insert into public.veiculos (
    created_by, tipo, marca, modelo, versao, ano_fabricacao, ano_modelo,
    placa, cor, km, combustivel, transmissao, observacoes, status
  ) values (
    v_uid,
    coalesce(nullif(p_veiculo->>'tipo', ''), 'carro'),
    trim(p_veiculo->>'marca'),
    trim(p_veiculo->>'modelo'),
    nullif(p_veiculo->>'versao', ''),
    nullif(p_veiculo->>'ano_fabricacao', '')::smallint,
    nullif(p_veiculo->>'ano_modelo', '')::smallint,
    nullif(p_veiculo->>'placa', ''),
    nullif(p_veiculo->>'cor', ''),
    nullif(p_veiculo->>'km', '')::integer,
    nullif(p_veiculo->>'combustivel', ''),
    nullif(p_veiculo->>'transmissao', ''),
    nullif(p_veiculo->>'observacoes', ''),
    'em_estoque'
  )
  returning id into v_veiculo_id;

  if p_aquisicao is not null and p_aquisicao <> 'null'::jsonb then
    v_valor := nullif(p_aquisicao->>'valor', '')::numeric;
    v_data  := coalesce(nullif(p_aquisicao->>'data', '')::date, current_date);

    if v_valor is null or v_valor < 0 then
      raise exception 'Valor de aquisição inválido';
    end if;

    insert into public.negociacoes (
      created_by, tipo, data_negociacao, contraparte_nome, contraparte_contato,
      valor_volta, status, observacoes
    ) values (
      v_uid, 'compra', v_data,
      coalesce(nullif(trim(p_aquisicao->>'contraparte_nome'), ''), 'Estoque inicial'),
      null, -v_valor, 'concluida',
      coalesce(nullif(p_aquisicao->>'observacoes', ''),
               'Aquisição registrada retroativamente no cadastro do veículo.')
    )
    returning id into v_negociacao_id;

    insert into public.negociacao_veiculos (
      created_by, negociacao_id, veiculo_id, direcao, valor_atribuido, condicao_na_negociacao
    ) values (
      v_uid, v_negociacao_id, v_veiculo_id, 'entrada', v_valor, null
    );
  end if;

  return v_veiculo_id;
end;
$$;

comment on function public.criar_veiculo_avulso is 'Cadastra um veículo direto no estoque, opcionalmente com uma negociação de compra retroativa que registra o valor de aquisição.';

create or replace function public.editar_negociacao(
  p_negociacao_id uuid,
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
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_status_atual text;
  v_qtd_atual integer;
  v_item jsonb;
  v_valor numeric;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  select status into v_status_atual
    from public.negociacoes
   where id = p_negociacao_id and created_by = v_uid
   for update;

  if not found then
    raise exception 'Negociação não encontrada';
  end if;

  if (p_status = 'cancelada') <> (v_status_atual = 'cancelada') then
    raise exception 'Não é possível alternar o status para/de "cancelada" pela edição. Para desfazer uma negociação, exclua-a — o sistema devolve os veículos ao estoque.';
  end if;

  if coalesce(nullif(trim(p_contraparte_nome), ''), '') = '' then
    raise exception 'Informe o nome da contraparte';
  end if;

  if p_itens is null then
    p_itens := '[]'::jsonb;
  end if;

  select count(*) into v_qtd_atual
    from public.negociacao_veiculos
   where negociacao_id = p_negociacao_id;

  if jsonb_array_length(p_itens) <> v_qtd_atual then
    raise exception 'A edição não pode adicionar nem remover veículos da negociação (a negociação tem % item(ns), foram enviados %). Para mudar quais veículos participaram, exclua a negociação e registre de novo.',
      v_qtd_atual, jsonb_array_length(p_itens);
  end if;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    v_valor := nullif(v_item->>'valor_atribuido', '')::numeric;
    if v_valor is null or v_valor < 0 then
      raise exception 'Valor atribuído inválido em um dos veículos';
    end if;

    update public.negociacao_veiculos
       set valor_atribuido = v_valor,
           condicao_na_negociacao = nullif(v_item->>'condicao_na_negociacao', '')
     where id = (v_item->>'id')::uuid
       and negociacao_id = p_negociacao_id
       and created_by = v_uid;

    if not found then
      raise exception 'Item % não pertence a esta negociação', v_item->>'id';
    end if;
  end loop;

  update public.negociacoes
     set tipo = p_tipo,
         data_negociacao = p_data_negociacao,
         contraparte_nome = trim(p_contraparte_nome),
         contraparte_contato = nullif(trim(p_contraparte_contato), ''),
         valor_volta = p_valor_volta,
         status = p_status,
         observacoes = nullif(p_observacoes, '')
   where id = p_negociacao_id and created_by = v_uid;

  return p_negociacao_id;
end;
$$;

comment on function public.editar_negociacao is 'Corrige os campos de uma negociação e o valor/condição dos veículos já vinculados. Não altera a composição de veículos.';

create or replace function public.excluir_negociacao(p_negociacao_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existe boolean;
  v_reg record;
  v_qtd integer;
  v_ids_entrada uuid[] := '{}';
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  select true into v_existe
    from public.negociacoes
   where id = p_negociacao_id and created_by = v_uid
   for update;

  if not found then
    raise exception 'Negociação não encontrada';
  end if;

  for v_reg in
    select nv.veiculo_id, v.marca, v.modelo
      from public.negociacao_veiculos nv
      join public.veiculos v on v.id = nv.veiculo_id
     where nv.negociacao_id = p_negociacao_id
       and nv.direcao = 'entrada'
  loop
    select count(*) into v_qtd
      from public.negociacao_veiculos
     where veiculo_id = v_reg.veiculo_id
       and negociacao_id <> p_negociacao_id;

    if v_qtd > 0 then
      raise exception 'O veículo % % entrou nesta negociação e já foi movimentado em outra. Exclua primeiro a negociação mais recente desse veículo.',
        v_reg.marca, v_reg.modelo;
    end if;

    select count(*) into v_qtd
      from public.despesas_veiculo
     where veiculo_id = v_reg.veiculo_id;

    if v_qtd > 0 then
      raise exception 'O veículo % % tem % despesa(s) registrada(s), que seriam apagadas junto. Remova as despesas antes de excluir esta negociação.',
        v_reg.marca, v_reg.modelo, v_qtd;
    end if;

    v_ids_entrada := array_append(v_ids_entrada, v_reg.veiculo_id);
  end loop;

  for v_reg in
    select nv.veiculo_id, v.marca, v.modelo
      from public.negociacao_veiculos nv
      join public.veiculos v on v.id = nv.veiculo_id
     where nv.negociacao_id = p_negociacao_id
       and nv.direcao = 'saida'
  loop
    select count(*) into v_qtd
      from public.negociacao_veiculos nv2
      join public.negociacoes n2 on n2.id = nv2.negociacao_id
     where nv2.veiculo_id = v_reg.veiculo_id
       and nv2.negociacao_id <> p_negociacao_id
       and nv2.direcao = 'saida'
       and n2.status <> 'cancelada';

    if v_qtd > 0 then
      raise exception 'O veículo % % também tem saída registrada em outra negociação. Ajuste essa outra negociação antes de excluir esta.',
        v_reg.marca, v_reg.modelo;
    end if;
  end loop;

  update public.veiculos v
     set status = 'em_estoque'
    from public.negociacao_veiculos nv
   where nv.negociacao_id = p_negociacao_id
     and nv.direcao = 'saida'
     and v.id = nv.veiculo_id
     and v.created_by = v_uid;

  delete from public.negociacoes
   where id = p_negociacao_id and created_by = v_uid;

  if array_length(v_ids_entrada, 1) is not null then
    delete from public.veiculos
     where id = any(v_ids_entrada) and created_by = v_uid;
  end if;
end;
$$;

comment on function public.excluir_negociacao is 'Exclui uma negociação revertendo seus efeitos (saídas voltam ao estoque, entradas são apagadas) ou bloqueia com mensagem clara quando reverter corromperia outra negociação.';

-- ----------------------------------------------------------------------------
-- criar_negociacao: reescrita completa (mesmo corpo de 0002, + bloqueio de
-- status 'cancelada' na criação, + search_path explícito na própria função).
-- ----------------------------------------------------------------------------
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
set search_path = public
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

  if p_status = 'cancelada' then
    raise exception 'Não é possível registrar uma negociação já cancelada. Registre-a normalmente e, se o negócio não se concretizar, exclua-a.';
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

comment on function public.criar_negociacao is 'Registra uma negociação completa (compra/venda/troca) com seus veículos de entrada e saída em uma única transação. Rejeita status "cancelada" na criação — negociações canceladas só existem via exclusão.';
