-- Trunken: схема базы для Supabase.
-- Как применить: Supabase → SQL Editor → New query → вставить весь файл → Run.
-- Роли: 'user' (обычный пользователь) и 'moderator' (модератор приложения).

-- ───────── Профили и роли ─────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 3 and 32),
  name text not null,
  role text not null default 'user' check (role in ('user', 'moderator')),
  banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- Профиль создаётся сам при регистрации (никнейм и имя приходят из metadata).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname, name)
  values (new.id, new.raw_user_meta_data ->> 'nickname', coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'nickname'));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_moderator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'moderator' and not banned);
$$;

-- Обычный пользователь не может сам поменять себе роль или снять бан.
create or replace function public.protect_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() пуст, когда запрос идёт из SQL Editor (владелец базы) — ему можно.
  if (new.role is distinct from old.role or new.banned is distinct from old.banned)
     and auth.uid() is not null and not public.is_moderator() then
    raise exception 'Только модератор может менять роль и бан';
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_role();

-- ───────── Дуо и компании ─────────
create table if not exists public.duos (
  id uuid primary key default gen_random_uuid(),
  inviter uuid not null references public.profiles (id) on delete cascade,
  invitee uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active')),
  code text not null default substr(md5(random()::text), 1, 6),
  created_at timestamptz not null default now(),
  unique (inviter, invitee)
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  color text not null default '#FB551D',
  owner_id uuid not null references public.profiles (id) on delete cascade,
  code text not null default substr(md5(random()::text), 1, 6),
  created_at timestamptz not null default now()
);

create table if not exists public.company_members (
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create or replace function public.in_duo(d uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.duos where id = d and auth.uid() in (inviter, invitee));
$$;

create or replace function public.in_company(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.company_members where company_id = c and user_id = auth.uid());
$$;

-- ───────── Вечера, участники, активность ─────────
create table if not exists public.evenings (
  id uuid primary key default gen_random_uuid(),
  space_type text not null check (space_type in ('personal', 'duo', 'company')),
  space_id uuid,
  title text not null,
  note text,
  quote_text text,
  quote_author uuid references public.profiles (id),
  quote_time text,
  photo_path text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  date timestamptz not null default now(),
  hidden boolean not null default false -- модератор может скрыть
);

create table if not exists public.evening_participants (
  evening_id uuid not null references public.evenings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (evening_id, user_id)
);

create table if not exists public.activities (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  space_type text not null check (space_type in ('personal', 'duo', 'company')),
  space_id uuid,
  kind text not null, -- evening, moment, vote, quote...
  at timestamptz not null default now()
);

create or replace function public.can_see_space(t text, s uuid, owner uuid) returns boolean
language sql stable as $$
  select case t
    when 'personal' then owner = auth.uid()
    when 'duo' then public.in_duo(s)
    when 'company' then public.in_company(s)
  end;
$$;

-- ───────── Жалобы (для модератора) ─────────
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter uuid not null references public.profiles (id) on delete cascade,
  evening_id uuid references public.evenings (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  reason text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────── Права доступа (RLS) ─────────
alter table public.profiles enable row level security;
alter table public.duos enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.evenings enable row level security;
alter table public.evening_participants enable row level security;
alter table public.activities enable row level security;
alter table public.reports enable row level security;

-- Профили видят все вошедшие (для поиска друзей по нику); менять — только свой или модератор.
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid() or public.is_moderator());

create policy duos_read on public.duos for select to authenticated using (auth.uid() in (inviter, invitee) or public.is_moderator());
create policy duos_insert on public.duos for insert to authenticated with check (inviter = auth.uid());
create policy duos_accept on public.duos for update to authenticated using (invitee = auth.uid());
create policy duos_delete on public.duos for delete to authenticated using (auth.uid() in (inviter, invitee) or public.is_moderator());

create policy companies_read on public.companies for select to authenticated using (public.in_company(id) or owner_id = auth.uid() or public.is_moderator());
create policy companies_insert on public.companies for insert to authenticated with check (owner_id = auth.uid());
create policy companies_update on public.companies for update to authenticated using (owner_id = auth.uid() or public.is_moderator());
create policy companies_delete on public.companies for delete to authenticated using (owner_id = auth.uid() or public.is_moderator());

create policy members_read on public.company_members for select to authenticated using (public.in_company(company_id) or public.is_moderator());
create policy members_add on public.company_members for insert to authenticated
  with check (user_id = auth.uid() or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()));
create policy members_remove on public.company_members for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()) or public.is_moderator());

create policy evenings_read on public.evenings for select to authenticated
  using ((not hidden and public.can_see_space(space_type, space_id, created_by)) or public.is_moderator());
create policy evenings_insert on public.evenings for insert to authenticated
  with check (created_by = auth.uid() and (space_type = 'personal' or public.can_see_space(space_type, space_id, created_by)));
create policy evenings_update on public.evenings for update to authenticated using (created_by = auth.uid() or public.is_moderator());
create policy evenings_delete on public.evenings for delete to authenticated using (created_by = auth.uid() or public.is_moderator());

create policy participants_read on public.evening_participants for select to authenticated
  using (exists (select 1 from public.evenings e where e.id = evening_id));
create policy participants_write on public.evening_participants for insert to authenticated
  with check (exists (select 1 from public.evenings e where e.id = evening_id and e.created_by = auth.uid()));

-- Активность пишет только сам пользователь за себя; читают участники пространства.
create policy activities_read on public.activities for select to authenticated
  using (user_id = auth.uid() or (space_type <> 'personal' and public.can_see_space(space_type, space_id, user_id)) or public.is_moderator());
create policy activities_insert on public.activities for insert to authenticated with check (user_id = auth.uid());

create policy reports_insert on public.reports for insert to authenticated with check (reporter = auth.uid());
create policy reports_read on public.reports for select to authenticated using (reporter = auth.uid() or public.is_moderator());
create policy reports_update on public.reports for update to authenticated using (public.is_moderator());

-- ───────── Фото ─────────
insert into storage.buckets (id, name, public) values ('photos', 'photos', false) on conflict (id) do nothing;
create policy photos_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy photos_read on storage.objects for select to authenticated using (bucket_id = 'photos');

-- ───────── Как назначить модератора ─────────
-- После регистрации в приложении выполни (подставь свой никнейм):
-- update public.profiles set role = 'moderator' where nickname = 'твой_ник';
