-- =============================================================
-- Gamificação (parte 1): XP por lançamento, nível e streak
-- Rodar no Supabase: Dashboard → SQL Editor → colar tudo → Run
-- =============================================================

-- -------------------------------------------------------------
-- XP_MOVIMENTOS: extrato de XP (mesmo padrão das transações:
-- nunca guardamos um "saldo" editável, o total é a soma dos movimentos)
-- -------------------------------------------------------------
create table public.xp_movimentos (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  quantidade   integer not null,
  motivo       text not null,  -- 'lancamento' (futuro: 'conquista', 'conta_em_dia'...)
  -- Se a transação for apagada, o XP que ela deu some junto (evita "farmar" XP)
  transacao_id uuid references public.transacoes (id) on delete cascade,
  criado_em    timestamptz not null default now()
);

create index xp_movimentos_user_idx on public.xp_movimentos (user_id);
create index xp_movimentos_transacao_idx on public.xp_movimentos (transacao_id);

-- O usuário só LÊ o próprio XP. Quem escreve é o trigger abaixo (security definer),
-- então o app não tem como se dar XP sozinho.
grant select on public.xp_movimentos to authenticated;

alter table public.xp_movimentos enable row level security;

create policy "xp: ver o próprio" on public.xp_movimentos
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- -------------------------------------------------------------
-- +10 XP por lançamento, com teto de 100 XP/dia vindos de lançamentos
-- -------------------------------------------------------------
create function public.dar_xp_por_lancamento()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  xp_hoje integer;
begin
  select coalesce(sum(quantidade), 0) into xp_hoje
  from public.xp_movimentos
  where user_id = new.user_id
    and motivo = 'lancamento'
    and (criado_em at time zone 'America/Sao_Paulo')::date
        = (now() at time zone 'America/Sao_Paulo')::date;

  if xp_hoje < 100 then
    insert into public.xp_movimentos (user_id, quantidade, motivo, transacao_id)
    values (new.user_id, 10, 'lancamento', new.id);
  end if;

  return new;
end;
$$;

create trigger ao_criar_transacao_dar_xp
  after insert on public.transacoes
  for each row execute function public.dar_xp_por_lancamento();

-- -------------------------------------------------------------
-- RESUMO DO JOGADOR: chamado pelo app com supabase.rpc('resumo_jogador')
--
-- Nível: para chegar ao nível n são necessários 50·n·(n−1) XP
--   (nível 2 = 100 XP, nível 3 = 300, nível 4 = 600, nível 5 = 1000...)
-- Streak: dias seguidos em que o usuário REGISTROU algo (conta o dia em
--   que lançou, não a data do gasto — lançar gastos antigos não vale).
--   Continua valendo se o último registro foi hoje ou ontem.
-- -------------------------------------------------------------
create function public.resumo_jogador()
returns table (
  xp_total         integer,
  nivel            integer,
  xp_inicio_nivel  integer,
  xp_proximo_nivel integer,
  streak_atual     integer,
  registrou_hoje   boolean
)
language sql
stable
security invoker  -- roda com as permissões de quem chamou: o RLS continua valendo
set search_path = ''
as $$
  with xp as (
    select coalesce(sum(quantidade), 0)::integer as total
    from public.xp_movimentos
    where user_id = (select auth.uid())
  ),
  nv as (
    select total, floor((1 + sqrt(1 + 8 * total / 100.0)) / 2)::integer as nivel
    from xp
  ),
  hoje as (
    select (now() at time zone 'America/Sao_Paulo')::date as dia
  ),
  dias as (
    select distinct (criado_em at time zone 'America/Sao_Paulo')::date as dia
    from public.transacoes
    where user_id = (select auth.uid())
  ),
  -- "Gaps and islands": em dias consecutivos, dia − posição dá sempre o mesmo valor
  sequencias as (
    select max(dia) as ultimo_dia, count(*)::integer as tamanho
    from (select dia, dia - (row_number() over (order by dia))::integer as grupo from dias) g
    group by grupo
  )
  select
    nv.total,
    nv.nivel,
    50 * nv.nivel * (nv.nivel - 1),
    50 * (nv.nivel + 1) * nv.nivel,
    coalesce((
      select s.tamanho
      from sequencias s, hoje h
      where s.ultimo_dia >= h.dia - 1
      order by s.ultimo_dia desc
      limit 1
    ), 0),
    exists (select 1 from dias d, hoje h where d.dia = h.dia)
  from nv;
$$;
