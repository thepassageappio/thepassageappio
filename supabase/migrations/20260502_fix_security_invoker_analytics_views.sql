-- Supabase security advisor: analytics views should run with the caller's
-- permissions/RLS context, not the view owner's privileges.
alter view if exists public.v_marketplace set (security_invoker = true);
alter view if exists public.v_north_star set (security_invoker = true);
alter view if exists public.v_engagement set (security_invoker = true);
alter view if exists public.v_path_performance set (security_invoker = true);
alter view if exists public.v_user_ltv set (security_invoker = true);
alter view if exists public.v_trigger_insights set (security_invoker = true);
alter view if exists public.v_churn set (security_invoker = true);
alter view if exists public.v_viral_loop set (security_invoker = true);
alter view if exists public.v_mrr set (security_invoker = true);
alter view if exists public.v_paywall_conversion set (security_invoker = true);
