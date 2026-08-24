create extension if not exists pgcrypto;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null check (thread_id ~ '^[a-z0-9-]{1,80}$'),
  sender_email text not null,
  sender_name text not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_thread_created_idx
  on public.chat_messages (thread_id, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "realtime can read chat inserts" on public.chat_messages;
create policy "realtime can read chat inserts"
  on public.chat_messages for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on public.chat_messages from anon, authenticated;
grant select on public.chat_messages to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
end $$;
