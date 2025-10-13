-- Allow anonymous read-only access needed for invite validation and genesis checks
-- Use minimal exposure: SELECT only; no insert/update/delete

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='users' AND policyname='users_select_for_invite_anon'
  ) THEN
    CREATE POLICY users_select_for_invite_anon
    ON public.users
    FOR SELECT
    TO anon
    USING (invite_code IS NOT NULL);
  END IF;
END$$;















