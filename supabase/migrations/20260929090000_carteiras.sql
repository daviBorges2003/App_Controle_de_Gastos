-- =============================================================
-- Carteiras: de ONDE sai (ou para onde entra) o dinheiro
-- Ex: "Conta principal" (salário paga as contas) e
--     "Cartão Alimentação" (benefício paga o mercado)
-- Rodar no Supabase: Dashboard → SQL Editor → colar tudo → Run
-- =============================================================

create type public.tipo_carteira as enum ('conta', 'beneficio');

create table public.carteiras (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome          text not null check (char_length(nome) between 1 and 40),
  tipo          public.tipo_carteira not null default 'conta',
  -- Quanto havia na carteira quando o usuário começou a usar o app.
  -- O saldo acumula: saldo = saldo_inicial + entradas − saídas (de todos os meses)
  saldo_inicial numeric(12, 2) not null default 0,
  icone         text,
  cor           text,
  criado_em     timestamptz not null default now(),

  unique (user_id, nome),
  -- necessário para a FK composta em transacoes (mesma ideia das categorias)
  unique (id, user_id)
);

grant select, insert, update, delete on public.carteiras to authenticated;

alter table public.carteiras enable row level security;

create policy "carteiras: dono tem acesso total" on public.carteiras
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- -------------------------------------------------------------
-- Usuários que JÁ existem: ganham as carteiras e categorias novas
-- -------------------------------------------------------------
insert into public.carteiras (user_id, nome, tipo, icone, cor)
select u.id, c.nome, c.tipo::public.tipo_carteira, c.icone, c.cor
from auth.users u
cross join (values
  ('Conta principal',    'conta',     'bank',      '#1E88E5'),
  ('Cartão Alimentação', 'beneficio', 'food-card', '#FB8C00')
) as c (nome, tipo, icone, cor)
on conflict (user_id, nome) do nothing;

insert into public.categorias (user_id, nome, tipo, icone, cor)
select u.id, c.nome, c.tipo::public.tipo_transacao, c.icone, c.cor
from auth.users u
cross join (values
  ('Mercado',          'despesa', 'basket',    '#F9A825'),
  ('Vale alimentação', 'receita', 'food-card', '#FB8C00')
) as c (nome, tipo, icone, cor)
on conflict (user_id, nome, tipo) do nothing;

-- -------------------------------------------------------------
-- Toda transação passa a pertencer a uma carteira.
-- As que já existem vão para a "Conta principal".
-- -------------------------------------------------------------
alter table public.transacoes add column carteira_id uuid;

update public.transacoes t
set carteira_id = c.id
from public.carteiras c
where c.user_id = t.user_id
  and c.nome = 'Conta principal';

alter table public.transacoes
  alter column carteira_id set not null,
  -- Garante que a carteira é do MESMO usuário; não deixa apagar carteira com lançamentos
  add foreign key (carteira_id, user_id)
    references public.carteiras (id, user_id) on delete restrict;

create index transacoes_carteira_idx on public.transacoes (carteira_id);

-- -------------------------------------------------------------
-- NOVOS usuários: o trigger de cadastro passa a criar também
-- as carteiras e as categorias novas
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, new.raw_user_meta_data ->> 'nome');

  insert into public.carteiras (user_id, nome, tipo, icone, cor) values
    (new.id, 'Conta principal',    'conta',     'bank',      '#1E88E5'),
    (new.id, 'Cartão Alimentação', 'beneficio', 'food-card', '#FB8C00');

  insert into public.categorias (user_id, nome, tipo, icone, cor) values
    (new.id, 'Salário',          'receita', 'briefcase',       '#2E7D32'),
    (new.id, 'Freelance',        'receita', 'laptop',          '#43A047'),
    (new.id, 'Investimentos',    'receita', 'chart-line',      '#00897B'),
    (new.id, 'Vale alimentação', 'receita', 'food-card',       '#FB8C00'),
    (new.id, 'Outras receitas',  'receita', 'cash-plus',       '#7CB342'),
    (new.id, 'Mercado',          'despesa', 'basket',          '#F9A825'),
    (new.id, 'Alimentação',      'despesa', 'food',            '#E53935'),
    (new.id, 'Moradia',          'despesa', 'home',            '#8E24AA'),
    (new.id, 'Transporte',       'despesa', 'car',             '#1E88E5'),
    (new.id, 'Contas',           'despesa', 'file-document',   '#F4511E'),
    (new.id, 'Saúde',            'despesa', 'heart-pulse',     '#D81B60'),
    (new.id, 'Educação',         'despesa', 'school',          '#3949AB'),
    (new.id, 'Lazer',            'despesa', 'gamepad-variant', '#FB8C00'),
    (new.id, 'Compras',          'despesa', 'cart',            '#6D4C41'),
    (new.id, 'Outras despesas',  'despesa', 'dots-horizontal', '#757575');

  return new;
end;
$$;

-- -------------------------------------------------------------
-- RESUMO DAS CARTEIRAS num período (normalmente um mês):
--   saldo_final      = saldo acumulado até o fim do período
--   entradas/saidas  = só o que aconteceu dentro do período
-- App: supabase.rpc('resumo_carteiras', { inicio: '2026-09-01', fim: '2026-10-01' })
-- -------------------------------------------------------------
create function public.resumo_carteiras(inicio date, fim date)
returns table (
  id               uuid,
  nome             text,
  tipo             public.tipo_carteira,
  icone            text,
  cor              text,
  saldo_inicial    numeric,
  saldo_final      numeric,
  entradas_periodo numeric,
  saidas_periodo   numeric
)
language sql
stable
security invoker  -- o RLS continua valendo: cada um só vê as próprias carteiras
set search_path = ''
as $$
  select
    c.id,
    c.nome,
    c.tipo,
    c.icone,
    c.cor,
    c.saldo_inicial,
    c.saldo_inicial + coalesce(
      sum(case when t.tipo = 'receita' then t.valor else -t.valor end) filter (where t.data < fim),
      0
    ),
    coalesce(sum(t.valor) filter (where t.tipo = 'receita' and t.data >= inicio and t.data < fim), 0),
    coalesce(sum(t.valor) filter (where t.tipo = 'despesa' and t.data >= inicio and t.data < fim), 0)
  from public.carteiras c
  left join public.transacoes t on t.carteira_id = c.id
  group by c.id
  order by c.tipo, c.nome;  -- enum ordena na ordem declarada: 'conta' antes de 'beneficio'
$$;
