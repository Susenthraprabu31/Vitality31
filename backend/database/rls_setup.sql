-- Dynamic RLS setup for all public tables
-- Policies are created only when user_id and/or tenant_id columns exist
-- NOTE: auth.uid() / auth.jwt() are Supabase functions. This script expects Supabase.

DO $$
DECLARE
  r record;
  has_user_id boolean;
  has_tenant_id boolean;
  user_id_type text;
  tenant_id_type text;
  policy_predicate text;
  policy_name text;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  LOOP
    -- Detect common tenant/user ownership columns
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = r.table_name
        AND column_name = 'user_id'
    ) INTO has_user_id;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = r.table_name
        AND column_name = 'tenant_id'
    ) INTO has_tenant_id;

    -- Get the data type of user_id column (if present)
    IF has_user_id THEN
      SELECT data_type
      INTO user_id_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = r.table_name
        AND column_name = 'user_id';
    END IF;

    -- Get the data type of tenant_id column (if present)
    IF has_tenant_id THEN
      SELECT data_type
      INTO tenant_id_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = r.table_name
        AND column_name = 'tenant_id';
    END IF;

    policy_predicate := NULL;

    IF has_user_id AND has_tenant_id THEN
      IF user_id_type = 'uuid' THEN
        policy_predicate := '(
          COALESCE(NULLIF(current_setting(''app.user_id'', true), '''')::uuid, auth.uid()) = user_id
          OR COALESCE(NULLIF(current_setting(''app.tenant_id'', true), ''''), (auth.jwt() ->> ''tenant_id'')) = tenant_id::text
        )';
      ELSE
        policy_predicate := '(
          COALESCE(NULLIF(current_setting(''app.user_id'', true), ''''), auth.uid()::text) = user_id::text
          OR COALESCE(NULLIF(current_setting(''app.tenant_id'', true), ''''), (auth.jwt() ->> ''tenant_id'')) = tenant_id::text
        )';
      END IF;
    ELSIF has_user_id THEN
      IF user_id_type = 'uuid' THEN
        policy_predicate := 'COALESCE(NULLIF(current_setting(''app.user_id'', true), '''')::uuid, auth.uid()) = user_id';
      ELSE
        policy_predicate := 'COALESCE(NULLIF(current_setting(''app.user_id'', true), ''''), auth.uid()::text) = user_id::text';
      END IF;
    ELSIF has_tenant_id THEN
      policy_predicate := 'COALESCE(NULLIF(current_setting(''app.tenant_id'', true), ''''), (auth.jwt() ->> ''tenant_id'')) = tenant_id::text';
    END IF;

    -- Only enable/force RLS if we can safely create policies
    IF policy_predicate IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.table_name);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r.table_name);

      policy_name := format('rls_%s_select', r.table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, r.table_name);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%s)', policy_name, r.table_name, policy_predicate);

      policy_name := format('rls_%s_insert', r.table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, r.table_name);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (%s)', policy_name, r.table_name, policy_predicate);

      policy_name := format('rls_%s_update', r.table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, r.table_name);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (%s) WITH CHECK (%s)', policy_name, r.table_name, policy_predicate, policy_predicate);

      policy_name := format('rls_%s_delete', r.table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, r.table_name);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (%s)', policy_name, r.table_name, policy_predicate);
    END IF;
  END LOOP;
END
$$;
