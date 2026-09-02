revoke execute on function public.record_operator_participant_delivery_v1(uuid, uuid, bigint, text, text, text, text, uuid) from public, anon, authenticated;

comment on function public.record_operator_participant_delivery_v1(uuid, uuid, bigint, text, text, text, text, uuid) is 'Deprecated authenticated wrapper. Provider delivery receipts use the service-only boundary.';

notify pgrst, 'reload schema';
