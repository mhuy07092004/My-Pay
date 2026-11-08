-- Period dates and cycle are written only through the API.
-- A user JWT may update the amount actually received, and nothing else.

revoke update on table public.pay_periods from public, anon, authenticated;
grant update (actual_net_cents) on table public.pay_periods to authenticated;
