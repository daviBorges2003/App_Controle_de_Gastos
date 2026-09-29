-- =============================================================
-- Contas fixas: o que se repete todo mês, com dia certo
--   saídas fixas:  aluguel, luz, internet, assinaturas...
--   entradas fixas: salário, recarga do vale alimentação...
-- Cada pagamento/recebimento é um lançamento ligado à conta fixa
-- (transacoes.conta_fixa_id), e assim sabemos o que já foi pago no mês.
-- Rodar no Supabase: Dashboard → SQL Editor → New query → colar tudo → Run
-- =============================================================

create table public.contas_fixas (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome           text not null check (char_length(nome) between 1 and 60),
  tipo           public.tipo_transacao not null,
  valor          numeric(12, 2) not null check (valor > 0),  -- valor PREVISTO (a conta de luz real pode variar)
  -- Em meses mais curtos, dia 31 vira o último dia do mês (tratado na hora de calcular)
  dia_vencimento smallint not null check (dia_vencimento between 1 and 31),
  categoria_id   uuid not null,
  carteira_id    uuid not null,
  ativa          boolean not null default true,
  criado_em      timestamptz not null default now(),

  foreign key (categoria_id, user_id, tipo)
    references public.categorias (id, user_id, tipo) on delete restrict,
  foreign key (carteira_id, user_id)
    references public.carteiras (id, user_id) on delete restrict,
  unique (id, user_id)
);

grant select, insert, update, delete on public.contas_fixas to authenticated;

alter table public.contas_fixas enable row level security;

create policy "contas_fixas: dono tem acesso total" on public.contas_fixas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- -------------------------------------------------------------
-- Liga o lançamento à conta fixa que ele paga.
-- "on delete set null (conta_fixa_id)": se a conta fixa for apagada,
-- os lançamentos antigos continuam existindo, só perdem a ligação.
-- -------------------------------------------------------------
alter table public.transacoes
  add column conta_fixa_id uuid,
  add foreign key (conta_fixa_id, user_id)
    references public.contas_fixas (id, user_id) on delete set null (conta_fixa_id);

create index transacoes_conta_fixa_idx on public.transacoes (conta_fixa_id);

-- -------------------------------------------------------------
-- Dia do vencimento dentro de um mês (dia 31 em fevereiro → dia 28/29)
-- -------------------------------------------------------------
create function public.data_vencimento(mes date, dia smallint)
returns date
language sql
immutable
set search_path = ''
as $$
  select date_trunc('month', mes)::date
    + (least(dia, extract(day from date_trunc('month', mes) + interval '1 month - 1 day')::int) - 1);
$$;

-- -------------------------------------------------------------
-- CONTAS FIXAS DO MÊS: cada conta ativa + quanto já foi pago/recebido no período
-- App: supabase.rpc('contas_fixas_do_mes', { inicio: '2026-09-01', fim: '2026-10-01' })
-- -------------------------------------------------------------
create function public.contas_fixas_do_mes(inicio date, fim date)
returns table (
  id              uuid,
  nome            text,
  tipo            public.tipo_transacao,
  valor           numeric,
  dia_vencimento  smallint,
  vencimento      date,
  categoria_id    uuid,
  categoria_nome  text,
  icone           text,
  cor             text,
  carteira_id     uuid,
  carteira_nome   text,
  valor_realizado numeric,
  pago            boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    f.id,
    f.nome,
    f.tipo,
    f.valor,
    f.dia_vencimento,
    public.data_vencimento(inicio, f.dia_vencimento),
    cat.id,
    cat.nome,
    cat.icone,
    cat.cor,
    car.id,
    car.nome,
    coalesce(sum(t.valor), 0),
    count(t.id) > 0
  from public.contas_fixas f
  join public.categorias cat on cat.id = f.categoria_id
  join public.carteiras car on car.id = f.carteira_id
  left join public.transacoes t
    on t.conta_fixa_id = f.id and t.data >= inicio and t.data < fim
  where f.ativa
  group by f.id, cat.id, car.id
  order by f.tipo, f.dia_vencimento, f.nome;  -- receitas primeiro (enum ordena como declarado: 'receita', 'despesa')
$$;

-- -------------------------------------------------------------
-- GAMIFICAÇÃO: +20 XP por pagar uma saída fixa EM DIA
--   - vale só para o mês corrente (não dá para "pagar adiantado" meses futuros e farmar XP)
--   - uma vez por conta por mês
--   - "em dia" = registrado até o dia do vencimento (usa a data real do registro, não a data digitada)
-- -------------------------------------------------------------
create function public.dar_xp_conta_em_dia()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  dia  smallint;
begin
  if new.conta_fixa_id is null or new.tipo <> 'despesa' then
    return new;
  end if;

  if date_trunc('month', new.data) <> date_trunc('month', hoje) then
    return new;
  end if;

  select f.dia_vencimento into dia from public.contas_fixas f where f.id = new.conta_fixa_id;
  if hoje > public.data_vencimento(hoje, dia) then
    return new;
  end if;

  if exists (
    select 1
    from public.xp_movimentos x
    join public.transacoes t on t.id = x.transacao_id
    where x.motivo = 'conta_em_dia'
      and t.conta_fixa_id = new.conta_fixa_id
      and date_trunc('month', t.data) = date_trunc('month', new.data)
  ) then
    return new;
  end if;

  insert into public.xp_movimentos (user_id, quantidade, motivo, transacao_id)
  values (new.user_id, 20, 'conta_em_dia', new.id);

  return new;
end;
$$;

create trigger ao_pagar_conta_fixa_dar_xp
  after insert on public.transacoes
  for each row execute function public.dar_xp_conta_em_dia();
