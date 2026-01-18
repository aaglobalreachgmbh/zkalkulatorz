-- 20240102_add_pricing.sql
-- ADD LIST PRICE TO PUBLIC TARIFFS

alter table public.tariffs_public 
add column list_price_netto numeric(10, 2) not null default 0.00;
