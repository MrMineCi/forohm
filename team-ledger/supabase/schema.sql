-- รันไฟล์นี้ใน Supabase > SQL Editor (กด Run ครั้งเดียว)

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default substr(md5(random()::text || clock_timestamp()::text), 1, 8),
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.teams on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id),
  kind text not null check (kind in ('win', 'loss')),
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  played_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index on public.transactions (team_id, played_on desc);

-- สร้างโปรไฟล์อัตโนมัติตอนสมัคร
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ตัวช่วยตรวจสิทธิ์ (security definer เพื่อไม่ให้ policy วนซ้ำตัวเอง)
create function public.is_team_member(tid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from team_members where team_id = tid and user_id = auth.uid());
$$;

create function public.is_team_owner(tid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from team_members where team_id = tid and user_id = auth.uid() and role = 'owner');
$$;

create function public.shares_team_with(uid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from team_members a join team_members b on a.team_id = b.team_id
    where a.user_id = auth.uid() and b.user_id = uid
  );
$$;

-- สร้างทีม: ผู้สร้างเป็น owner ทันที
create function public.create_team(team_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare tid uuid;
begin
  if auth.uid() is null then raise exception 'ต้องเข้าสู่ระบบก่อน'; end if;
  insert into teams (name, created_by) values (trim(team_name), auth.uid()) returning id into tid;
  insert into team_members (team_id, user_id, role) values (tid, auth.uid(), 'owner');
  return tid;
end $$;

-- เข้าร่วมทีมด้วยรหัสเชิญ
create function public.join_team(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare tid uuid;
begin
  if auth.uid() is null then raise exception 'ต้องเข้าสู่ระบบก่อน'; end if;
  select id into tid from teams where invite_code = lower(trim(code));
  if tid is null then raise exception 'ไม่พบทีมจากรหัสนี้'; end if;
  insert into team_members (team_id, user_id) values (tid, auth.uid()) on conflict do nothing;
  return tid;
end $$;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.transactions enable row level security;

create policy "profiles: self or teammates" on public.profiles
  for select to authenticated using (id = auth.uid() or public.shares_team_with(id));

create policy "teams: members only" on public.teams
  for select to authenticated using (public.is_team_member(id));

create policy "members: see own team" on public.team_members
  for select to authenticated using (public.is_team_member(team_id));

create policy "members: leave team" on public.team_members
  for delete to authenticated using (user_id = auth.uid());

create policy "tx: members read" on public.transactions
  for select to authenticated using (public.is_team_member(team_id));

create policy "tx: members add as self" on public.transactions
  for insert to authenticated with check (public.is_team_member(team_id) and user_id = auth.uid());

create policy "tx: delete own or owner" on public.transactions
  for delete to authenticated using (user_id = auth.uid() or public.is_team_owner(team_id));
