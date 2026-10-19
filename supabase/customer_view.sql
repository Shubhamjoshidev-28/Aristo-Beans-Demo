-- Run once in Supabase > SQL Editor (needed for the customer order page).
-- Lets the customer page read the store name / GST % / currency set in the owner app.
create table if not exists store_settings(id text primary key, data jsonb not null default '{}');
alter table store_settings enable row level security;
create policy "demo all settings" on store_settings for all to anon using (true) with check (true);