-- =============================================================
-- Schema inicial: perfis, categorias e transações
-- Rodar no Supabase: Dashboard → SQL Editor → colar tudo → Run
-- =============================================================

-- Receita (entra dinheiro) ou despesa (sai dinheiro)
create type public.tipo_transacao as enum ('receita', 'despesa');

-- -------------------------------------------------------------
-- PERFIS: dados extras do usuário (auth.users é gerenciada pelo Supabase)
-- -------------------------------------------------------------
create table public.perfis (
  id        uuid primary key references auth.users (id) on delete cascade,
  nome      text,
  criado_em timestamptz not null default now()
);

-- -------------------------------------------------------------
-- CATEGORIAS: cada usuário tem as suas (Alimentação, Salário...)
-- -------------------------------------------------------------
create table public.categorias (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome      text not null check (char_length(nome) between 1 and 50),
  tipo      public.tipo_transacao not null,
  icone     text,  -- nome do ícone (MaterialCommunityIcons)
  cor       text,  -- hex, ex: '#E53935'
  criado_em timestamptz not null default now(),

  unique (user_id, nome, tipo),
  -- necessário para a FK composta em transacoes (ver abaixo)
  unique (id, user_id, tipo)
);

-- -------------------------------------------------------------
-- TRANSAÇÕES: cada lançamento de dinheiro
-- -------------------------------------------------------------
create table public.transacoes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  categoria_id uuid not null,
  tipo         public.tipo_transacao not null,
  valor        numeric(12, 2) not null check (valor > 0),  -- sempre positivo; o sinal vem do tipo
  descricao    text check (char_length(descricao) <= 200),
  data         date not null default current_date,
  criado_em    timestamptz not null default now(),

  -- Garante que a categoria é DO MESMO usuário e DO MESMO tipo
  -- (impede, por ex., uma despesa na categoria "Salário").
  -- on delete restrict: não deixa apagar categoria que tem transações.
  foreign key (categoria_id, user_id, tipo)
    references public.categorias (id, user_id, tipo) on delete restrict
);

-- Consulta mais comum: "transações do usuário X no mês Y, mais recentes primeiro"
create index transacoes_user_data_idx on public.transacoes (user_id, data desc);
create index transacoes_categoria_idx on public.transacoes (categoria_id);

-- -------------------------------------------------------------
-- PERMISSÕES + RLS (Row Level Security)
-- O app acessa o banco direto com a chave pública, então é o RLS
-- que garante que cada usuário só enxerga/altera as próprias linhas.
-- -------------------------------------------------------------
grant select, update on public.perfis to authenticated;
grant select, insert, update, delete on public.categorias, public.transacoes to authenticated;

alter table public.perfis     enable row level security;
alter table public.categorias enable row level security;
alter table public.transacoes enable row level security;

create policy "perfis: ver o próprio" on public.perfis
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "perfis: editar o próprio" on public.perfis
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "categorias: dono tem acesso total" on public.categorias
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "transacoes: dono tem acesso total" on public.transacoes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- -------------------------------------------------------------
-- NOVO USUÁRIO: cria o perfil e as categorias padrão automaticamente
-- -------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, new.raw_user_meta_data ->> 'nome');

  insert into public.categorias (user_id, nome, tipo, icone, cor) values
    (new.id, 'Salário',         'receita', 'briefcase',         '#2E7D32'),
    (new.id, 'Freelance',       'receita', 'laptop',            '#43A047'),
    (new.id, 'Investimentos',   'receita', 'chart-line',        '#00897B'),
    (new.id, 'Outras receitas', 'receita', 'cash-plus',         '#7CB342'),
    (new.id, 'Alimentação',     'despesa', 'food',              '#E53935'),
    (new.id, 'Moradia',         'despesa', 'home',              '#8E24AA'),
    (new.id, 'Transporte',      'despesa', 'car',               '#1E88E5'),
    (new.id, 'Contas',          'despesa', 'file-document',     '#F4511E'),
    (new.id, 'Saúde',           'despesa', 'heart-pulse',       '#D81B60'),
    (new.id, 'Educação',        'despesa', 'school',            '#3949AB'),
    (new.id, 'Lazer',           'despesa', 'gamepad-variant',   '#FB8C00'),
    (new.id, 'Compras',         'despesa', 'cart',              '#6D4C41'),
    (new.id, 'Outras despesas', 'despesa', 'dots-horizontal',   '#757575');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
