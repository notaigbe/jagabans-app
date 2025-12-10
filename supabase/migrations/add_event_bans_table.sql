-- Create event_bans table
create table if not exists event_bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade not null,
  banned_by uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamp with time zone default now(),
  unique(user_id, event_id)
);

-- Enable RLS
alter table event_bans enable row level security;

-- Create RLS policies
create policy "Users can view their own bans"
  on event_bans for select
  using (user_id = auth.uid());

create policy "Admins can view all bans"
  on event_bans for select
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid()
      and user_role in ('admin', 'super_admin')
    )
  );

create policy "Admins can insert bans"
  on event_bans for insert
  with check (
    exists (
      select 1 from user_profiles
      where id = auth.uid()
      and user_role in ('admin', 'super_admin')
    )
  );

create policy "Admins can delete bans"
  on event_bans for delete
  using (
    exists (
      select 1 from user_profiles
      where id = auth.uid()
      and user_role in ('admin', 'super_admin')
    )
  );

-- Create index for faster lookups
create index if not exists event_bans_user_id_idx on event_bans(user_id);
create index if not exists event_bans_event_id_idx on event_bans(event_id);
