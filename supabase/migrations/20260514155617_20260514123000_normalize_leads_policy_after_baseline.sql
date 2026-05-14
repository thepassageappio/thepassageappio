drop policy "lead intake can create leads" on "public"."leads";


  create policy "lead intake can create leads"
  on "public"."leads"
  as permissive
  for insert
  to anon, authenticated
with check (true);



