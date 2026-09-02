revoke execute on function public.get_released_representative_delivery_context_v1(text, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.record_representative_delivery_v1(text, uuid, uuid, bigint, text, text, text, text, uuid) from public, anon, authenticated;

grant execute on function public.get_released_representative_delivery_context_v1(text, uuid, uuid) to service_role;
grant execute on function public.record_representative_delivery_v1(text, uuid, uuid, bigint, text, text, text, text, uuid) to service_role;
