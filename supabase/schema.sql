-- Run once in Supabase > SQL Editor
create table if not exists menu_items(
  id text primary key, name text not null, cat text not null, size text default '',
  price numeric(12,2) not null default 0, avail boolean default true, stock int default 0);
create table if not exists orders(
  id text primary key, bill_no text, table_no text, customer_name text, customer_phone text, notes text,
  staff text, order_type text, payment_status text, payment_method text, order_status text,
  items jsonb not null default '[]', subtotal numeric(12,2), tax numeric(12,2), total numeric(12,2),
  created_at timestamptz, updated_at timestamptz);
alter table menu_items enable row level security;
alter table orders enable row level security;
-- DEMO policies (open access). Replace with real auth before production.
create policy "demo all menu" on menu_items for all to anon using (true) with check (true);
create policy "demo all orders" on orders for all to anon using (true) with check (true);
