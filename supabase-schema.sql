-- Run this in your Supabase SQL editor

create table laundry_sessions (
  id uuid primary key default gen_random_uuid(),
  machine text not null check (machine in ('washer', 'dryer')),
  user_name text not null,
  user_phone text not null,
  started_at timestamptz not null default now(),
  estimated_end_at timestamptz not null,
  completed_at timestamptz,
  notified_at timestamptz
);

-- Enable realtime
alter publication supabase_realtime add table laundry_sessions;

-- Allow public read/write (no auth for simplicity)
create policy "public read" on laundry_sessions for select using (true);
create policy "public insert" on laundry_sessions for insert with check (true);
create policy "public update" on laundry_sessions for update using (true);

alter table laundry_sessions enable row level security;
