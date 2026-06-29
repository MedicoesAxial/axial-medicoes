-- ============================================================
-- AXIAL MEDIÇÕES - SEGURANÇA (Row Level Security)
-- ============================================================
-- Execute DEPOIS do 01_schema.sql.
-- Regras:
--   ADMIN     -> acessa e altera tudo
--   OPERADOR  -> só enxerga/lança em obras liberadas via acesso_obra
-- ============================================================

-- Helper: o usuário logado é admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and role = 'admin' and ativo = true
  );
$$;

-- Helper: o usuário tem acesso liberado à obra?
create or replace function public.tem_acesso_obra(p_obra uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
      or exists (
        select 1 from public.acesso_obra
        where user_id = auth.uid() and obra_id = p_obra
      );
$$;

-- ---------- LIGA RLS EM TODAS AS TABELAS ----------
alter table public.perfis        enable row level security;
alter table public.obras         enable row level security;
alter table public.acesso_obra   enable row level security;
alter table public.fornecedores  enable row level security;
alter table public.unidades      enable row level security;
alter table public.medicoes      enable row level security;
alter table public.medicao_itens enable row level security;

-- ============================================================
-- PERFIS
-- ============================================================
create policy "perfil: ver o próprio ou admin vê todos"
  on public.perfis for select using ( id = auth.uid() or public.is_admin() );

create policy "perfil: admin gerencia"
  on public.perfis for all using ( public.is_admin() ) with check ( public.is_admin() );

-- ============================================================
-- OBRAS
-- ============================================================
create policy "obras: admin vê todas / operador vê liberadas"
  on public.obras for select
  using ( public.is_admin() or public.tem_acesso_obra(id) );

create policy "obras: admin gerencia"
  on public.obras for all using ( public.is_admin() ) with check ( public.is_admin() );

-- ============================================================
-- ACESSO_OBRA (só admin mexe; operador pode ler os próprios)
-- ============================================================
create policy "acesso: operador vê os próprios / admin tudo"
  on public.acesso_obra for select
  using ( user_id = auth.uid() or public.is_admin() );

create policy "acesso: admin gerencia"
  on public.acesso_obra for all using ( public.is_admin() ) with check ( public.is_admin() );

-- ============================================================
-- FORNECEDORES e UNIDADES (todos logados leem; só admin edita)
-- ============================================================
create policy "fornecedores: todos leem" on public.fornecedores for select using ( auth.uid() is not null );
create policy "fornecedores: admin edita" on public.fornecedores for all using ( public.is_admin() ) with check ( public.is_admin() );

create policy "unidades: todos leem" on public.unidades for select using ( auth.uid() is not null );
create policy "unidades: admin edita" on public.unidades for all using ( public.is_admin() ) with check ( public.is_admin() );

-- ============================================================
-- MEDIÇÕES  (o coração do controle de acesso por obra)
-- ============================================================
create policy "medicoes: ler se tem acesso à obra"
  on public.medicoes for select
  using ( public.tem_acesso_obra(obra_id) );

create policy "medicoes: criar em obra liberada"
  on public.medicoes for insert
  with check ( public.tem_acesso_obra(obra_id) and criado_por = auth.uid() );

create policy "medicoes: atualizar se tem acesso e não finalizada"
  on public.medicoes for update
  using ( public.tem_acesso_obra(obra_id) )
  with check ( public.tem_acesso_obra(obra_id) );

create policy "medicoes: excluir só admin"
  on public.medicoes for delete using ( public.is_admin() );

-- ============================================================
-- ITENS DA MEDIÇÃO (herda acesso pela medição-pai)
-- ============================================================
create policy "itens: ler se tem acesso à obra da medição"
  on public.medicao_itens for select
  using ( exists (
    select 1 from public.medicoes m
    where m.id = medicao_id and public.tem_acesso_obra(m.obra_id)
  ));

create policy "itens: inserir se tem acesso"
  on public.medicao_itens for insert
  with check ( exists (
    select 1 from public.medicoes m
    where m.id = medicao_id and public.tem_acesso_obra(m.obra_id)
  ));

create policy "itens: atualizar se tem acesso"
  on public.medicao_itens for update
  using ( exists (
    select 1 from public.medicoes m
    where m.id = medicao_id and public.tem_acesso_obra(m.obra_id)
  ));

create policy "itens: excluir se tem acesso"
  on public.medicao_itens for delete
  using ( exists (
    select 1 from public.medicoes m
    where m.id = medicao_id and public.tem_acesso_obra(m.obra_id)
  ));

-- ============================================================
-- PERMISSÃO PARA AS VIEWS
-- ============================================================
grant select on public.v_medicao_itens  to authenticated;
grant select on public.v_medicao_totais to authenticated;
