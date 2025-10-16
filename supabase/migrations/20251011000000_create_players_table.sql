-- Create players table
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone_number text,
  cssbattle_profile_link text,
  "group" text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_players_updated_at 
  before update on players 
  for each row 
  execute function update_updated_at_column();

-- Set up Row Level Security (RLS)
alter table players enable row level security;

-- Create policies
create policy "Players are viewable by everyone" on players
  for select using (true);

create policy "Players can insert their own data" on players
  for insert with check (true);

create policy "Players can update their own data" on players
  for update using (true);

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all on table players to anon, authenticated;