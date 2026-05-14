
-- Remove the old one, keep the explicitly named one
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;
;
