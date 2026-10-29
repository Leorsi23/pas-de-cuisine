-- =====================================================================
--  Pas de Cuisine · banco no Supabase
--  Rode tudo isto UMA vez em: Supabase > SQL Editor > New query > Run
-- =====================================================================

-- Quem pode usar o app (só os usuários que você cadastrar)
create table if not exists public.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('cozinheira', 'pai')),
  nome text
);

-- O caderno de receitas (da trilha e importadas)
create table if not exists public.receitas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text default '',
  porcoes int not null default 4 check (porcoes between 1 and 100),
  tempo text default '',
  ingredientes jsonb not null default '[]'::jsonb,  -- [{qtd, unidade, item, ajustar}]
  passos jsonb not null default '[]'::jsonb,        -- [{texto, timer_min}]
  observacoes text default '',
  fonte text default '',
  pratos text[] not null default '{}',  -- pratos da trilha que esta receita cobre (ex.: {"1-arroz","4-arroz"})
  favorita boolean not null default false,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);

-- Cada vez que ela prepara um menu da trilha (ou uma receita do caderno)
create table if not exists public.preparos (
  id uuid primary key default gen_random_uuid(),
  menu_id int,                    -- preparo de um menu da trilha
  receita_id uuid references public.receitas(id) on delete set null,  -- ou de uma receita avulsa
  feito_em date not null default current_date,
  foto text,                      -- caminho da foto na pasta "pratos"
  anotacoes text default '',      -- o que ela mesma achou
  criado_em timestamptz not null default now(),
  check (menu_id is not null or receita_id is not null)
);

-- Links de avaliação enviados para quem comeu
create table if not exists public.convites (
  token text primary key,
  preparo_id uuid not null references public.preparos(id) on delete cascade,
  titulo text not null,
  foto_url text,                  -- endereço temporário da foto (vale até expirar)
  expira_em timestamptz not null,
  criado_em timestamptz not null default now()
);

-- As notas
create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  preparo_id uuid not null references public.preparos(id) on delete cascade,
  token text references public.convites(token) on delete set null,
  nome text not null,
  nota int not null check (nota between 1 and 5),
  melhorar text not null check (length(trim(melhorar)) >= 3),
  criada_em timestamptz not null default now()
);
create unique index if not exists avaliacoes_uma_por_pessoa
  on public.avaliacoes (preparo_id, lower(trim(nome)));

-- Prêmios já entregues
create table if not exists public.recompensas (
  id text primary key,
  entregue_em timestamptz not null default now()
);

-- Controle de uso da IA (limite diário)
create table if not exists public.importacoes (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  criada_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  Permissões
-- ---------------------------------------------------------------------
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where user_id = auth.uid());
$$;
create or replace function public.is_pai() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where user_id = auth.uid() and role = 'pai');
$$;

alter table public.members     enable row level security;
alter table public.receitas    enable row level security;
alter table public.preparos    enable row level security;
alter table public.convites    enable row level security;
alter table public.avaliacoes  enable row level security;
alter table public.recompensas enable row level security;
alter table public.importacoes enable row level security;

drop policy if exists "membro le a si" on public.members;
create policy "membro le a si" on public.members for select using (user_id = auth.uid());

-- receitas, preparos e convites: os membros fazem tudo
drop policy if exists "membros receitas" on public.receitas;
create policy "membros receitas" on public.receitas for all using (public.is_member()) with check (public.is_member());
drop policy if exists "membros preparos" on public.preparos;
create policy "membros preparos" on public.preparos for all using (public.is_member()) with check (public.is_member());
drop policy if exists "membros convites" on public.convites;
create policy "membros convites" on public.convites for all using (public.is_member()) with check (public.is_member());

-- avaliações: membros leem; só o pai apaga. Quem comeu grava pela função avaliar() abaixo.
drop policy if exists "membros leem avaliacoes" on public.avaliacoes;
drop policy if exists "pai apaga avaliacoes" on public.avaliacoes;
create policy "membros leem avaliacoes" on public.avaliacoes for select using (public.is_member());
create policy "pai apaga avaliacoes" on public.avaliacoes for delete using (public.is_pai());

-- recompensas: os dois leem; só o pai marca como entregue
drop policy if exists "membros leem recompensas" on public.recompensas;
drop policy if exists "pai entrega recompensas" on public.recompensas;
drop policy if exists "pai desfaz recompensas" on public.recompensas;
create policy "membros leem recompensas" on public.recompensas for select using (public.is_member());
create policy "pai entrega recompensas" on public.recompensas for insert with check (public.is_pai());
create policy "pai desfaz recompensas" on public.recompensas for delete using (public.is_pai());

-- importacoes: só a função da IA mexe (pela chave secreta). Nenhuma regra = ninguém de fora.

-- ---------------------------------------------------------------------
--  Página pública de avaliação (quem comeu não tem login)
--  Só estas duas funções ficam abertas, e só enxergam UM convite.
-- ---------------------------------------------------------------------
create or replace function public.ver_convite(p_token text)
returns json language plpgsql stable security definer set search_path = public as $$
declare c record;
begin
  select cv.titulo, cv.foto_url, cv.expira_em, p.feito_em
    into c
    from public.convites cv join public.preparos p on p.id = cv.preparo_id
   where cv.token = p_token;
  if not found then return json_build_object('ok', false, 'motivo', 'inexistente'); end if;
  if c.expira_em < now() then return json_build_object('ok', false, 'motivo', 'expirado'); end if;
  return json_build_object('ok', true, 'titulo', c.titulo, 'foto_url', c.foto_url, 'feito_em', c.feito_em);
end $$;

create or replace function public.avaliar(p_token text, p_nome text, p_nota int, p_melhorar text)
returns json language plpgsql volatile security definer set search_path = public as $$
declare cv record; n int;
begin
  select * into cv from public.convites where token = p_token;
  if not found or cv.expira_em < now() then
    return json_build_object('ok', false, 'motivo', 'Este link não vale mais.');
  end if;
  if p_nota is null or p_nota < 1 or p_nota > 5 then
    return json_build_object('ok', false, 'motivo', 'Escolha de 1 a 5 estrelas.');
  end if;
  if length(trim(coalesce(p_nome, ''))) < 2 then
    return json_build_object('ok', false, 'motivo', 'Escreva seu nome.');
  end if;
  if length(trim(coalesce(p_melhorar, ''))) < 3 then
    return json_build_object('ok', false, 'motivo', 'Conte o que ela pode melhorar.');
  end if;
  select count(*) into n from public.avaliacoes where preparo_id = cv.preparo_id;
  if n >= 15 then
    return json_build_object('ok', false, 'motivo', 'Este prato já recebeu avaliações demais.');
  end if;
  insert into public.avaliacoes (preparo_id, token, nome, nota, melhorar)
  values (cv.preparo_id, p_token, left(trim(p_nome), 40), p_nota, left(trim(p_melhorar), 600))
  on conflict (preparo_id, lower(trim(nome))) do update
    set nota = excluded.nota, melhorar = excluded.melhorar, criada_em = now();
  return json_build_object('ok', true);
end $$;

revoke all on function public.ver_convite(text) from public;
revoke all on function public.avaliar(text, text, int, text) from public;
grant execute on function public.ver_convite(text) to anon, authenticated;
grant execute on function public.avaliar(text, text, int, text) to anon, authenticated;

-- ---------------------------------------------------------------------
--  Pasta privada para as fotos dos pratos
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('pratos', 'pratos', false)
on conflict (id) do nothing;

drop policy if exists "membros veem pratos" on storage.objects;
drop policy if exists "membros enviam pratos" on storage.objects;
drop policy if exists "membros apagam pratos" on storage.objects;
create policy "membros veem pratos" on storage.objects for select
  using (bucket_id = 'pratos' and public.is_member());
create policy "membros enviam pratos" on storage.objects for insert
  with check (bucket_id = 'pratos' and public.is_member());
create policy "membros apagam pratos" on storage.objects for delete
  using (bucket_id = 'pratos' and public.is_member());

-- ---------------------------------------------------------------------
--  DEPOIS de criar os 2 usuários em Authentication > Users, rode
--  (troque os e-mails):
--
--  insert into public.members (user_id, role, nome)
--  select id, 'pai', 'Leo' from auth.users where email = 'SEU-EMAIL';
--  insert into public.members (user_id, role, nome)
--  select id, 'cozinheira', 'Alice' from auth.users where email = 'EMAIL-DA-ALICE';
-- ---------------------------------------------------------------------
