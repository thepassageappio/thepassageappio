


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."activate_estate"("p_workflow_id" "uuid", "p_activated_by" "text" DEFAULT 'system'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_family_count int := 0;
  v_fh_count int := 0;
BEGIN
  -- Activate the estate (draft → activated)
  UPDATE workflows
  SET
    activation_status = 'activated',
    activated_at = now(),
    updated_at = now()
  WHERE id = p_workflow_id
    AND activation_status = 'draft';

  -- Family tasks: draft → pending
  UPDATE tasks
  SET status = 'pending', activated_at = now(), updated_at = now()
  WHERE workflow_id = p_workflow_id
    AND status = 'draft'
    AND (funeral_home_eligible = false OR funeral_home_eligible IS NULL);
  GET DIAGNOSTICS v_family_count = ROW_COUNT;

  -- FH-eligible tasks: draft → assigned (go to FH work queue)
  UPDATE tasks
  SET status = 'assigned', activated_at = now(), updated_at = now()
  WHERE workflow_id = p_workflow_id
    AND status = 'draft'
    AND funeral_home_eligible = true;
  GET DIAGNOSTICS v_fh_count = ROW_COUNT;

  -- Log activation event
  INSERT INTO estate_events (estate_id, event_type, title, description, actor, created_at)
  VALUES (
    p_workflow_id, 'estate_activated', 'Case activated',
    v_family_count || ' family tasks + ' || v_fh_count || ' staff tasks activated.',
    p_activated_by, now()
  )
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'activated', true,
    'family_tasks', v_family_count,
    'fh_tasks', v_fh_count
  );
END;
$$;


ALTER FUNCTION "public"."activate_estate"("p_workflow_id" "uuid", "p_activated_by" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_activate_on_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.status IN ('urgent_first_steps_generated','active','in_progress','coordination_active','planning_active')
    AND coalesce(OLD.activation_status,'draft') = 'draft'
    AND NEW.activation_status = 'draft'
  THEN
    PERFORM activate_estate(NEW.id, 'auto');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_activate_on_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Upsert into public.users — handles both new signups and re-logins
  INSERT INTO public.users (
    id, email, first_name, last_name, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'given_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'family_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email       = EXCLUDED.email,
    first_name  = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name   = COALESCE(EXCLUDED.last_name, public.users.last_name),
    updated_at  = NOW();

  -- Upsert profile row — one per user, always
  INSERT INTO public.profiles (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_admin"("org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND coalesce(status, 'active') = 'active'
      AND role IN ('owner', 'admin')
      AND (user_id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email'))
  );
$$;


ALTER FUNCTION "public"."is_org_admin"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_member_of"("org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
      AND coalesce(status, 'active') = 'active'
      AND (user_id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email'))
  );
$$;


ALTER FUNCTION "public"."is_org_member_of"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workflow_owner"("wf_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM workflows
    WHERE id = wf_id AND user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_workflow_owner"("wf_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_user_completion"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  total_tasks int;
  done_tasks int;
  pct int;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE t.status IN ('done', 'handled', 'completed'))
  INTO total_tasks, done_tasks
  FROM tasks t
  JOIN workflows w ON w.id = t.workflow_id
  WHERE w.user_id = p_user_id;

  pct := CASE WHEN total_tasks > 0
    THEN round((done_tasks::numeric / total_tasks::numeric) * 100)
    ELSE 0
  END;

  UPDATE users SET file_completion_pct = pct, updated_at = now()
  WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."recalculate_user_completion"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_vendor_final_value_cents"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.final_value IS NOT NULL THEN
    NEW.final_value_cents := (NEW.final_value * 100)::integer;
  ELSE
    NEW.final_value_cents := NULL;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_vendor_final_value_cents"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_user_completion_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  estate_owner uuid;
BEGIN
  SELECT w.user_id INTO estate_owner
  FROM workflows w WHERE w.id = NEW.workflow_id;

  IF estate_owner IS NOT NULL THEN
    PERFORM recalculate_user_completion(estate_owner);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_user_completion_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."account_entitlements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "plan_id" "text" NOT NULL,
    "source" "text" DEFAULT 'stripe'::"text" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "stripe_session_id" "text",
    "estate_seats" integer DEFAULT 1 NOT NULL,
    "addon_seats" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "account_entitlements_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'past_due'::"text", 'cancelled'::"text", 'lapsed'::"text"])))
);


ALTER TABLE "public"."account_entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "label" "text" NOT NULL,
    "institution_name" "text",
    "account_type" "text",
    "last_four" "text",
    "approximate_value" integer,
    "is_joint" boolean DEFAULT false,
    "joint_holder_name" "text",
    "ownership" "text",
    "institution_phone" "text",
    "institution_email" "text",
    "institution_address" "text",
    "account_number_hint" "text",
    "plaid_account_id" "text",
    "plaid_item_id" "text",
    "plaid_connected" boolean DEFAULT false,
    "plaid_last_synced" timestamp with time zone,
    "notification_status" "text" DEFAULT 'pending'::"text",
    "notification_sent_at" timestamp with time zone,
    "sort_order" integer DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "accounts_account_type_check" CHECK (("account_type" = ANY (ARRAY['checking'::"text", 'savings'::"text", 'investment'::"text", 'retirement'::"text", 'life_insurance'::"text", 'property'::"text", 'vehicle'::"text", 'crypto'::"text", 'subscription'::"text", 'government'::"text", 'other'::"text"]))),
    CONSTRAINT "accounts_notification_status_check" CHECK (("notification_status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'confirmed'::"text", 'skipped'::"text"]))),
    CONSTRAINT "accounts_ownership_check" CHECK (("ownership" = ANY (ARRAY['sole'::"text", 'joint'::"text", 'beneficiary'::"text"])))
);


ALTER TABLE "public"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activation_confirmations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "witness_id" "uuid",
    "confirmed_by_user_id" "uuid",
    "confirmed_by_email" "text" NOT NULL,
    "confirmed_by_name" "text",
    "confirmation_role" "text" DEFAULT 'activation_witness'::"text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activation_confirmations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activation_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "requested_by_user_id" "uuid",
    "requested_by_email" "text",
    "requested_by_name" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reason" "text",
    "proof_source" "text",
    "confirmed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "activation_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."activation_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activation_witnesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text",
    "role" "text" DEFAULT 'activation_witness'::"text",
    "source" "text" DEFAULT 'manual'::"text",
    "source_id" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "invited_at" timestamp with time zone,
    "last_notified_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "activation_witnesses_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'removed'::"text"])))
);


ALTER TABLE "public"."activation_witnesses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "estate_id" "uuid",
    "audience" "text",
    "tone" "text",
    "content" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "requires_review" boolean DEFAULT true,
    "reviewed_by" "text",
    "reviewed_at" timestamp with time zone,
    "channel" "text",
    "sent_at" timestamp with time zone,
    "created_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "announcements_audience_check" CHECK (("audience" = ANY (ARRAY['immediate_family'::"text", 'close_friends'::"text", 'broader_community'::"text", 'public'::"text"]))),
    CONSTRAINT "announcements_channel_check" CHECK (("channel" = ANY (ARRAY['sms'::"text", 'email'::"text", 'copy'::"text", 'social_pending'::"text"]))),
    CONSTRAINT "announcements_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending_review'::"text", 'approved'::"text", 'sent'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "announcements_tone_check" CHECK (("tone" = ANY (ARRAY['simple'::"text", 'warm'::"text", 'minimal'::"text"])))
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."care_provider_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_name" "text" NOT NULL,
    "provider_type" "text" DEFAULT 'hospice'::"text" NOT NULL,
    "contact_name" "text",
    "contact_email" "text" NOT NULL,
    "contact_phone" "text",
    "website" "text",
    "locations_count" "text",
    "active_families_estimate" "text",
    "message" "text",
    "source" "text" DEFAULT 'care_provider_page'::"text",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "hubspot_contact_id" "text",
    "hubspot_company_id" "text",
    "hubspot_deal_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "care_provider_applications_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'discovery'::"text", 'pilot_proposed'::"text", 'pilot_active'::"text", 'closed_won'::"text", 'closed_lost'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."care_provider_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."children" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_id" "uuid",
    "guardian_person_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text",
    "date_of_birth" "date",
    "pediatrician_name" "text",
    "pediatrician_phone" "text",
    "allergies" "text",
    "medications" "text",
    "medical_notes" "text",
    "school_name" "text",
    "school_phone" "text",
    "teacher_name" "text",
    "grade" "text",
    "favorite_things" "text",
    "fears" "text",
    "comfort_notes" "text",
    "has_529" boolean DEFAULT false,
    "has_custodial_account" boolean DEFAULT false,
    "life_insurance_amount" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."children" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "label" "text" NOT NULL,
    "document_type" "text",
    "file_url" "text",
    "file_size_bytes" integer,
    "file_type" "text",
    "accessible_to" "text"[] DEFAULT '{}'::"text"[],
    "unlocks_on_trigger" boolean DEFAULT true,
    "expires_at" "date",
    "expiration_alert_sent" boolean DEFAULT false,
    "notes" "text",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "workflow_id" "uuid",
    CONSTRAINT "documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['will'::"text", 'trust'::"text", 'advance_directive'::"text", 'power_of_attorney'::"text", 'life_insurance'::"text", 'funeral_contract'::"text", 'property_deed'::"text", 'birth_certificate'::"text", 'passport'::"text", 'marriage_certificate'::"text", 'divorce_decree'::"text", 'military_records'::"text", 'tax_return'::"text", 'financial_statement'::"text", 'business_docs'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."estate_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid",
    "user_id" "uuid",
    "email" "text",
    "role" "text" DEFAULT 'participant'::"text" NOT NULL,
    "status" "text" DEFAULT 'invited'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "estate_access_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'participant'::"text", 'external_partner'::"text", 'activator'::"text", 'read_only'::"text", 'operator'::"text"]))),
    CONSTRAINT "estate_access_status_check" CHECK (("status" = ANY (ARRAY['invited'::"text", 'accepted'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."estate_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."estate_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "estate_id" "uuid",
    "event_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "actor" "text" DEFAULT 'system'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."estate_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."estate_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "estate_id" "uuid",
    "person_id" "uuid",
    "linked_user_id" "uuid",
    "role" "text" DEFAULT 'participant'::"text" NOT NULL,
    "can_view" boolean DEFAULT true NOT NULL,
    "can_complete_tasks" boolean DEFAULT true NOT NULL,
    "invite_status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "invite_token" "text" DEFAULT ("gen_random_uuid"())::"text",
    "invited_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" "text",
    "phone" "text",
    "email" "text",
    "workflow_id" "uuid" GENERATED ALWAYS AS ("estate_id") STORED,
    CONSTRAINT "estate_participants_invite_status_check" CHECK (("invite_status" = ANY (ARRAY['draft'::"text", 'sent'::"text", 'accepted'::"text", 'declined'::"text", 'bounced'::"text"])))
);


ALTER TABLE "public"."estate_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."estate_user_context" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "estate_id" "uuid",
    "user_id" "uuid",
    "relationship_to_deceased" "text",
    "decision_authority" "text",
    "urgent_situation" "text",
    "funeral_home_status" "text",
    "funeral_home_name" "text",
    "funeral_home_phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "estate_user_context_decision_authority_check" CHECK (("decision_authority" = ANY (ARRAY['yes'::"text", 'no'::"text", 'helping'::"text", 'unknown'::"text"]))),
    CONSTRAINT "estate_user_context_funeral_home_status_check" CHECK (("funeral_home_status" = ANY (ARRAY['selected'::"text", 'need_help'::"text", 'unknown'::"text"]))),
    CONSTRAINT "estate_user_context_urgent_situation_check" CHECK (("urgent_situation" = ANY (ARRAY['home'::"text", 'hospital'::"text", 'hospice'::"text", 'nursing_facility'::"text", 'unexpected'::"text", 'expected_soon'::"text", 'unknown'::"text"])))
);


ALTER TABLE "public"."estate_user_context" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "session_id" "uuid",
    "workflow_id" "uuid",
    "event_name" "text" NOT NULL,
    "event_category" "text",
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "step_number" integer,
    "section_name" "text",
    "time_on_step_seconds" integer,
    "time_since_signup_days" integer,
    "platform" "text",
    "device" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "events_event_category_check" CHECK (("event_category" = ANY (ARRAY['acquisition'::"text", 'onboarding'::"text", 'engagement'::"text", 'conversion'::"text", 'retention'::"text", 'trigger'::"text", 'marketplace'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."file_snapshots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "snapshot_date" "date" DEFAULT CURRENT_DATE,
    "completion_pct" integer,
    "wishes_pct" integer DEFAULT 0,
    "accounts_pct" integer DEFAULT 0,
    "people_pct" integer DEFAULT 0,
    "documents_pct" integer DEFAULT 0,
    "workflows_pct" integer DEFAULT 0,
    "vault_pct" integer DEFAULT 0,
    "accounts_count" integer DEFAULT 0,
    "people_count" integer DEFAULT 0,
    "documents_count" integer DEFAULT 0,
    "tasks_count" integer DEFAULT 0,
    "last_updated_section" "text",
    "days_since_last_edit" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."file_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funeral_home_partners" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "owner_name" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "zip" "text",
    "plan" "text" DEFAULT 'trial'::"text",
    "monthly_fee_cents" integer,
    "trial_started_at" timestamp with time zone,
    "trial_ends_at" timestamp with time zone,
    "subscribed_at" timestamp with time zone,
    "brand_name" "text",
    "logo_url" "text",
    "primary_color" "text",
    "families_referred" integer DEFAULT 0,
    "families_activated" integer DEFAULT 0,
    "activation_rate" numeric(5,2),
    "stripe_customer_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "organization_id" "uuid",
    "included_location_slots" integer DEFAULT 1 NOT NULL,
    "additional_location_fee_cents" integer DEFAULT 9900 NOT NULL,
    "active_case_limit" integer,
    "location_slots_status" "text" DEFAULT 'included'::"text" NOT NULL,
    CONSTRAINT "funeral_home_partners_plan_check" CHECK (("plan" = ANY (ARRAY['trial'::"text", 'basic'::"text", 'premium'::"text"])))
);


ALTER TABLE "public"."funeral_home_partners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."funeral_home_preferred_vendors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."funeral_home_preferred_vendors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."impact_commitments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid",
    "user_id" "uuid",
    "source_plan_id" "text" NOT NULL,
    "source_amount_cents" integer DEFAULT 0 NOT NULL,
    "pledge_percent" numeric(5,2),
    "pledge_amount_cents" integer DEFAULT 0 NOT NULL,
    "honoree_name" "text",
    "charity_category" "text" DEFAULT 'grief_support'::"text" NOT NULL,
    "charity_name" "text",
    "status" "text" DEFAULT 'pledged'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "fulfilled_at" timestamp with time zone,
    CONSTRAINT "impact_commitments_status_check" CHECK (("status" = ANY (ARRAY['pledged'::"text", 'queued'::"text", 'sent'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."impact_commitments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text",
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "flow_type" "text",
    "source" "text",
    "tally_submission_id" "text",
    "converted_to_user" boolean DEFAULT false,
    "converted_at" timestamp with time zone,
    "user_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_interactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "workflow_id" "uuid",
    "provider_id" "uuid",
    "trigger_context" "text",
    "days_since_death" integer,
    "surfaced_at" timestamp with time zone DEFAULT "now"(),
    "clicked_at" timestamp with time zone,
    "converted_at" timestamp with time zone,
    "order_value_cents" integer,
    "our_revenue_cents" integer,
    "converted" boolean DEFAULT false,
    "skipped" boolean DEFAULT false,
    "skip_reason" "text",
    "user_flow_type" "text",
    "user_plan" "text",
    "user_age_bracket" "text"
);


ALTER TABLE "public"."marketplace_interactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_providers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "provider_type" "text",
    "national" boolean DEFAULT false,
    "zip_codes" "text"[] DEFAULT '{}'::"text"[],
    "states" "text"[] DEFAULT '{}'::"text"[],
    "revenue_model" "text",
    "commission_pct" numeric(5,2),
    "flat_fee_cents" integer,
    "monthly_fee_cents" integer,
    "affiliate_url" "text",
    "affiliate_code" "text",
    "total_referrals" integer DEFAULT 0,
    "total_conversions" integer DEFAULT 0,
    "total_revenue_cents" integer DEFAULT 0,
    "our_total_cents" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "marketplace_providers_category_check" CHECK (("category" = ANY (ARRAY['florist'::"text", 'caterer'::"text", 'estate_attorney'::"text", 'grief_counselor'::"text", 'elder_law_attorney'::"text", 'obituary'::"text", 'life_insurance'::"text", 'financial_advisor'::"text", 'funeral_home'::"text", 'crematorium'::"text", 'cemetery'::"text", 'memorial_products'::"text", 'estate_sale'::"text", 'moving_cleanout'::"text", 'grief_photographer'::"text", 'digital_legacy'::"text", 'other'::"text"]))),
    CONSTRAINT "marketplace_providers_provider_type_check" CHECK (("provider_type" = ANY (ARRAY['affiliate'::"text", 'local_preferred'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "marketplace_providers_revenue_model_check" CHECK (("revenue_model" = ANY (ARRAY['affiliate_pct'::"text", 'flat_referral'::"text", 'monthly_listing'::"text", 'rev_share'::"text"])))
);


ALTER TABLE "public"."marketplace_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memorial_contributions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "memorial_id" "uuid",
    "contributor_name" "text" NOT NULL,
    "contributor_email" "text",
    "relationship" "text",
    "content_type" "text",
    "content_text" "text",
    "content_url" "text",
    "is_approved" boolean DEFAULT true,
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "memorial_contributions_content_type_check" CHECK (("content_type" = ANY (ARRAY['memory'::"text", 'photo'::"text", 'video'::"text", 'voice_note'::"text"])))
);


ALTER TABLE "public"."memorial_contributions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memorial_pages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "slug" "text",
    "title" "text",
    "bio" "text",
    "cover_photo_url" "text",
    "is_public" boolean DEFAULT true,
    "allow_contributions" boolean DEFAULT true,
    "published_at" timestamp with time zone,
    "total_visits" integer DEFAULT 0,
    "total_contributions" integer DEFAULT 0,
    "last_visited_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."memorial_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "estate_id" "uuid",
    "related_task_id" "uuid",
    "recipient_person_id" "uuid",
    "channel" "text",
    "subject" "text",
    "body" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "approved_by_user_id" "uuid",
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "messages_channel_check" CHECK (("channel" = ANY (ARRAY['sms'::"text", 'email'::"text", 'copy_link'::"text"]))),
    CONSTRAINT "messages_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'approved'::"text", 'scheduled'::"text", 'sent'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid",
    "action_id" "uuid",
    "channel" "text" NOT NULL,
    "recipient_email" "text",
    "recipient_phone" "text",
    "recipient_name" "text",
    "subject" "text",
    "body_preview" "text",
    "provider" "text",
    "provider_id" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "error_code" "text",
    "retry_count" integer DEFAULT 0,
    "last_retry_at" timestamp with time zone,
    "next_expected_update" "text",
    "intended_recipient_email" "text",
    "intended_recipient_phone" "text",
    "actual_recipient_email" "text",
    "actual_recipient_phone" "text",
    "qa_override_active" boolean DEFAULT false,
    "source" "text",
    CONSTRAINT "notification_log_channel_check" CHECK (("channel" = ANY (ARRAY['email'::"text", 'sms'::"text"]))),
    CONSTRAINT "notification_log_provider_check" CHECK (("provider" = ANY (ARRAY['resend'::"text", 'twilio'::"text"])))
);


ALTER TABLE "public"."notification_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."obituaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid",
    "user_id" "uuid",
    "full_name" "text",
    "date_of_birth" "date",
    "date_of_death" "date",
    "city_of_birth" "text",
    "city_of_residence" "text",
    "occupation" "text",
    "survivors" "text",
    "preceded_by" "text",
    "life_summary" "text",
    "service_details" "text",
    "memorial_fund" "text",
    "draft" "text",
    "published_draft" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."obituaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orchestration_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid",
    "event_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "error_message" "text",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "orchestration_events_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'done'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."orchestration_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'staff'::"text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organization_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" DEFAULT 'funeral_home'::"text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text",
    "logo_url" "text",
    "primary_color" "text",
    "support_email" "text",
    "from_name" "text",
    "white_label_enabled" boolean DEFAULT false NOT NULL,
    "stripe_customer_id" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "marketplace_enabled" boolean DEFAULT true NOT NULL,
    "partner_plan" "text",
    "included_location_slots" integer DEFAULT 1 NOT NULL,
    "additional_location_fee_cents" integer DEFAULT 9900 NOT NULL,
    "active_case_limit" integer,
    "stripe_price_id" "text",
    "stripe_subscription_id" "text"
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."outcomes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "estate_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "why_it_matters" "text",
    "recommended_action" "text",
    "reassurance" "text",
    "owner_id" "uuid",
    "owner_label" "text",
    "status" "text" DEFAULT 'not_started'::"text",
    "priority" "text" DEFAULT 'high'::"text",
    "timeframe" "text" DEFAULT 'today'::"text",
    "category" "text",
    "position" integer DEFAULT 0,
    "source" "text" DEFAULT 'system'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "timeframe_label" "text",
    "next_action_cta" "text",
    CONSTRAINT "outcomes_priority_check" CHECK (("priority" = ANY (ARRAY['critical'::"text", 'high'::"text", 'normal'::"text"]))),
    CONSTRAINT "outcomes_status_check" CHECK (("status" = ANY (ARRAY['needs_owner'::"text", 'not_started'::"text", 'in_progress'::"text", 'handled'::"text", 'done'::"text"]))),
    CONSTRAINT "outcomes_timeframe_check" CHECK (("timeframe" = ANY (ARRAY['now'::"text", 'today'::"text", 'this_week'::"text", 'later'::"text"])))
);


ALTER TABLE "public"."outcomes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."people" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_id" "uuid",
    "linked_user_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text",
    "email" "text",
    "phone" "text",
    "relationship" "text",
    "role" "text" NOT NULL,
    "can_view_file" boolean DEFAULT false,
    "can_edit_file" boolean DEFAULT false,
    "notify_on_trigger" boolean DEFAULT true,
    "notify_order" integer DEFAULT 0,
    "invite_sent_at" timestamp with time zone,
    "invite_accepted_at" timestamp with time zone,
    "converted_to_paid" boolean DEFAULT false,
    "converted_at" timestamp with time zone,
    "personal_message" "text",
    "message_delivery" "text" DEFAULT 'on_trigger'::"text",
    "message_delivery_date" "date",
    "message_delivery_age" integer,
    "message_delivered_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "notify_channel" "text" DEFAULT 'both'::"text",
    "estate_id" "uuid",
    "invitation_token" "text",
    "participant_status" "text" DEFAULT 'not_invited'::"text" NOT NULL,
    "participant_discount_offered" boolean DEFAULT false NOT NULL,
    "participant_discount_used_at" timestamp with time zone,
    "estate_role_label" "text",
    CONSTRAINT "people_message_delivery_check" CHECK (("message_delivery" = ANY (ARRAY['on_trigger'::"text", 'on_date'::"text", 'on_age'::"text"]))),
    CONSTRAINT "people_notify_channel_check" CHECK (("notify_channel" = ANY (ARRAY['email'::"text", 'sms'::"text", 'both'::"text"]))),
    CONSTRAINT "people_participant_status_check" CHECK (("participant_status" = ANY (ARRAY['not_invited'::"text", 'invited'::"text", 'accepted'::"text", 'declined'::"text", 'converted'::"text"]))),
    CONSTRAINT "people_role_check" CHECK (("role" = ANY (ARRAY['executor'::"text", 'inner_circle'::"text", 'witness'::"text", 'recipient'::"text", 'guardian'::"text", 'co_editor'::"text", 'vendor_contact'::"text", 'attorney'::"text", 'advisor'::"text"])))
);


ALTER TABLE "public"."people" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "disposition" "text",
    "service_type" "text",
    "music_notes" "text",
    "reading_notes" "text",
    "special_requests" "text",
    "obituary_draft" "text",
    "organ_donor" boolean,
    "advance_directive_url" "text",
    "healthcare_proxy_name" "text",
    "healthcare_proxy_email" "text",
    "will_exists" boolean,
    "will_location" "text",
    "trust_exists" boolean,
    "attorney_name" "text",
    "attorney_email" "text",
    "attorney_phone" "text",
    "has_life_insurance" boolean,
    "has_retirement_accounts" boolean,
    "has_real_property" boolean,
    "estate_complexity" "text",
    "on_medicaid" boolean DEFAULT false,
    "on_medicare" boolean DEFAULT false,
    "prepaid_funeral_exists" boolean DEFAULT false,
    "prepaid_funeral_amount" integer,
    "medicaid_state" "text",
    "wishes_complete" boolean DEFAULT false,
    "accounts_complete" boolean DEFAULT false,
    "people_complete" boolean DEFAULT false,
    "documents_complete" boolean DEFAULT false,
    "vault_complete" boolean DEFAULT false,
    "workflows_complete" boolean DEFAULT false,
    "last_reviewed_at" timestamp with time zone,
    "next_review_due" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_disposition_check" CHECK (("disposition" = ANY (ARRAY['cremation'::"text", 'burial'::"text", 'green'::"text", 'donation'::"text", 'unsure'::"text"]))),
    CONSTRAINT "profiles_estate_complexity_check" CHECK (("estate_complexity" = ANY (ARRAY['simple'::"text", 'moderate'::"text", 'complex'::"text"]))),
    CONSTRAINT "profiles_service_type_check" CHECK (("service_type" = ANY (ARRAY['funeral'::"text", 'celebration'::"text", 'graveside'::"text", 'private'::"text", 'none'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_handoffs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid",
    "organization_id" "uuid",
    "provider_type" "text" NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "requested_by" "uuid",
    "family_contact_name" "text",
    "family_contact_email" "text",
    "family_contact_phone" "text",
    "provider_name" "text",
    "provider_contact_name" "text",
    "provider_contact_email" "text",
    "provider_contact_phone" "text",
    "location_name" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text",
    "family_permission_status" "text" DEFAULT 'not_requested'::"text" NOT NULL,
    "urgency" "text" DEFAULT 'planning'::"text",
    "care_context" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "next_expected_update" "text",
    "proof_summary" "text",
    "hubspot_company_id" "text",
    "hubspot_deal_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "provider_handoffs_family_permission_status_check" CHECK (("family_permission_status" = ANY (ARRAY['not_requested'::"text", 'requested'::"text", 'granted'::"text", 'declined'::"text", 'revoked'::"text"]))),
    CONSTRAINT "provider_handoffs_provider_type_check" CHECK (("provider_type" = ANY (ARRAY['funeral_home'::"text", 'hospice'::"text", 'assisted_living'::"text", 'senior_living'::"text", 'home_care'::"text", 'care_facility'::"text", 'vendor'::"text", 'other'::"text"]))),
    CONSTRAINT "provider_handoffs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'requested'::"text", 'family_invited'::"text", 'family_accepted'::"text", 'permission_granted'::"text", 'in_progress'::"text", 'handoff_ready'::"text", 'completed'::"text", 'declined'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."provider_handoffs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "referrer_user_id" "uuid",
    "referee_user_id" "uuid",
    "workflow_id" "uuid",
    "person_id" "uuid",
    "referral_type" "text",
    "invited_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "signed_up_at" timestamp with time zone,
    "converted_to_paid_at" timestamp with time zone,
    "converted_to_paid" boolean DEFAULT false,
    "revenue_attributed_cents" integer DEFAULT 0,
    "our_share_cents" integer DEFAULT 0,
    "referrer_rewarded" boolean DEFAULT false,
    "referrer_rewarded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "referrals_referral_type_check" CHECK (("referral_type" = ANY (ARRAY['participant_invite'::"text", 'direct_share'::"text", 'funeral_home'::"text", 'social_share'::"text", 'word_of_mouth'::"text"])))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scheduled_deliveries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "from_user_id" "uuid",
    "to_person_id" "uuid",
    "to_child_id" "uuid",
    "to_email" "text",
    "to_name" "text",
    "title" "text",
    "content_type" "text",
    "content_text" "text",
    "content_url" "text",
    "delivery_trigger" "text",
    "delivery_date" "date",
    "delivery_age" integer,
    "delivery_event" "text",
    "status" "text" DEFAULT 'scheduled'::"text",
    "delivered_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "to_phone" "text",
    "delivery_channel" "text" DEFAULT 'email'::"text" NOT NULL,
    "workflow_id" "uuid",
    CONSTRAINT "scheduled_deliveries_content_type_check" CHECK (("content_type" = ANY (ARRAY['letter'::"text", 'video'::"text", 'voice_note'::"text", 'photo_album'::"text"]))),
    CONSTRAINT "scheduled_deliveries_delivery_channel_check" CHECK (("delivery_channel" = ANY (ARRAY['email'::"text", 'sms'::"text", 'email_and_sms'::"text"]))),
    CONSTRAINT "scheduled_deliveries_delivery_trigger_check" CHECK (("delivery_trigger" = ANY (ARRAY['on_death'::"text", 'on_date'::"text", 'on_age'::"text", 'on_event'::"text", 'on_marriage'::"text", 'on_graduation'::"text"]))),
    CONSTRAINT "scheduled_deliveries_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'delivered'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."scheduled_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "duration_minutes" integer,
    "pages_visited" "text"[] DEFAULT '{}'::"text"[],
    "actions_taken" "text"[] DEFAULT '{}'::"text"[],
    "last_page" "text",
    "device" "text",
    "platform" "text",
    "browser" "text",
    "os" "text",
    "country" "text",
    "region" "text",
    "city" "text",
    CONSTRAINT "sessions_platform_check" CHECK (("platform" = ANY (ARRAY['mobile'::"text", 'desktop'::"text", 'tablet'::"text"])))
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."spouse_links" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id_a" "uuid",
    "user_id_b" "uuid",
    "relationship" "text" DEFAULT 'spouse'::"text",
    "joint_file" boolean DEFAULT true,
    "linked_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "spouse_links_relationship_check" CHECK (("relationship" = ANY (ARRAY['spouse'::"text", 'partner'::"text", 'domestic_partner'::"text"])))
);


ALTER TABLE "public"."spouse_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "stripe_price_id" "text",
    "plan" "text" DEFAULT 'free'::"text",
    "status" "text" DEFAULT 'inactive'::"text",
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "plan" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "amount_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text",
    "interval" "text",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "stripe_price_id" "text",
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "renewal_date" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "cancellation_reason" "text",
    "lapsed_at" timestamp with time zone,
    "last_payment_date" timestamp with time zone,
    "last_payment_amount" integer,
    "payment_count" integer DEFAULT 0,
    "lifetime_value_cents" integer DEFAULT 0,
    "failed_payment_count" integer DEFAULT 0,
    "last_failed_payment_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "stripe_checkout_session_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "subscriptions_interval_check" CHECK (("interval" = ANY (ARRAY['month'::"text", 'year'::"text", 'once'::"text"]))),
    CONSTRAINT "subscriptions_plan_check" CHECK (("plan" = ANY (ARRAY['monthly'::"text", 'annual'::"text", 'lifetime'::"text", 'semiannual'::"text", 'survivor'::"text", 'funeral_home'::"text", 'single_monthly'::"text", 'single_annual'::"text", 'single_lifetime'::"text", 'couple_monthly'::"text", 'couple_annual'::"text", 'family_monthly'::"text", 'family_annual'::"text", 'addon_monthly'::"text", 'addon_annual'::"text", 'urgent'::"text", 'partner_pilot'::"text", 'partner_local'::"text", 'partner_group'::"text", 'partner_location_addon'::"text"]))),
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'lapsed'::"text", 'trialing'::"text", 'past_due'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_status_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid",
    "task_id" "uuid",
    "action_id" "uuid",
    "status" "text" NOT NULL,
    "last_action_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_actor" "text",
    "channel" "text",
    "recipient" "text",
    "detail" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "provider" "text",
    "provider_message_id" "text",
    "provider_event_id" "text"
);


ALTER TABLE "public"."task_status_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workflow_id" "uuid",
    "user_id" "uuid",
    "assigned_to_person_id" "uuid",
    "assigned_to_email" "text",
    "assigned_to_name" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "priority" "text" DEFAULT 'normal'::"text",
    "due_days_after_trigger" integer,
    "due_date" "date",
    "instructions" "text",
    "helpful_links" "text"[] DEFAULT '{}'::"text"[],
    "related_account_id" "uuid",
    "related_document_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "completed_at" timestamp with time zone,
    "completed_by" "text",
    "notes" "text",
    "escalation_person_id" "uuid",
    "escalated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "custom_message" "text",
    "notified_at" timestamp with time zone,
    "owner_kind" "text" DEFAULT 'unassigned'::"text" NOT NULL,
    "playbook" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "draft_message" "text",
    "approval_status" "text" DEFAULT 'not_required'::"text" NOT NULL,
    "handled_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "help_requested_at" timestamp with time zone,
    "execution_recipient_email" "text",
    "execution_subject" "text",
    "execution_draft" "text",
    "execution_link" "text",
    "outcome_status" "text",
    "follow_up_at" timestamp with time zone,
    "completed_by_email" "text",
    "coordinator_notified_at" timestamp with time zone,
    "last_action_at" timestamp with time zone,
    "last_actor" "text",
    "channel" "text",
    "recipient" "text",
    "delivered_at" timestamp with time zone,
    "acknowledged_at" timestamp with time zone,
    "reminder_4h_sent_at" timestamp with time zone,
    "reminder_24h_sent_at" timestamp with time zone,
    "playbook_key" "text",
    "automation_level" "text",
    "execution_kind" "text",
    "waiting_on" "text",
    "partner_owner_role" "text",
    "funeral_home_eligible" boolean DEFAULT false NOT NULL,
    "proof_required" "text",
    "activated_at" timestamp with time zone,
    "organization_id" "uuid",
    CONSTRAINT "tasks_category_check" CHECK (("category" = ANY (ARRAY['legal'::"text", 'service'::"text", 'notifications'::"text", 'property'::"text", 'personal'::"text", 'medical'::"text", 'memorial'::"text", 'logistics'::"text", 'digital'::"text", 'financial'::"text", 'government'::"text", 'other'::"text"]))),
    CONSTRAINT "tasks_owner_kind_check" CHECK (("owner_kind" = ANY (ARRAY['unassigned'::"text", 'self'::"text", 'person'::"text", 'vendor'::"text"]))),
    CONSTRAINT "tasks_priority_check" CHECK (("priority" = ANY (ARRAY['urgent'::"text", 'high'::"text", 'normal'::"text", 'low'::"text"]))),
    CONSTRAINT "tasks_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'draft'::"text", 'assigned'::"text", 'in_progress'::"text", 'blocked'::"text", 'done'::"text", 'skipped'::"text", 'handled'::"text", 'not_started'::"text", 'needs_owner'::"text", 'completed'::"text", 'waiting'::"text", 'active'::"text"])))
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."urgent_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_key" "text" NOT NULL,
    "estate_id" "uuid",
    "step" integer DEFAULT 0,
    "situation" "text",
    "location" "text",
    "first_name" "text",
    "role" "text",
    "completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."urgent_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "date_of_birth" "date",
    "avatar_url" "text",
    "flow_type" "text",
    "referral_source" "text",
    "referral_code" "text",
    "referred_by" "uuid",
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "total_sessions" integer DEFAULT 0,
    "total_time_minutes" integer DEFAULT 0,
    "last_login_at" timestamp with time zone,
    "onboarding_completed" boolean DEFAULT false,
    "onboarding_step" integer DEFAULT 0,
    "file_completion_pct" integer DEFAULT 0,
    "plan" "text" DEFAULT 'free'::"text",
    "plan_status" "text" DEFAULT 'active'::"text",
    "is_deceased" boolean DEFAULT false,
    "deceased_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "renewal_date" "date",
    "plan_expires_at" timestamp with time zone,
    "stripe_customer_id" "text",
    "plan_activated_at" timestamp with time zone,
    "estate_seats_included" integer DEFAULT 1 NOT NULL,
    "estate_seats_addon" integer DEFAULT 0 NOT NULL,
    "estate_seats_total" integer GENERATED ALWAYS AS (GREATEST(1, ("estate_seats_included" + "estate_seats_addon"))) STORED,
    "participant_discount_eligible" boolean DEFAULT false NOT NULL,
    "participant_discount_source" "uuid",
    "stripe_subscription_id" "text",
    CONSTRAINT "users_flow_type_check" CHECK (("flow_type" = ANY (ARRAY['planning'::"text", 'immediate'::"text", 'spouse'::"text", 'parent'::"text", 'child'::"text"]))),
    CONSTRAINT "users_plan_check" CHECK (("plan" = ANY (ARRAY['free'::"text", 'monthly'::"text", 'annual'::"text", 'lifetime'::"text", 'semiannual'::"text", 'survivor'::"text", 'funeral_home'::"text", 'single_monthly'::"text", 'single_annual'::"text", 'single_lifetime'::"text", 'couple_monthly'::"text", 'couple_annual'::"text", 'family_monthly'::"text", 'family_annual'::"text", 'addon_monthly'::"text", 'addon_annual'::"text", 'urgent'::"text"]))),
    CONSTRAINT "users_plan_status_check" CHECK (("plan_status" = ANY (ARRAY['active'::"text", 'lapsed'::"text", 'cancelled'::"text", 'trialing'::"text", 'past_due'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflows" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "template_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "is_custom" boolean DEFAULT false,
    "trigger_type" "text" NOT NULL,
    "trigger_config" "jsonb" DEFAULT '{}'::"jsonb",
    "requires_confirmation" boolean DEFAULT true,
    "confirmation_count" integer DEFAULT 2,
    "activated_at" timestamp with time zone,
    "triggered_at" timestamp with time zone,
    "triggered_by" "uuid",
    "confirmed_by" "uuid"[] DEFAULT '{}'::"uuid"[],
    "participant_count" integer DEFAULT 0,
    "actions_total" integer DEFAULT 0,
    "actions_completed" integer DEFAULT 0,
    "actions_failed" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deceased_name" "text",
    "coordinator_name" "text",
    "coordinator_email" "text",
    "date_of_death" "date",
    "path" "text" DEFAULT 'red'::"text",
    "trigger_token" "text" DEFAULT ("gen_random_uuid"())::"text",
    "trigger_people" "jsonb" DEFAULT '[]'::"jsonb",
    "plan_name" "text",
    "obituary_url" "text",
    "announcement_id" "uuid",
    "wishes_id" "uuid",
    "obituary_id" "uuid",
    "estate_name" "text",
    "urgent_situation" "text",
    "funeral_home_status" "text",
    "relationship_to_deceased" "text",
    "decision_authority" "text",
    "deceased_first_name" "text",
    "deceased_last_name" "text",
    "mode" "text" DEFAULT 'red'::"text",
    "last_viewed_at" timestamp with time zone,
    "coordinator_phone" "text",
    "seat_index" integer,
    "seat_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "entitlement_source" "text",
    "locked_reason" "text",
    "setup_stage" "text" DEFAULT 'not_started'::"text" NOT NULL,
    "activation_status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "orchestration_summary" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "organization_id" "uuid",
    "organization_case_reference" "text",
    "partner_created_by" "uuid",
    CONSTRAINT "workflows_activation_status_check" CHECK (("activation_status" = ANY (ARRAY['draft'::"text", 'ready'::"text", 'pending_confirmation'::"text", 'activated'::"text", 'paused'::"text", 'completed'::"text"]))),
    CONSTRAINT "workflows_mode_check" CHECK (("mode" = ANY (ARRAY['red'::"text", 'green'::"text"]))),
    CONSTRAINT "workflows_path_check" CHECK (("path" = ANY (ARRAY['red'::"text", 'green'::"text"]))),
    CONSTRAINT "workflows_seat_status_check" CHECK (("seat_status" = ANY (ARRAY['active'::"text", 'available'::"text", 'locked'::"text", 'archived'::"text"]))),
    CONSTRAINT "workflows_setup_stage_check" CHECK (("setup_stage" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'ready'::"text", 'active'::"text", 'completed'::"text"]))),
    CONSTRAINT "workflows_status_check" CHECK (("status" = ANY (ARRAY['urgent_intake_started'::"text", 'urgent_first_steps_generated'::"text", 'coordination_setup_started'::"text", 'coordination_active'::"text", 'planning_active'::"text", 'draft'::"text", 'active'::"text", 'ready'::"text", 'triggered'::"text", 'completed'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."workflows" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."user_estate_capacity" WITH ("security_invoker"='true') AS
 SELECT "u"."id" AS "user_id",
    "u"."estate_seats_total" AS "total_seats",
    "count"("w"."id") FILTER (WHERE (("w"."status" <> 'archived'::"text") AND (COALESCE("w"."seat_status", 'active'::"text") <> 'archived'::"text") AND ("w"."path" = 'green'::"text"))) AS "used_green_seats",
    GREATEST((0)::bigint, ("u"."estate_seats_total" - "count"("w"."id") FILTER (WHERE (("w"."status" <> 'archived'::"text") AND (COALESCE("w"."seat_status", 'active'::"text") <> 'archived'::"text") AND ("w"."path" = 'green'::"text"))))) AS "available_green_seats"
   FROM ("public"."users" "u"
     LEFT JOIN "public"."workflows" "w" ON ((("w"."user_id" = "u"."id") AND ("w"."path" = 'green'::"text"))))
  GROUP BY "u"."id", "u"."estate_seats_total";


ALTER VIEW "public"."user_estate_capacity" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_churn" WITH ("security_invoker"='true') AS
 SELECT "count"(*) FILTER (WHERE ("cancelled_at" > ("now"() - '30 days'::interval))) AS "churned_last_30_days",
    "count"(*) FILTER (WHERE ("status" = 'active'::"text")) AS "active_total",
    "round"(((("count"(*) FILTER (WHERE ("cancelled_at" > ("now"() - '30 days'::interval))))::numeric / (NULLIF("count"(*) FILTER (WHERE ("status" = 'active'::"text")), 0))::numeric) * (100)::numeric), 2) AS "monthly_churn_pct"
   FROM "public"."subscriptions";


ALTER VIEW "public"."v_churn" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_engagement" WITH ("security_invoker"='true') AS
 SELECT "count"(DISTINCT "user_id") FILTER (WHERE ("started_at" > ("now"() - '1 day'::interval))) AS "dau",
    "count"(DISTINCT "user_id") FILTER (WHERE ("started_at" > ("now"() - '7 days'::interval))) AS "wau",
    "count"(DISTINCT "user_id") FILTER (WHERE ("started_at" > ("now"() - '30 days'::interval))) AS "mau",
    "round"(((("count"(DISTINCT "user_id") FILTER (WHERE ("started_at" > ("now"() - '1 day'::interval))))::numeric / (NULLIF("count"(DISTINCT "user_id") FILTER (WHERE ("started_at" > ("now"() - '30 days'::interval))), 0))::numeric) * (100)::numeric), 2) AS "stickiness_pct"
   FROM "public"."sessions";


ALTER VIEW "public"."v_engagement" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_marketplace" WITH ("security_invoker"='true') AS
 SELECT "p"."category",
    "p"."provider_type",
    "count"("i"."id") AS "total_surfaced",
    "count"("i"."id") FILTER (WHERE ("i"."clicked_at" IS NOT NULL)) AS "clicked",
    "count"("i"."id") FILTER (WHERE ("i"."converted" = true)) AS "converted",
    "round"(((("count"("i"."id") FILTER (WHERE ("i"."clicked_at" IS NOT NULL)))::numeric / (NULLIF("count"("i"."id"), 0))::numeric) * (100)::numeric), 2) AS "click_rate_pct",
    "round"(((("count"("i"."id") FILTER (WHERE ("i"."converted" = true)))::numeric / (NULLIF("count"("i"."id") FILTER (WHERE ("i"."clicked_at" IS NOT NULL)), 0))::numeric) * (100)::numeric), 2) AS "conversion_rate_pct",
    (("sum"("i"."our_revenue_cents"))::numeric / 100.0) AS "our_revenue_dollars",
    "round"("avg"("i"."days_since_death"), 1) AS "avg_days_since_death"
   FROM ("public"."marketplace_interactions" "i"
     JOIN "public"."marketplace_providers" "p" ON (("p"."id" = "i"."provider_id")))
  GROUP BY "p"."category", "p"."provider_type"
  ORDER BY (("sum"("i"."our_revenue_cents"))::numeric / 100.0) DESC;


ALTER VIEW "public"."v_marketplace" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_mrr" WITH ("security_invoker"='true') AS
 SELECT "round"(("sum"(
        CASE
            WHEN ("plan" = 'monthly'::"text") THEN ("amount_cents")::numeric
            WHEN ("plan" = 'annual'::"text") THEN (("amount_cents")::numeric / 12.0)
            ELSE (0)::numeric
        END) / 100.0), 2) AS "mrr_dollars",
    "count"(*) FILTER (WHERE ("plan" = 'monthly'::"text")) AS "monthly_subscribers",
    "count"(*) FILTER (WHERE ("plan" = 'annual'::"text")) AS "annual_subscribers",
    "count"(*) FILTER (WHERE ("plan" = 'lifetime'::"text")) AS "lifetime_subscribers",
    "count"(*) AS "total_paid"
   FROM "public"."subscriptions"
  WHERE ("status" = 'active'::"text");


ALTER VIEW "public"."v_mrr" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_north_star" WITH ("security_invoker"='true') AS
 SELECT "count"(*) FILTER (WHERE (("plan" <> 'free'::"text") AND ("plan_status" = 'active'::"text"))) AS "active_paid_files",
    "count"(*) FILTER (WHERE ("plan" = 'free'::"text")) AS "active_free_files",
    "count"(*) AS "total_files",
    "count"(*) FILTER (WHERE ("file_completion_pct" >= 80)) AS "substantially_complete",
    "count"(*) FILTER (WHERE (("file_completion_pct" >= 80) AND ("plan" <> 'free'::"text"))) AS "protected_families",
    "round"("avg"("file_completion_pct"), 1) AS "avg_completion_pct",
    "count"(*) FILTER (WHERE ("created_at" > ("now"() - '7 days'::interval))) AS "new_this_week",
    "count"(*) FILTER (WHERE (("created_at" > ("now"() - '14 days'::interval)) AND ("created_at" <= ("now"() - '7 days'::interval)))) AS "new_last_week"
   FROM "public"."users";


ALTER VIEW "public"."v_north_star" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_path_performance" WITH ("security_invoker"='true') AS
 SELECT "flow_type",
    "count"(*) AS "total_users",
    "count"(*) FILTER (WHERE ("plan" <> 'free'::"text")) AS "paid_users",
    "round"(((("count"(*) FILTER (WHERE ("plan" <> 'free'::"text")))::numeric / (NULLIF("count"(*), 0))::numeric) * (100)::numeric), 2) AS "conversion_pct",
    "round"("avg"("total_time_minutes"), 1) AS "avg_session_minutes",
    "round"("avg"("file_completion_pct"), 1) AS "avg_file_completion_pct"
   FROM "public"."users" "u"
  GROUP BY "flow_type";


ALTER VIEW "public"."v_path_performance" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_paywall_conversion" WITH ("security_invoker"='true') AS
 SELECT "count"(*) FILTER (WHERE ("event_name" = 'paywall_hit'::"text")) AS "hit_paywall",
    "count"(*) FILTER (WHERE ("event_name" = 'upgraded'::"text")) AS "upgraded",
    "count"(*) FILTER (WHERE (("event_name" = 'paywall_hit'::"text") AND (("event_data" ->> 'mode'::"text") = 'draft'::"text"))) AS "saved_draft",
    "round"(((("count"(*) FILTER (WHERE ("event_name" = 'upgraded'::"text")))::numeric / (NULLIF("count"(*) FILTER (WHERE ("event_name" = 'paywall_hit'::"text")), 0))::numeric) * (100)::numeric), 2) AS "conversion_pct"
   FROM "public"."events";


ALTER VIEW "public"."v_paywall_conversion" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_trigger_insights" WITH ("security_invoker"='true') AS
 SELECT "count"(*) AS "total_triggers",
    "round"("avg"(EXTRACT(days FROM ("w"."triggered_at" - "u"."created_at"))), 1) AS "avg_days_signup_to_trigger",
    "round"("avg"((EXTRACT(days FROM ("w"."triggered_at" - "u"."created_at")) / 365.0)), 2) AS "avg_years_signup_to_trigger",
    "min"(EXTRACT(days FROM ("w"."triggered_at" - "u"."created_at"))) AS "min_days",
    "max"(EXTRACT(days FROM ("w"."triggered_at" - "u"."created_at"))) AS "max_days",
    "count"(*) FILTER (WHERE (EXTRACT(days FROM ("w"."triggered_at" - "u"."created_at")) < (30)::numeric)) AS "triggered_within_30_days",
    "count"(*) FILTER (WHERE ((EXTRACT(days FROM ("w"."triggered_at" - "u"."created_at")) >= (30)::numeric) AND (EXTRACT(days FROM ("w"."triggered_at" - "u"."created_at")) <= (365)::numeric))) AS "triggered_within_1_year",
    "count"(*) FILTER (WHERE (EXTRACT(days FROM ("w"."triggered_at" - "u"."created_at")) > (365)::numeric)) AS "triggered_after_1_year"
   FROM ("public"."workflows" "w"
     JOIN "public"."users" "u" ON (("u"."id" = "w"."user_id")))
  WHERE ("w"."triggered_at" IS NOT NULL);


ALTER VIEW "public"."v_trigger_insights" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_user_ltv" WITH ("security_invoker"='true') AS
 SELECT "s"."user_id",
    "u"."email",
    "u"."first_name",
    "u"."last_name",
    "s"."plan",
    "s"."started_at" AS "customer_since",
    (("s"."lifetime_value_cents")::numeric / 100.0) AS "lifetime_value_dollars",
    "s"."payment_count",
    "s"."last_payment_date",
    "s"."renewal_date",
    (EXTRACT(days FROM ("now"() - "s"."started_at")))::integer AS "days_as_customer",
    "u"."flow_type",
    "u"."file_completion_pct"
   FROM ("public"."subscriptions" "s"
     JOIN "public"."users" "u" ON (("u"."id" = "s"."user_id")))
  WHERE ("s"."status" = 'active'::"text");


ALTER VIEW "public"."v_user_ltv" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_viral_loop" WITH ("security_invoker"='true') AS
 SELECT "count"(*) AS "total_participants_invited",
    "count"(*) FILTER (WHERE ("signed_up_at" IS NOT NULL)) AS "signed_up",
    "count"(*) FILTER (WHERE ("converted_to_paid" = true)) AS "converted_to_paid",
    "round"(((("count"(*) FILTER (WHERE ("signed_up_at" IS NOT NULL)))::numeric / (NULLIF("count"(*), 0))::numeric) * (100)::numeric), 2) AS "signup_rate_pct",
    "round"(((("count"(*) FILTER (WHERE ("converted_to_paid" = true)))::numeric / (NULLIF("count"(*) FILTER (WHERE ("signed_up_at" IS NOT NULL)), 0))::numeric) * (100)::numeric), 2) AS "paid_conversion_pct",
    (("sum"("revenue_attributed_cents"))::numeric / 100.0) AS "total_viral_revenue"
   FROM "public"."referrals";


ALTER VIEW "public"."v_viral_loop" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_request_id" "uuid",
    "vendor_id" "uuid",
    "workflow_id" "uuid",
    "task_id" "uuid",
    "total_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "platform_fee" numeric(12,2) DEFAULT 0 NOT NULL,
    "platform_fee_percent" numeric(5,2) DEFAULT 12 NOT NULL,
    "net_vendor_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "payment_status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "payout_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "stripe_account_id" "text",
    "stripe_checkout_session_id" "text",
    "stripe_payment_intent_id" "text",
    "stripe_transfer_group" "text",
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "vendor_orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['draft'::"text", 'checkout_created'::"text", 'payment_pending'::"text", 'paid'::"text", 'failed'::"text", 'cancelled'::"text", 'refunded'::"text"]))),
    CONSTRAINT "vendor_orders_payout_status_check" CHECK (("payout_status" = ANY (ARRAY['pending'::"text", 'automatic_transfer'::"text", 'available'::"text", 'paid'::"text", 'failed'::"text", 'not_applicable'::"text"])))
);


ALTER TABLE "public"."vendor_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_request_id" "uuid" NOT NULL,
    "vendor_id" "uuid",
    "workflow_id" "uuid",
    "task_id" "uuid",
    "gross_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "application_fee_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "vendor_net_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "stripe_checkout_session_id" "text",
    "stripe_payment_intent_id" "text",
    "stripe_transfer_destination" "text",
    "status" "text" DEFAULT 'checkout_created'::"text" NOT NULL,
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payout_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payout_available_at" timestamp with time zone,
    "payout_paid_at" timestamp with time zone,
    "failure_reason" "text",
    CONSTRAINT "vendor_payments_payout_status_check" CHECK (("payout_status" = ANY (ARRAY['pending'::"text", 'available'::"text", 'paid'::"text", 'failed'::"text", 'not_applicable'::"text"]))),
    CONSTRAINT "vendor_payments_status_check" CHECK (("status" = ANY (ARRAY['checkout_created'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."vendor_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid",
    "workflow_id" "uuid" NOT NULL,
    "task_id" "uuid",
    "task_title" "text",
    "organization_id" "uuid",
    "requested_by_user_id" "uuid",
    "requested_by_email" "text",
    "requested_by_name" "text",
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "urgency" "text" DEFAULT 'planned'::"text" NOT NULL,
    "referral_source" "text" DEFAULT 'passage'::"text" NOT NULL,
    "response_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_note" "text",
    "vendor_note" "text",
    "marketplace_fee_percent" numeric(5,2),
    "passage_rev_share_percent" numeric(5,2),
    "funeral_home_rev_share_percent" numeric(5,2),
    "estimated_transaction_value" numeric(10,2),
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "viewed_at" timestamp with time zone,
    "in_progress_at" timestamp with time zone,
    "estimated_value" numeric(10,2),
    "final_value" numeric(10,2),
    "platform_fee_amount" numeric(10,2),
    "funeral_home_share_amount" numeric(10,2),
    "passage_share_amount" numeric(10,2),
    "payment_collection_status" "text" DEFAULT 'tracking_only'::"text" NOT NULL,
    "final_value_cents" integer,
    "created_by_email" "text",
    "stripe_checkout_session_id" "text",
    "stripe_payment_intent_id" "text",
    "stripe_connected_account_id" "text",
    "quote_approved_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "payout_status" "text" DEFAULT 'not_applicable'::"text" NOT NULL,
    "payout_amount" numeric(10,2),
    "payment_url_created_at" timestamp with time zone,
    "service_date" "date",
    "service_start_at" timestamp with time zone,
    "service_end_at" timestamp with time zone,
    "service_location" "text",
    "service_notes" "text",
    "family_contact_name" "text",
    "family_contact_phone" "text",
    "gross_amount" numeric(10,2),
    "passage_fee_percent" numeric(5,2) DEFAULT 12 NOT NULL,
    "passage_fee_amount" numeric(10,2),
    "stripe_fee_estimate" numeric(10,2),
    "vendor_net_amount" numeric(10,2),
    "family_accepted_at" timestamp with time zone,
    "scheduled_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "refunded_at" timestamp with time zone,
    "last_vendor_reminder_at" timestamp with time zone,
    "completion_reminder_at" timestamp with time zone,
    CONSTRAINT "vendor_requests_payment_collection_status_check" CHECK (("payment_collection_status" = ANY (ARRAY['not_required'::"text", 'quote_needed'::"text", 'quote_ready'::"text", 'family_accepted'::"text", 'checkout_created'::"text", 'payment_pending'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text", 'cancelled'::"text", 'tracking_only'::"text", 'passage_collects'::"text", 'paid_to_passage'::"text", 'vendor_paid'::"text", 'waived'::"text", 'payment_due'::"text"]))),
    CONSTRAINT "vendor_requests_payout_status_check" CHECK (("payout_status" = ANY (ARRAY['not_applicable'::"text", 'pending'::"text", 'available'::"text", 'paid'::"text", 'failed'::"text"]))),
    CONSTRAINT "vendor_requests_referral_source_check" CHECK (("referral_source" = ANY (ARRAY['funeral_home'::"text", 'passage'::"text", 'user'::"text"]))),
    CONSTRAINT "vendor_requests_status_check" CHECK (("status" = ANY (ARRAY['requested'::"text", 'viewed'::"text", 'quoted'::"text", 'family_accepted'::"text", 'payment_pending'::"text", 'paid'::"text", 'scheduled'::"text", 'completed'::"text", 'declined'::"text", 'cancelled'::"text", 'refunded'::"text", 'accepted'::"text", 'in_progress'::"text"]))),
    CONSTRAINT "vendor_requests_urgency_check" CHECK (("urgency" = ANY (ARRAY['rush'::"text", 'planned'::"text"])))
);


ALTER TABLE "public"."vendor_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text",
    "role" "text" DEFAULT 'staff'::"text" NOT NULL,
    "status" "text" DEFAULT 'invited'::"text" NOT NULL,
    "invited_by_user_id" "uuid",
    "invited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "vendor_team_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'manager'::"text", 'staff'::"text"]))),
    CONSTRAINT "vendor_team_members_status_check" CHECK (("status" = ANY (ARRAY['invited'::"text", 'active'::"text", 'inactive'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."vendor_team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_transfers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid",
    "vendor_order_id" "uuid",
    "vendor_request_id" "uuid",
    "stripe_transfer_id" "text",
    "amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "status" "text" DEFAULT 'created'::"text" NOT NULL,
    "milestone" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "vendor_transfers_status_check" CHECK (("status" = ANY (ARRAY['created'::"text", 'paid'::"text", 'failed'::"text", 'cancelled'::"text", 'reversed'::"text"])))
);


ALTER TABLE "public"."vendor_transfers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "short_description" "text",
    "zip_codes_served" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "rush_supported" boolean DEFAULT false NOT NULL,
    "rush_window_hours" integer,
    "planned_supported" boolean DEFAULT true NOT NULL,
    "contact_email" "text",
    "contact_phone" "text",
    "website" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "marketplace_fee_percent" numeric(5,2),
    "passage_rev_share_percent" numeric(5,2),
    "funeral_home_rev_share_percent" numeric(5,2),
    "estimated_transaction_value" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "estimated_value" numeric(10,2),
    "family_review_snippet" "text",
    "review_count" integer DEFAULT 0 NOT NULL,
    "average_rating" numeric(3,2),
    "recently_helped_count" integer DEFAULT 0 NOT NULL,
    "stripe_connect_account_id" "text",
    "stripe_connect_status" "text" DEFAULT 'not_connected'::"text" NOT NULL,
    "stripe_charges_enabled" boolean DEFAULT false NOT NULL,
    "stripe_payouts_enabled" boolean DEFAULT false NOT NULL,
    "vendor_terms_accepted_at" timestamp with time zone,
    "vendor_terms_version" "text",
    "stripe_connect_onboarding_url" "text",
    "stripe_connect_onboarding_expires_at" timestamp with time zone,
    "stripe_details_submitted" boolean DEFAULT false NOT NULL,
    "stripe_connect_last_checked_at" timestamp with time zone,
    "marketplace_fee_default_percent" numeric(5,2) DEFAULT 12 NOT NULL,
    "stripe_account_id" "text",
    CONSTRAINT "vendors_category_check" CHECK (("category" = ANY (ARRAY['florist'::"text", 'catering'::"text", 'memorial_printing'::"text", 'travel_lodging'::"text", 'transportation'::"text", 'clergy_officiant'::"text", 'venue'::"text", 'legal_estate_support'::"text", 'cemetery_monument'::"text", 'grief_support'::"text"]))),
    CONSTRAINT "vendors_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'inactive'::"text", 'rejected'::"text"]))),
    CONSTRAINT "vendors_stripe_connect_status_check" CHECK (("stripe_connect_status" = ANY (ARRAY['not_connected'::"text", 'onboarding'::"text", 'charges_enabled'::"text", 'payouts_enabled'::"text", 'restricted'::"text"])))
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "external_id" "text",
    "provider_event_id" "text",
    "workflow_id" "uuid",
    "task_id" "uuid",
    "action_id" "uuid",
    "payload" "jsonb",
    "status" "text" DEFAULT 'received'::"text" NOT NULL,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "workflow_id" "uuid",
    "disposition" "text",
    "service_type" "text",
    "religious_leader" "text",
    "music_preferences" "text",
    "readings" "text",
    "flower_preferences" "text",
    "obituary_draft" "text",
    "special_requests" "text",
    "organ_donation" boolean DEFAULT false,
    "notify_employer" boolean DEFAULT true,
    "notify_faith_community" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wishes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_actions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "workflow_id" "uuid",
    "sort_order" integer DEFAULT 0,
    "action_type" "text" NOT NULL,
    "recipient_type" "text",
    "recipient_person_id" "uuid",
    "recipient_email" "text",
    "recipient_phone" "text",
    "delay_hours" integer DEFAULT 0,
    "delay_type" "text" DEFAULT 'after_trigger'::"text",
    "scheduled_time" time without time zone,
    "subject" "text",
    "body" "text",
    "template_vars" "jsonb" DEFAULT '{}'::"jsonb",
    "attachments" "text"[] DEFAULT '{}'::"text"[],
    "requires_approval" boolean DEFAULT false,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "sent_at" timestamp with time zone,
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "delivered_at" timestamp with time zone,
    "delivery_status" "text" DEFAULT 'pending'::"text",
    "provider_message_id" "text",
    "recipient_name" "text",
    "task_title" "text",
    "accepted_at" timestamp with time zone,
    "handled_at" timestamp with time zone,
    "help_requested_at" timestamp with time zone,
    "notes" "text",
    "outcome_status" "text",
    "follow_up_at" timestamp with time zone,
    "completed_by_email" "text",
    "coordinator_notified_at" timestamp with time zone,
    "last_action_at" timestamp with time zone,
    "last_actor" "text",
    "channel" "text",
    "recipient" "text",
    "acknowledged_at" timestamp with time zone,
    "reminder_4h_sent_at" timestamp with time zone,
    "reminder_24h_sent_at" timestamp with time zone,
    CONSTRAINT "workflow_actions_action_type_check" CHECK (("action_type" = ANY (ARRAY['sms'::"text", 'email'::"text", 'phone_call'::"text", 'facebook_post'::"text", 'instagram_post'::"text", 'printed_letter'::"text", 'in_app'::"text", 'webhook'::"text", 'task_activate'::"text", 'document_unlock'::"text", 'memorial_publish'::"text", 'marketplace_trigger'::"text"]))),
    CONSTRAINT "workflow_actions_delay_type_check" CHECK (("delay_type" = ANY (ARRAY['after_trigger'::"text", 'after_previous'::"text", 'at_time'::"text"]))),
    CONSTRAINT "workflow_actions_recipient_type_check" CHECK (("recipient_type" = ANY (ARRAY['person'::"text", 'vendor'::"text", 'social_account'::"text", 'all_inner_circle'::"text"]))),
    CONSTRAINT "workflow_actions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'draft'::"text", 'waiting'::"text", 'assigned'::"text", 'sent'::"text", 'delivered'::"text", 'acknowledged'::"text", 'handled'::"text", 'needs_review'::"text", 'blocked'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."workflow_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid",
    "master_text" "text",
    "facebook_text" "text",
    "linkedin_text" "text",
    "twitter_text" "text",
    "instagram_text" "text",
    "sms_text" "text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."workflow_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workflow_id" "uuid",
    "event_type" "text" NOT NULL,
    "name" "text",
    "date" "date",
    "time" "text",
    "location_name" "text",
    "location_address" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "workflow_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['visitation'::"text", 'funeral'::"text", 'burial'::"text", 'reception'::"text", 'memorial'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."workflow_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workflow_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "persona_type" "text",
    "trigger_type" "text",
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "workflow_templates_persona_type_check" CHECK (("persona_type" = ANY (ARRAY['standard'::"text", 'spouse'::"text", 'parent'::"text", 'terminal'::"text", 'business_owner'::"text", 'custom'::"text"]))),
    CONSTRAINT "workflow_templates_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['death_confirmed'::"text", 'incapacitation'::"text", 'specific_date'::"text", 'age_reached'::"text", 'inactivity'::"text", 'manual'::"text", 'terminal_diagnosis'::"text"])))
);


ALTER TABLE "public"."workflow_templates" OWNER TO "postgres";


ALTER TABLE ONLY "public"."account_entitlements"
    ADD CONSTRAINT "account_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activation_confirmations"
    ADD CONSTRAINT "activation_confirmations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activation_confirmations"
    ADD CONSTRAINT "activation_confirmations_request_id_confirmed_by_email_key" UNIQUE ("request_id", "confirmed_by_email");



ALTER TABLE ONLY "public"."activation_requests"
    ADD CONSTRAINT "activation_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activation_witnesses"
    ADD CONSTRAINT "activation_witnesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activation_witnesses"
    ADD CONSTRAINT "activation_witnesses_workflow_id_email_key" UNIQUE ("workflow_id", "email");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."care_provider_applications"
    ADD CONSTRAINT "care_provider_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."children"
    ADD CONSTRAINT "children_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."estate_access"
    ADD CONSTRAINT "estate_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."estate_access"
    ADD CONSTRAINT "estate_access_workflow_id_user_id_key" UNIQUE ("workflow_id", "user_id");



ALTER TABLE ONLY "public"."estate_events"
    ADD CONSTRAINT "estate_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."estate_participants"
    ADD CONSTRAINT "estate_participants_invite_token_key" UNIQUE ("invite_token");



ALTER TABLE ONLY "public"."estate_participants"
    ADD CONSTRAINT "estate_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."estate_user_context"
    ADD CONSTRAINT "estate_user_context_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."file_snapshots"
    ADD CONSTRAINT "file_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funeral_home_partners"
    ADD CONSTRAINT "funeral_home_partners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."funeral_home_preferred_vendors"
    ADD CONSTRAINT "funeral_home_preferred_vendor_organization_id_vendor_id_cat_key" UNIQUE ("organization_id", "vendor_id", "category");



ALTER TABLE ONLY "public"."funeral_home_preferred_vendors"
    ADD CONSTRAINT "funeral_home_preferred_vendors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."impact_commitments"
    ADD CONSTRAINT "impact_commitments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_interactions"
    ADD CONSTRAINT "marketplace_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_providers"
    ADD CONSTRAINT "marketplace_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memorial_contributions"
    ADD CONSTRAINT "memorial_contributions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memorial_pages"
    ADD CONSTRAINT "memorial_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memorial_pages"
    ADD CONSTRAINT "memorial_pages_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."obituaries"
    ADD CONSTRAINT "obituaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orchestration_events"
    ADD CONSTRAINT "orchestration_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_email_key" UNIQUE ("organization_id", "email");



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."outcomes"
    ADD CONSTRAINT "outcomes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."people"
    ADD CONSTRAINT "people_owner_email_unique" UNIQUE ("owner_id", "email");



ALTER TABLE ONLY "public"."people"
    ADD CONSTRAINT "people_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."provider_handoffs"
    ADD CONSTRAINT "provider_handoffs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scheduled_deliveries"
    ADD CONSTRAINT "scheduled_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."spouse_links"
    ADD CONSTRAINT "spouse_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_status_events"
    ADD CONSTRAINT "task_status_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_workflow_title_unique" UNIQUE ("workflow_id", "title");



ALTER TABLE ONLY "public"."urgent_sessions"
    ADD CONSTRAINT "urgent_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."urgent_sessions"
    ADD CONSTRAINT "urgent_sessions_session_key_key" UNIQUE ("session_key");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_unique" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_orders"
    ADD CONSTRAINT "vendor_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_payments"
    ADD CONSTRAINT "vendor_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_requests"
    ADD CONSTRAINT "vendor_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_requests"
    ADD CONSTRAINT "vendor_requests_response_token_key" UNIQUE ("response_token");



ALTER TABLE ONLY "public"."vendor_team_members"
    ADD CONSTRAINT "vendor_team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_team_members"
    ADD CONSTRAINT "vendor_team_members_vendor_id_email_key" UNIQUE ("vendor_id", "email");



ALTER TABLE ONLY "public"."vendor_transfers"
    ADD CONSTRAINT "vendor_transfers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_transfers"
    ADD CONSTRAINT "vendor_transfers_stripe_transfer_id_key" UNIQUE ("stripe_transfer_id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishes"
    ADD CONSTRAINT "wishes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_actions"
    ADD CONSTRAINT "workflow_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_announcements"
    ADD CONSTRAINT "workflow_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_events"
    ADD CONSTRAINT "workflow_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflow_templates"
    ADD CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_trigger_token_key" UNIQUE ("trigger_token");



CREATE UNIQUE INDEX "account_entitlements_stripe_session_unique" ON "public"."account_entitlements" USING "btree" ("stripe_session_id") WHERE ("stripe_session_id" IS NOT NULL);



CREATE INDEX "account_entitlements_stripe_subscription_idx" ON "public"."account_entitlements" USING "btree" ("stripe_subscription_id");



CREATE UNIQUE INDEX "account_entitlements_stripe_subscription_unique" ON "public"."account_entitlements" USING "btree" ("stripe_subscription_id") WHERE ("stripe_subscription_id" IS NOT NULL);



CREATE INDEX "account_entitlements_user_status_idx" ON "public"."account_entitlements" USING "btree" ("user_id", "status");



CREATE INDEX "activation_confirmations_request_idx" ON "public"."activation_confirmations" USING "btree" ("request_id", "created_at");



CREATE INDEX "activation_requests_workflow_idx" ON "public"."activation_requests" USING "btree" ("workflow_id", "status", "created_at" DESC);



CREATE INDEX "activation_witnesses_workflow_idx" ON "public"."activation_witnesses" USING "btree" ("workflow_id", "status");



CREATE INDEX "announcements_estate_idx" ON "public"."announcements" USING "btree" ("estate_id", "status");



CREATE INDEX "announcements_workflow_idx" ON "public"."workflow_announcements" USING "btree" ("workflow_id");



CREATE INDEX "documents_workflow_id_idx" ON "public"."documents" USING "btree" ("workflow_id");



CREATE INDEX "estate_access_email_idx" ON "public"."estate_access" USING "btree" ("lower"("email"));



CREATE INDEX "estate_access_workflow_id_idx" ON "public"."estate_access" USING "btree" ("workflow_id");



CREATE INDEX "estate_context_estate_idx" ON "public"."estate_user_context" USING "btree" ("estate_id");



CREATE INDEX "estate_events_idx" ON "public"."estate_events" USING "btree" ("estate_id", "created_at" DESC);



CREATE INDEX "estate_participants_estate_idx" ON "public"."estate_participants" USING "btree" ("estate_id");



CREATE INDEX "estate_participants_linked_user_idx" ON "public"."estate_participants" USING "btree" ("linked_user_id");



CREATE INDEX "estate_participants_token_idx" ON "public"."estate_participants" USING "btree" ("invite_token") WHERE ("invite_token" IS NOT NULL);



CREATE INDEX "estate_participants_workflow_id_idx" ON "public"."estate_participants" USING "btree" ("workflow_id");



CREATE INDEX "fh_partners_email_idx" ON "public"."funeral_home_partners" USING "btree" ("email");



CREATE INDEX "funeral_home_partners_organization_id_idx" ON "public"."funeral_home_partners" USING "btree" ("organization_id");



CREATE INDEX "funeral_home_preferred_vendors_org_category_idx" ON "public"."funeral_home_preferred_vendors" USING "btree" ("organization_id", "category", "active");



CREATE INDEX "idx_care_provider_applications_status" ON "public"."care_provider_applications" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_estate_access_email_lower" ON "public"."estate_access" USING "btree" ("lower"("email"));



CREATE INDEX "idx_estate_access_user_id" ON "public"."estate_access" USING "btree" ("user_id");



CREATE INDEX "idx_estate_access_workflow_id" ON "public"."estate_access" USING "btree" ("workflow_id");



CREATE INDEX "idx_events_created_at" ON "public"."events" USING "btree" ("created_at");



CREATE INDEX "idx_events_event_category" ON "public"."events" USING "btree" ("event_category");



CREATE INDEX "idx_events_event_name" ON "public"."events" USING "btree" ("event_name");



CREATE INDEX "idx_events_user_id" ON "public"."events" USING "btree" ("user_id");



CREATE INDEX "idx_marketplace_interactions_days_since_death" ON "public"."marketplace_interactions" USING "btree" ("days_since_death");



CREATE INDEX "idx_marketplace_interactions_trigger_context" ON "public"."marketplace_interactions" USING "btree" ("trigger_context");



CREATE INDEX "idx_marketplace_interactions_user_id" ON "public"."marketplace_interactions" USING "btree" ("user_id");



CREATE INDEX "idx_memorial_pages_slug" ON "public"."memorial_pages" USING "btree" ("slug");



CREATE INDEX "idx_notification_log_qa_override" ON "public"."notification_log" USING "btree" ("qa_override_active", "created_at" DESC);



CREATE INDEX "idx_notification_log_source" ON "public"."notification_log" USING "btree" ("source", "created_at" DESC);



CREATE INDEX "idx_people_email_lower" ON "public"."people" USING "btree" ("lower"("email"));



CREATE INDEX "idx_people_owner_id" ON "public"."people" USING "btree" ("owner_id");



CREATE INDEX "idx_provider_handoffs_org" ON "public"."provider_handoffs" USING "btree" ("organization_id", "provider_type", "status");



CREATE INDEX "idx_provider_handoffs_workflow" ON "public"."provider_handoffs" USING "btree" ("workflow_id", "provider_type", "status");



CREATE INDEX "idx_referrals_referee" ON "public"."referrals" USING "btree" ("referee_user_id");



CREATE INDEX "idx_referrals_referrer" ON "public"."referrals" USING "btree" ("referrer_user_id");



CREATE INDEX "idx_sessions_started_at" ON "public"."sessions" USING "btree" ("started_at");



CREATE INDEX "idx_sessions_user_id" ON "public"."sessions" USING "btree" ("user_id");



CREATE INDEX "idx_subscriptions_renewal_date" ON "public"."subscriptions" USING "btree" ("renewal_date");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_tasks_assigned_to_email_lower" ON "public"."tasks" USING "btree" ("lower"("assigned_to_email"));



CREATE INDEX "idx_tasks_follow_up_at" ON "public"."tasks" USING "btree" ("follow_up_at");



CREATE INDEX "idx_tasks_outcome_status" ON "public"."tasks" USING "btree" ("outcome_status");



CREATE INDEX "idx_tasks_user_id" ON "public"."tasks" USING "btree" ("user_id");



CREATE INDEX "idx_tasks_workflow_id" ON "public"."tasks" USING "btree" ("workflow_id");



CREATE INDEX "idx_users_created_at" ON "public"."users" USING "btree" ("created_at");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_flow_type" ON "public"."users" USING "btree" ("flow_type");



CREATE INDEX "idx_users_plan" ON "public"."users" USING "btree" ("plan");



CREATE INDEX "idx_workflow_actions_follow_up_at" ON "public"."workflow_actions" USING "btree" ("follow_up_at");



CREATE INDEX "idx_workflow_actions_outcome_status" ON "public"."workflow_actions" USING "btree" ("outcome_status");



CREATE INDEX "idx_workflow_actions_recipient_email_lower" ON "public"."workflow_actions" USING "btree" ("lower"("recipient_email"));



CREATE INDEX "idx_workflow_actions_workflow_id" ON "public"."workflow_actions" USING "btree" ("workflow_id");



CREATE INDEX "idx_workflow_events_workflow_id" ON "public"."workflow_events" USING "btree" ("workflow_id");



CREATE INDEX "idx_workflows_status" ON "public"."workflows" USING "btree" ("status");



CREATE INDEX "idx_workflows_user_id" ON "public"."workflows" USING "btree" ("user_id");



CREATE INDEX "impact_commitments_user_idx" ON "public"."impact_commitments" USING "btree" ("user_id", "status");



CREATE INDEX "impact_commitments_workflow_idx" ON "public"."impact_commitments" USING "btree" ("workflow_id");



CREATE INDEX "leads_email_idx" ON "public"."leads" USING "btree" ("email");



CREATE INDEX "messages_estate_idx" ON "public"."messages" USING "btree" ("estate_id");



CREATE INDEX "notif_log_status_idx" ON "public"."notification_log" USING "btree" ("status", "created_at");



CREATE INDEX "notif_log_workflow_idx" ON "public"."notification_log" USING "btree" ("workflow_id");



CREATE INDEX "notification_log_status_channel_idx" ON "public"."notification_log" USING "btree" ("status", "channel");



CREATE INDEX "notification_log_workflow_idx" ON "public"."notification_log" USING "btree" ("workflow_id", "status");



CREATE INDEX "obituaries_workflow_idx" ON "public"."obituaries" USING "btree" ("workflow_id");



CREATE INDEX "orch_events_status_idx" ON "public"."orchestration_events" USING "btree" ("status", "created_at");



CREATE INDEX "orch_events_workflow_idx" ON "public"."orchestration_events" USING "btree" ("workflow_id");



CREATE INDEX "organization_members_email_idx" ON "public"."organization_members" USING "btree" ("lower"("email"));



CREATE INDEX "organization_members_org_idx" ON "public"."organization_members" USING "btree" ("organization_id");



CREATE INDEX "organizations_slug_idx" ON "public"."organizations" USING "btree" ("slug");



CREATE INDEX "outcomes_estate_idx" ON "public"."outcomes" USING "btree" ("estate_id", "position");



CREATE INDEX "outcomes_estate_status_idx" ON "public"."outcomes" USING "btree" ("estate_id", "status");



CREATE INDEX "people_estate_idx" ON "public"."people" USING "btree" ("estate_id");



CREATE UNIQUE INDEX "people_invitation_token_key" ON "public"."people" USING "btree" ("invitation_token") WHERE ("invitation_token" IS NOT NULL);



CREATE INDEX "people_owner_email_idx" ON "public"."people" USING "btree" ("owner_id", "email") WHERE ("email" IS NOT NULL);



CREATE INDEX "people_owner_id_idx" ON "public"."people" USING "btree" ("owner_id");



CREATE INDEX "scheduled_deliveries_workflow_id_idx" ON "public"."scheduled_deliveries" USING "btree" ("workflow_id");



CREATE INDEX "stripe_subs_customer_idx" ON "public"."stripe_subscriptions" USING "btree" ("stripe_customer_id");



CREATE INDEX "stripe_subs_user_idx" ON "public"."stripe_subscriptions" USING "btree" ("user_id");



CREATE INDEX "subscriptions_plan_status_idx" ON "public"."subscriptions" USING "btree" ("plan", "status", "created_at" DESC);



CREATE UNIQUE INDEX "subscriptions_stripe_checkout_session_unique" ON "public"."subscriptions" USING "btree" ("stripe_checkout_session_id") WHERE ("stripe_checkout_session_id" IS NOT NULL);



CREATE UNIQUE INDEX "subscriptions_stripe_subscription_unique" ON "public"."subscriptions" USING "btree" ("stripe_subscription_id") WHERE ("stripe_subscription_id" IS NOT NULL);



CREATE INDEX "subscriptions_user_status_idx" ON "public"."subscriptions" USING "btree" ("user_id", "status", "created_at" DESC);



CREATE UNIQUE INDEX "task_status_events_provider_event_uidx" ON "public"."task_status_events" USING "btree" ("provider", "provider_event_id") WHERE ("provider_event_id" IS NOT NULL);



CREATE INDEX "task_status_events_task_idx" ON "public"."task_status_events" USING "btree" ("task_id", "last_action_at" DESC);



CREATE INDEX "task_status_events_workflow_idx" ON "public"."task_status_events" USING "btree" ("workflow_id", "last_action_at" DESC);



CREATE INDEX "tasks_activated_at_idx" ON "public"."tasks" USING "btree" ("activated_at") WHERE ("activated_at" IS NOT NULL);



CREATE INDEX "tasks_funeral_home_eligible_idx" ON "public"."tasks" USING "btree" ("workflow_id", "funeral_home_eligible", "status");



CREATE INDEX "tasks_last_action_idx" ON "public"."tasks" USING "btree" ("last_action_at" DESC);



CREATE INDEX "tasks_status_idx" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "tasks_status_last_action_idx" ON "public"."tasks" USING "btree" ("status", "last_action_at" DESC);



CREATE INDEX "tasks_waiting_on_idx" ON "public"."tasks" USING "btree" ("workflow_id", "waiting_on", "status");



CREATE INDEX "tasks_workflow_status_idx" ON "public"."tasks" USING "btree" ("workflow_id", "status");



CREATE INDEX "urgent_sessions_key_idx" ON "public"."urgent_sessions" USING "btree" ("session_key");



CREATE INDEX "urgent_sessions_user_idx" ON "public"."urgent_sessions" USING "btree" ("user_id");



CREATE INDEX "users_stripe_subscription_id_idx" ON "public"."users" USING "btree" ("stripe_subscription_id");



CREATE UNIQUE INDEX "vendor_orders_checkout_session_idx" ON "public"."vendor_orders" USING "btree" ("stripe_checkout_session_id") WHERE ("stripe_checkout_session_id" IS NOT NULL);



CREATE INDEX "vendor_orders_vendor_status_idx" ON "public"."vendor_orders" USING "btree" ("vendor_id", "payment_status", "created_at" DESC);



CREATE INDEX "vendor_orders_workflow_idx" ON "public"."vendor_orders" USING "btree" ("workflow_id", "created_at" DESC);



CREATE UNIQUE INDEX "vendor_payments_session_idx" ON "public"."vendor_payments" USING "btree" ("stripe_checkout_session_id") WHERE ("stripe_checkout_session_id" IS NOT NULL);



CREATE INDEX "vendor_payments_vendor_status_idx" ON "public"."vendor_payments" USING "btree" ("vendor_id", "status", "created_at" DESC);



CREATE INDEX "vendor_payments_workflow_idx" ON "public"."vendor_payments" USING "btree" ("workflow_id", "created_at" DESC);



CREATE INDEX "vendor_requests_org_status_idx" ON "public"."vendor_requests" USING "btree" ("organization_id", "status", "requested_at" DESC);



CREATE INDEX "vendor_requests_payment_status_idx" ON "public"."vendor_requests" USING "btree" ("payment_collection_status");



CREATE INDEX "vendor_requests_service_start_idx" ON "public"."vendor_requests" USING "btree" ("service_start_at") WHERE ("service_start_at" IS NOT NULL);



CREATE INDEX "vendor_requests_vendor_status_idx" ON "public"."vendor_requests" USING "btree" ("vendor_id", "status", "requested_at" DESC);



CREATE INDEX "vendor_requests_workflow_status_idx" ON "public"."vendor_requests" USING "btree" ("workflow_id", "status", "requested_at" DESC);



CREATE INDEX "vendor_team_members_email_idx" ON "public"."vendor_team_members" USING "btree" ("lower"("email"), "status");



CREATE INDEX "vendor_team_members_vendor_idx" ON "public"."vendor_team_members" USING "btree" ("vendor_id", "status");



CREATE INDEX "vendor_transfers_order_idx" ON "public"."vendor_transfers" USING "btree" ("vendor_order_id", "created_at" DESC);



CREATE INDEX "vendor_transfers_vendor_idx" ON "public"."vendor_transfers" USING "btree" ("vendor_id", "created_at" DESC);



CREATE INDEX "vendors_category_status_idx" ON "public"."vendors" USING "btree" ("category", "status");



CREATE INDEX "vendors_zip_codes_served_gin_idx" ON "public"."vendors" USING "gin" ("zip_codes_served");



CREATE INDEX "webhook_events_external_idx" ON "public"."webhook_events" USING "btree" ("provider", "external_id");



CREATE UNIQUE INDEX "webhook_events_provider_event_uidx" ON "public"."webhook_events" USING "btree" ("provider", "provider_event_id") WHERE ("provider_event_id" IS NOT NULL);



CREATE INDEX "webhook_events_workflow_idx" ON "public"."webhook_events" USING "btree" ("workflow_id", "created_at" DESC);



CREATE INDEX "wishes_user_idx" ON "public"."wishes" USING "btree" ("user_id");



CREATE INDEX "wishes_workflow_idx" ON "public"."wishes" USING "btree" ("workflow_id");



CREATE INDEX "workflow_actions_status_last_action_idx" ON "public"."workflow_actions" USING "btree" ("status", "last_action_at" DESC);



CREATE INDEX "workflow_events_workflow_idx" ON "public"."workflow_events" USING "btree" ("workflow_id");



CREATE INDEX "workflows_activation_status_idx" ON "public"."workflows" USING "btree" ("activation_status");



CREATE INDEX "workflows_organization_idx" ON "public"."workflows" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "workflows_path_idx" ON "public"."workflows" USING "btree" ("user_id", "path", "status");



CREATE INDEX "workflows_trigger_token_idx" ON "public"."workflows" USING "btree" ("trigger_token");



CREATE INDEX "workflows_user_id_idx" ON "public"."workflows" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "workflows_user_status_idx" ON "public"."workflows" USING "btree" ("user_id", "status", "created_at" DESC);



CREATE OR REPLACE TRIGGER "tasks_completion_update" AFTER UPDATE OF "status" ON "public"."tasks" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."trigger_user_completion_update"();



CREATE OR REPLACE TRIGGER "update_outcomes_updated_at" BEFORE UPDATE ON "public"."outcomes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "vendor_requests_sync_cents" BEFORE INSERT OR UPDATE OF "final_value" ON "public"."vendor_requests" FOR EACH ROW EXECUTE FUNCTION "public"."sync_vendor_final_value_cents"();



CREATE OR REPLACE TRIGGER "workflows_auto_activate" AFTER UPDATE OF "status" ON "public"."workflows" FOR EACH ROW EXECUTE FUNCTION "public"."auto_activate_on_status_change"();



ALTER TABLE ONLY "public"."account_entitlements"
    ADD CONSTRAINT "account_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accounts"
    ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activation_confirmations"
    ADD CONSTRAINT "activation_confirmations_confirmed_by_user_id_fkey" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."activation_confirmations"
    ADD CONSTRAINT "activation_confirmations_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."activation_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activation_confirmations"
    ADD CONSTRAINT "activation_confirmations_witness_id_fkey" FOREIGN KEY ("witness_id") REFERENCES "public"."activation_witnesses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activation_confirmations"
    ADD CONSTRAINT "activation_confirmations_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activation_requests"
    ADD CONSTRAINT "activation_requests_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."activation_requests"
    ADD CONSTRAINT "activation_requests_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activation_witnesses"
    ADD CONSTRAINT "activation_witnesses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."activation_witnesses"
    ADD CONSTRAINT "activation_witnesses_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."children"
    ADD CONSTRAINT "children_guardian_person_id_fkey" FOREIGN KEY ("guardian_person_id") REFERENCES "public"."people"("id");



ALTER TABLE ONLY "public"."children"
    ADD CONSTRAINT "children_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."estate_access"
    ADD CONSTRAINT "estate_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."estate_access"
    ADD CONSTRAINT "estate_access_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."estate_events"
    ADD CONSTRAINT "estate_events_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."estate_participants"
    ADD CONSTRAINT "estate_participants_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."estate_participants"
    ADD CONSTRAINT "estate_participants_linked_user_id_fkey" FOREIGN KEY ("linked_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."estate_participants"
    ADD CONSTRAINT "estate_participants_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."estate_user_context"
    ADD CONSTRAINT "estate_user_context_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."estate_user_context"
    ADD CONSTRAINT "estate_user_context_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id");



ALTER TABLE ONLY "public"."file_snapshots"
    ADD CONSTRAINT "file_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funeral_home_partners"
    ADD CONSTRAINT "funeral_home_partners_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."funeral_home_preferred_vendors"
    ADD CONSTRAINT "funeral_home_preferred_vendors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."funeral_home_preferred_vendors"
    ADD CONSTRAINT "funeral_home_preferred_vendors_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."impact_commitments"
    ADD CONSTRAINT "impact_commitments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."impact_commitments"
    ADD CONSTRAINT "impact_commitments_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."marketplace_interactions"
    ADD CONSTRAINT "marketplace_interactions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."marketplace_providers"("id");



ALTER TABLE ONLY "public"."marketplace_interactions"
    ADD CONSTRAINT "marketplace_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_interactions"
    ADD CONSTRAINT "marketplace_interactions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id");



ALTER TABLE ONLY "public"."memorial_contributions"
    ADD CONSTRAINT "memorial_contributions_memorial_id_fkey" FOREIGN KEY ("memorial_id") REFERENCES "public"."memorial_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memorial_pages"
    ADD CONSTRAINT "memorial_pages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_recipient_person_id_fkey" FOREIGN KEY ("recipient_person_id") REFERENCES "public"."people"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_related_task_id_fkey" FOREIGN KEY ("related_task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "public"."workflow_actions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_log"
    ADD CONSTRAINT "notification_log_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obituaries"
    ADD CONSTRAINT "obituaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."obituaries"
    ADD CONSTRAINT "obituaries_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orchestration_events"
    ADD CONSTRAINT "orchestration_events_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_members"
    ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outcomes"
    ADD CONSTRAINT "outcomes_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outcomes"
    ADD CONSTRAINT "outcomes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."people"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."people"
    ADD CONSTRAINT "people_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."people"
    ADD CONSTRAINT "people_linked_user_id_fkey" FOREIGN KEY ("linked_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_handoffs"
    ADD CONSTRAINT "provider_handoffs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."provider_handoffs"
    ADD CONSTRAINT "provider_handoffs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."provider_handoffs"
    ADD CONSTRAINT "provider_handoffs_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referee_user_id_fkey" FOREIGN KEY ("referee_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id");



ALTER TABLE ONLY "public"."scheduled_deliveries"
    ADD CONSTRAINT "scheduled_deliveries_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scheduled_deliveries"
    ADD CONSTRAINT "scheduled_deliveries_to_child_id_fkey" FOREIGN KEY ("to_child_id") REFERENCES "public"."children"("id");



ALTER TABLE ONLY "public"."scheduled_deliveries"
    ADD CONSTRAINT "scheduled_deliveries_to_person_id_fkey" FOREIGN KEY ("to_person_id") REFERENCES "public"."people"("id");



ALTER TABLE ONLY "public"."scheduled_deliveries"
    ADD CONSTRAINT "scheduled_deliveries_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."spouse_links"
    ADD CONSTRAINT "spouse_links_user_id_a_fkey" FOREIGN KEY ("user_id_a") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."spouse_links"
    ADD CONSTRAINT "spouse_links_user_id_b_fkey" FOREIGN KEY ("user_id_b") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."stripe_subscriptions"
    ADD CONSTRAINT "stripe_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_person_id_fkey" FOREIGN KEY ("assigned_to_person_id") REFERENCES "public"."people"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_escalation_person_id_fkey" FOREIGN KEY ("escalation_person_id") REFERENCES "public"."people"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_related_account_id_fkey" FOREIGN KEY ("related_account_id") REFERENCES "public"."accounts"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_related_document_id_fkey" FOREIGN KEY ("related_document_id") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."urgent_sessions"
    ADD CONSTRAINT "urgent_sessions_estate_id_fkey" FOREIGN KEY ("estate_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."urgent_sessions"
    ADD CONSTRAINT "urgent_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_participant_discount_source_fkey" FOREIGN KEY ("participant_discount_source") REFERENCES "public"."people"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."vendor_orders"
    ADD CONSTRAINT "vendor_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_orders"
    ADD CONSTRAINT "vendor_orders_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_orders"
    ADD CONSTRAINT "vendor_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_orders"
    ADD CONSTRAINT "vendor_orders_vendor_request_id_fkey" FOREIGN KEY ("vendor_request_id") REFERENCES "public"."vendor_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_orders"
    ADD CONSTRAINT "vendor_orders_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_payments"
    ADD CONSTRAINT "vendor_payments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_payments"
    ADD CONSTRAINT "vendor_payments_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_payments"
    ADD CONSTRAINT "vendor_payments_vendor_request_id_fkey" FOREIGN KEY ("vendor_request_id") REFERENCES "public"."vendor_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_payments"
    ADD CONSTRAINT "vendor_payments_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_requests"
    ADD CONSTRAINT "vendor_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_requests"
    ADD CONSTRAINT "vendor_requests_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_requests"
    ADD CONSTRAINT "vendor_requests_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_requests"
    ADD CONSTRAINT "vendor_requests_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_team_members"
    ADD CONSTRAINT "vendor_team_members_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_transfers"
    ADD CONSTRAINT "vendor_transfers_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_transfers"
    ADD CONSTRAINT "vendor_transfers_vendor_order_id_fkey" FOREIGN KEY ("vendor_order_id") REFERENCES "public"."vendor_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vendor_transfers"
    ADD CONSTRAINT "vendor_transfers_vendor_request_id_fkey" FOREIGN KEY ("vendor_request_id") REFERENCES "public"."vendor_requests"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wishes"
    ADD CONSTRAINT "wishes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishes"
    ADD CONSTRAINT "wishes_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_actions"
    ADD CONSTRAINT "workflow_actions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."workflow_actions"
    ADD CONSTRAINT "workflow_actions_recipient_person_id_fkey" FOREIGN KEY ("recipient_person_id") REFERENCES "public"."people"("id");



ALTER TABLE ONLY "public"."workflow_actions"
    ADD CONSTRAINT "workflow_actions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_announcements"
    ADD CONSTRAINT "workflow_announcements_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflow_events"
    ADD CONSTRAINT "workflow_events_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "public"."workflow_announcements"("id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_obituary_id_fkey" FOREIGN KEY ("obituary_id") REFERENCES "public"."obituaries"("id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."workflow_templates"("id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workflows"
    ADD CONSTRAINT "workflows_wishes_id_fkey" FOREIGN KEY ("wishes_id") REFERENCES "public"."wishes"("id");



CREATE POLICY "Estate users can view task status events" ON "public"."task_status_events" FOR SELECT USING (((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "task_status_events"."workflow_id") AND ("w"."user_id" = "auth"."uid"()))))) OR (("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."estate_access" "ea"
  WHERE (("ea"."workflow_id" = "task_status_events"."workflow_id") AND ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) AND (COALESCE("ea"."status", 'active'::"text") <> 'revoked'::"text")))))));



CREATE POLICY "Estate users can view webhook events" ON "public"."webhook_events" FOR SELECT USING (((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "webhook_events"."workflow_id") AND ("w"."user_id" = "auth"."uid"()))))) OR (("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."estate_access" "ea"
  WHERE (("ea"."workflow_id" = "webhook_events"."workflow_id") AND ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) AND (COALESCE("ea"."status", 'active'::"text") <> 'revoked'::"text")))))));



CREATE POLICY "Memorial contributions public read" ON "public"."memorial_contributions" FOR SELECT USING (("is_approved" = true));



CREATE POLICY "Memorial pages public read" ON "public"."memorial_pages" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Organization members can view organizations" ON "public"."organizations" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "organizations"."id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))));



CREATE POLICY "Organization owners can manage organizations" ON "public"."organizations" USING ((("auth"."uid"() IS NOT NULL) AND (("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "organizations"."id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))))))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "organizations"."id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))));



CREATE POLICY "Owner can delete workflows" ON "public"."workflows" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Service role can manage task status events" ON "public"."task_status_events" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage webhook events" ON "public"."webhook_events" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can create own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own profile" ON "public"."profiles" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users own accounts" ON "public"."accounts" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users own data" ON "public"."users" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users own deliveries" ON "public"."scheduled_deliveries" USING (("auth"."uid"() = "from_user_id"));



CREATE POLICY "Users own documents" ON "public"."documents" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users own events" ON "public"."events" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users own people" ON "public"."people" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Users own sessions" ON "public"."sessions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users own tasks" ON "public"."tasks" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."account_entitlements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "account_entitlements_insert_own" ON "public"."account_entitlements" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "account_entitlements_select_own" ON "public"."account_entitlements" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "account_entitlements_update_own" ON "public"."account_entitlements" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activation confirmations visible to estate users" ON "public"."activation_confirmations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "activation_confirmations"."workflow_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(COALESCE(("auth"."jwt"() ->> 'email'::"text"), ''::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(COALESCE(("auth"."jwt"() ->> 'email'::"text"), ''::"text")))) AND (COALESCE("ea"."status", 'active'::"text") <> 'revoked'::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."activation_witnesses" "aw"
          WHERE (("aw"."workflow_id" = "w"."id") AND ("lower"("aw"."email") = "lower"(COALESCE(("auth"."jwt"() ->> 'email'::"text"), ''::"text"))) AND ("aw"."status" = 'active'::"text")))))))));



CREATE POLICY "activation requests visible to estate users" ON "public"."activation_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "activation_requests"."workflow_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(COALESCE(("auth"."jwt"() ->> 'email'::"text"), ''::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(COALESCE(("auth"."jwt"() ->> 'email'::"text"), ''::"text")))) AND (COALESCE("ea"."status", 'active'::"text") <> 'revoked'::"text")))) OR (EXISTS ( SELECT 1
           FROM "public"."activation_witnesses" "aw"
          WHERE (("aw"."workflow_id" = "w"."id") AND ("lower"("aw"."email") = "lower"(COALESCE(("auth"."jwt"() ->> 'email'::"text"), ''::"text"))) AND ("aw"."status" = 'active'::"text")))))))));



CREATE POLICY "activation witnesses visible to estate users" ON "public"."activation_witnesses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "activation_witnesses"."workflow_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(COALESCE(("auth"."jwt"() ->> 'email'::"text"), ''::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(COALESCE(("auth"."jwt"() ->> 'email'::"text"), ''::"text")))) AND (COALESCE("ea"."status", 'active'::"text") <> 'revoked'::"text")))))))));



ALTER TABLE "public"."activation_confirmations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activation_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activation_witnesses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "active vendors visible to signed in users" ON "public"."vendors" FOR SELECT TO "authenticated" USING (("status" = 'active'::"text"));



ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."care_provider_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."children" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "estate announcements managed by owners and org staff" ON "public"."announcements" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "announcements"."estate_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'staff'::"text"])) AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "announcements"."estate_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'staff'::"text"])) AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



CREATE POLICY "estate announcements visible to estate users" ON "public"."announcements" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "announcements"."estate_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (COALESCE("ea"."status", 'accepted'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



CREATE POLICY "estate context owned by estate users" ON "public"."estate_user_context" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("estate_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))))))))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("estate_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



CREATE POLICY "estate events inserted by estate users" ON "public"."estate_events" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "estate_events"."estate_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (COALESCE("ea"."status", 'accepted'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



CREATE POLICY "estate events visible to estate users" ON "public"."estate_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "estate_events"."estate_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (COALESCE("ea"."status", 'accepted'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



CREATE POLICY "estate users view vendor orders" ON "public"."vendor_orders" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "vendor_orders"."workflow_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (COALESCE("ea"."status", 'active'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



CREATE POLICY "estate users view vendor payments" ON "public"."vendor_payments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "vendor_payments"."workflow_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (COALESCE("ea"."status", 'active'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



CREATE POLICY "estate users view vendor requests" ON "public"."vendor_requests" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "vendor_requests"."workflow_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (COALESCE("ea"."status", 'active'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



ALTER TABLE "public"."estate_access" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "estate_access_owner_manage" ON "public"."estate_access" USING ("public"."is_workflow_owner"("workflow_id")) WITH CHECK ("public"."is_workflow_owner"("workflow_id"));



ALTER TABLE "public"."estate_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "estate_events_insert_all" ON "public"."estate_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "estate_events_select_all" ON "public"."estate_events" FOR SELECT USING (true);



ALTER TABLE "public"."estate_participants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "estate_participants_insert_owner" ON "public"."estate_participants" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "estate_participants"."estate_id") AND (("w"."user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND ("om"."status" = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



CREATE POLICY "estate_participants_select_owner_or_linked" ON "public"."estate_participants" FOR SELECT USING ((("linked_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "estate_participants"."estate_id") AND ("w"."user_id" = "auth"."uid"()))))));



CREATE POLICY "estate_participants_token_lookup" ON "public"."estate_participants" FOR SELECT USING ((("invite_token" IS NOT NULL) AND ("invite_status" = ANY (ARRAY['sent'::"text", 'accepted'::"text"]))));



CREATE POLICY "estate_participants_update_owner_or_linked" ON "public"."estate_participants" FOR UPDATE USING ((("linked_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "estate_participants"."estate_id") AND ("w"."user_id" = "auth"."uid"())))))) WITH CHECK ((("linked_user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "estate_participants"."estate_id") AND ("w"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."estate_user_context" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fh_partners_org_member_select" ON "public"."funeral_home_partners" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."status" = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))));



CREATE POLICY "fh_partners_service_all" ON "public"."funeral_home_partners" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."file_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funeral_home_partners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."funeral_home_preferred_vendors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."impact_commitments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "impact_commitments_insert_own" ON "public"."impact_commitments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "impact_commitments_select_own" ON "public"."impact_commitments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "lead intake can create leads" ON "public"."leads" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_interactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memorial_contributions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memorial_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages managed by estate owners and org staff" ON "public"."messages" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "messages"."estate_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'staff'::"text"])) AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "messages"."estate_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'staff'::"text"])) AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



CREATE POLICY "messages visible to estate users" ON "public"."messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "messages"."estate_id") AND (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (COALESCE("ea"."status", 'accepted'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



CREATE POLICY "notification log estate owner read" ON "public"."notification_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "notification_log"."workflow_id") AND ("w"."user_id" = "auth"."uid"())))));



CREATE POLICY "notification log recipient read" ON "public"."notification_log" FOR SELECT TO "authenticated" USING (("lower"("recipient_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))));



ALTER TABLE "public"."notification_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."obituaries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "obituaries owned by estate users" ON "public"."obituaries" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("workflow_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (COALESCE("ea"."status", 'accepted'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))))))))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("workflow_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



CREATE POLICY "orchestration events inserted by estate users" ON "public"."orchestration_events" FOR INSERT TO "authenticated" WITH CHECK (("workflow_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))))))));



CREATE POLICY "orchestration events visible to estate users" ON "public"."orchestration_events" FOR SELECT TO "authenticated" USING (("workflow_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (COALESCE("ea"."status", 'accepted'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))))))));



ALTER TABLE "public"."orchestration_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org admins manage preferred vendors" ON "public"."funeral_home_preferred_vendors" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "funeral_home_preferred_vendors"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "funeral_home_preferred_vendors"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND ("om"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])) AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))));



CREATE POLICY "org staff view preferred vendors" ON "public"."funeral_home_preferred_vendors" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."organization_members" "om"
  WHERE (("om"."organization_id" = "funeral_home_preferred_vendors"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))));



CREATE POLICY "org_admins_manage" ON "public"."organization_members" USING ((("auth"."uid"() IS NOT NULL) AND "public"."is_org_admin"("organization_id"))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND "public"."is_org_admin"("organization_id")));



CREATE POLICY "org_members_select_own" ON "public"."organization_members" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("user_id" = "auth"."uid"()) OR ("lower"("email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))));



ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."outcomes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "outcomes owned by estate users" ON "public"."outcomes" TO "authenticated" USING (("estate_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (COALESCE("ea"."status", 'accepted'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))) WITH CHECK (("estate_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))))))));



CREATE POLICY "participants read own estate access" ON "public"."estate_access" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("lower"("email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))));



ALTER TABLE "public"."people" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "people owner insert" ON "public"."people" FOR INSERT TO "authenticated" WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "people owner select" ON "public"."people" FOR SELECT TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "people owner update" ON "public"."people" FOR UPDATE TO "authenticated" USING (("owner_id" = "auth"."uid"())) WITH CHECK (("owner_id" = "auth"."uid"()));



CREATE POLICY "people participant read self" ON "public"."people" FOR SELECT TO "authenticated" USING ((("lower"("email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR ("linked_user_id" = "auth"."uid"())));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_handoffs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scheduled_deliveries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service role manages care provider applications" ON "public"."care_provider_applications" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service role manages preferred vendors" ON "public"."funeral_home_preferred_vendors" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service role manages provider handoffs" ON "public"."provider_handoffs" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service role manages vendor orders" ON "public"."vendor_orders" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service role manages vendor payments" ON "public"."vendor_payments" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service role manages vendor requests" ON "public"."vendor_requests" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service role manages vendor team members" ON "public"."vendor_team_members" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service role manages vendor transfers" ON "public"."vendor_transfers" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "service role manages vendors" ON "public"."vendors" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."spouse_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stripe subscriptions owner read" ON "public"."stripe_subscriptions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."stripe_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_status_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks owner insert" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "tasks"."workflow_id") AND ("w"."user_id" = "auth"."uid"()))))));



CREATE POLICY "tasks owner select" ON "public"."tasks" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "tasks"."workflow_id") AND ("w"."user_id" = "auth"."uid"()))))));



CREATE POLICY "tasks owner update" ON "public"."tasks" FOR UPDATE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "tasks"."workflow_id") AND ("w"."user_id" = "auth"."uid"())))))) WITH CHECK ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "tasks"."workflow_id") AND ("w"."user_id" = "auth"."uid"()))))));



CREATE POLICY "tasks participant update status" ON "public"."tasks" FOR UPDATE TO "authenticated" USING (("lower"("assigned_to_email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))) WITH CHECK (("lower"("assigned_to_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "tasks_participant_select" ON "public"."tasks" FOR SELECT USING ((("lower"("assigned_to_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "tasks"."workflow_id") AND (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND ("om"."status" = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



CREATE POLICY "urgent sessions owned by user or estate users" ON "public"."urgent_sessions" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("estate_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (COALESCE("ea"."status", 'accepted'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))))))))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("estate_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))));



ALTER TABLE "public"."urgent_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vendor contacts view vendor orders" ON "public"."vendor_orders" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."vendors" "v"
  WHERE (("v"."id" = "vendor_orders"."vendor_id") AND (COALESCE("v"."status", 'pending'::"text") = 'active'::"text") AND ("lower"("v"."contact_email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))) OR (EXISTS ( SELECT 1
   FROM "public"."vendor_team_members" "vtm"
  WHERE (("vtm"."vendor_id" = "vendor_orders"."vendor_id") AND (COALESCE("vtm"."status", 'active'::"text") = 'active'::"text") AND ("lower"("vtm"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))));



CREATE POLICY "vendor contacts view vendor transfers" ON "public"."vendor_transfers" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."vendors" "v"
  WHERE (("v"."id" = "vendor_transfers"."vendor_id") AND (COALESCE("v"."status", 'pending'::"text") = 'active'::"text") AND ("lower"("v"."contact_email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))) OR (EXISTS ( SELECT 1
   FROM "public"."vendor_team_members" "vtm"
  WHERE (("vtm"."vendor_id" = "vendor_transfers"."vendor_id") AND (COALESCE("vtm"."status", 'active'::"text") = 'active'::"text") AND ("lower"("vtm"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))));



ALTER TABLE "public"."vendor_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendor_transfers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wishes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wishes owned by estate users" ON "public"."wishes" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("workflow_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (COALESCE("ea"."status", 'accepted'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))))))))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("workflow_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))));



CREATE POLICY "workflow actions owner insert" ON "public"."workflow_actions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "workflow_actions"."workflow_id") AND ("w"."user_id" = "auth"."uid"())))));



CREATE POLICY "workflow actions owner select" ON "public"."workflow_actions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "workflow_actions"."workflow_id") AND ("w"."user_id" = "auth"."uid"())))));



CREATE POLICY "workflow actions owner update" ON "public"."workflow_actions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "workflow_actions"."workflow_id") AND ("w"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "workflow_actions"."workflow_id") AND ("w"."user_id" = "auth"."uid"())))));



CREATE POLICY "workflow actions participant select" ON "public"."workflow_actions" FOR SELECT TO "authenticated" USING (("lower"("recipient_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "workflow actions participant update" ON "public"."workflow_actions" FOR UPDATE TO "authenticated" USING (("lower"("recipient_email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))) WITH CHECK (("lower"("recipient_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))));



CREATE POLICY "workflow announcements owned by estate users" ON "public"."workflow_announcements" TO "authenticated" USING (("workflow_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."estate_access" "ea"
          WHERE (("ea"."workflow_id" = "w"."id") AND (COALESCE("ea"."status", 'accepted'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))))))) WITH CHECK (("workflow_id" IN ( SELECT "w"."id"
   FROM "public"."workflows" "w"
  WHERE (("w"."user_id" = "auth"."uid"()) OR ("lower"("w"."coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
           FROM "public"."organization_members" "om"
          WHERE (("om"."organization_id" = "w"."organization_id") AND (COALESCE("om"."status", 'active'::"text") = 'active'::"text") AND (("om"."user_id" = "auth"."uid"()) OR ("lower"("om"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))))))))));



CREATE POLICY "workflow events owner delete" ON "public"."workflow_events" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "workflow_events"."workflow_id") AND ("w"."user_id" = "auth"."uid"())))));



CREATE POLICY "workflow events owner insert" ON "public"."workflow_events" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "workflow_events"."workflow_id") AND ("w"."user_id" = "auth"."uid"())))));



CREATE POLICY "workflow events owner select" ON "public"."workflow_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "workflow_events"."workflow_id") AND ("w"."user_id" = "auth"."uid"())))));



CREATE POLICY "workflow events owner update" ON "public"."workflow_events" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "workflow_events"."workflow_id") AND ("w"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workflows" "w"
  WHERE (("w"."id" = "workflow_events"."workflow_id") AND ("w"."user_id" = "auth"."uid"())))));



CREATE POLICY "workflow events participant select" ON "public"."workflow_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."estate_access" "ea"
  WHERE (("ea"."workflow_id" = "workflow_events"."workflow_id") AND ("ea"."status" <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))));



ALTER TABLE "public"."workflow_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflow_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workflows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workflows authenticated owner insert" ON "public"."workflows" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR ("lower"("coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text")))));



CREATE POLICY "workflows owner update" ON "public"."workflows" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "workflows_select_safe" ON "public"."workflows" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("lower"("coordinator_email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) OR (EXISTS ( SELECT 1
   FROM "public"."estate_access" "ea"
  WHERE (("ea"."workflow_id" = "workflows"."id") AND (COALESCE("ea"."status", 'accepted'::"text") <> 'revoked'::"text") AND (("ea"."user_id" = "auth"."uid"()) OR ("lower"("ea"."email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))))))) OR (("organization_id" IS NOT NULL) AND "public"."is_org_member_of"("organization_id"))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."activate_estate"("p_workflow_id" "uuid", "p_activated_by" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."activate_estate"("p_workflow_id" "uuid", "p_activated_by" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."activate_estate"("p_workflow_id" "uuid", "p_activated_by" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_activate_on_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_activate_on_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_activate_on_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_admin"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_member_of"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_member_of"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_member_of"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_workflow_owner"("wf_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workflow_owner"("wf_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workflow_owner"("wf_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_user_completion"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_user_completion"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_user_completion"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_vendor_final_value_cents"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_vendor_final_value_cents"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_vendor_final_value_cents"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_user_completion_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_user_completion_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_user_completion_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."account_entitlements" TO "anon";
GRANT ALL ON TABLE "public"."account_entitlements" TO "authenticated";
GRANT ALL ON TABLE "public"."account_entitlements" TO "service_role";



GRANT ALL ON TABLE "public"."accounts" TO "anon";
GRANT ALL ON TABLE "public"."accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts" TO "service_role";



GRANT ALL ON TABLE "public"."activation_confirmations" TO "anon";
GRANT ALL ON TABLE "public"."activation_confirmations" TO "authenticated";
GRANT ALL ON TABLE "public"."activation_confirmations" TO "service_role";



GRANT ALL ON TABLE "public"."activation_requests" TO "anon";
GRANT ALL ON TABLE "public"."activation_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."activation_requests" TO "service_role";



GRANT ALL ON TABLE "public"."activation_witnesses" TO "anon";
GRANT ALL ON TABLE "public"."activation_witnesses" TO "authenticated";
GRANT ALL ON TABLE "public"."activation_witnesses" TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."care_provider_applications" TO "anon";
GRANT ALL ON TABLE "public"."care_provider_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."care_provider_applications" TO "service_role";



GRANT ALL ON TABLE "public"."children" TO "anon";
GRANT ALL ON TABLE "public"."children" TO "authenticated";
GRANT ALL ON TABLE "public"."children" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."estate_access" TO "anon";
GRANT ALL ON TABLE "public"."estate_access" TO "authenticated";
GRANT ALL ON TABLE "public"."estate_access" TO "service_role";



GRANT ALL ON TABLE "public"."estate_events" TO "anon";
GRANT ALL ON TABLE "public"."estate_events" TO "authenticated";
GRANT ALL ON TABLE "public"."estate_events" TO "service_role";



GRANT ALL ON TABLE "public"."estate_participants" TO "anon";
GRANT ALL ON TABLE "public"."estate_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."estate_participants" TO "service_role";



GRANT ALL ON TABLE "public"."estate_user_context" TO "anon";
GRANT ALL ON TABLE "public"."estate_user_context" TO "authenticated";
GRANT ALL ON TABLE "public"."estate_user_context" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."file_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."file_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."file_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."funeral_home_partners" TO "anon";
GRANT ALL ON TABLE "public"."funeral_home_partners" TO "authenticated";
GRANT ALL ON TABLE "public"."funeral_home_partners" TO "service_role";



GRANT ALL ON TABLE "public"."funeral_home_preferred_vendors" TO "anon";
GRANT ALL ON TABLE "public"."funeral_home_preferred_vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."funeral_home_preferred_vendors" TO "service_role";



GRANT ALL ON TABLE "public"."impact_commitments" TO "anon";
GRANT ALL ON TABLE "public"."impact_commitments" TO "authenticated";
GRANT ALL ON TABLE "public"."impact_commitments" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_interactions" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_interactions" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_providers" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_providers" TO "service_role";



GRANT ALL ON TABLE "public"."memorial_contributions" TO "anon";
GRANT ALL ON TABLE "public"."memorial_contributions" TO "authenticated";
GRANT ALL ON TABLE "public"."memorial_contributions" TO "service_role";



GRANT ALL ON TABLE "public"."memorial_pages" TO "anon";
GRANT ALL ON TABLE "public"."memorial_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."memorial_pages" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notification_log" TO "anon";
GRANT ALL ON TABLE "public"."notification_log" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_log" TO "service_role";



GRANT ALL ON TABLE "public"."obituaries" TO "anon";
GRANT ALL ON TABLE "public"."obituaries" TO "authenticated";
GRANT ALL ON TABLE "public"."obituaries" TO "service_role";



GRANT ALL ON TABLE "public"."orchestration_events" TO "anon";
GRANT ALL ON TABLE "public"."orchestration_events" TO "authenticated";
GRANT ALL ON TABLE "public"."orchestration_events" TO "service_role";



GRANT ALL ON TABLE "public"."organization_members" TO "anon";
GRANT ALL ON TABLE "public"."organization_members" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."outcomes" TO "anon";
GRANT ALL ON TABLE "public"."outcomes" TO "authenticated";
GRANT ALL ON TABLE "public"."outcomes" TO "service_role";



GRANT ALL ON TABLE "public"."people" TO "anon";
GRANT ALL ON TABLE "public"."people" TO "authenticated";
GRANT ALL ON TABLE "public"."people" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."provider_handoffs" TO "anon";
GRANT ALL ON TABLE "public"."provider_handoffs" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_handoffs" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."scheduled_deliveries" TO "anon";
GRANT ALL ON TABLE "public"."scheduled_deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."scheduled_deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."spouse_links" TO "anon";
GRANT ALL ON TABLE "public"."spouse_links" TO "authenticated";
GRANT ALL ON TABLE "public"."spouse_links" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."task_status_events" TO "anon";
GRANT ALL ON TABLE "public"."task_status_events" TO "authenticated";
GRANT ALL ON TABLE "public"."task_status_events" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."urgent_sessions" TO "anon";
GRANT ALL ON TABLE "public"."urgent_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."urgent_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."workflows" TO "anon";
GRANT ALL ON TABLE "public"."workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."workflows" TO "service_role";



GRANT ALL ON TABLE "public"."user_estate_capacity" TO "anon";
GRANT ALL ON TABLE "public"."user_estate_capacity" TO "authenticated";
GRANT ALL ON TABLE "public"."user_estate_capacity" TO "service_role";



GRANT ALL ON TABLE "public"."v_churn" TO "anon";
GRANT ALL ON TABLE "public"."v_churn" TO "authenticated";
GRANT ALL ON TABLE "public"."v_churn" TO "service_role";



GRANT ALL ON TABLE "public"."v_engagement" TO "anon";
GRANT ALL ON TABLE "public"."v_engagement" TO "authenticated";
GRANT ALL ON TABLE "public"."v_engagement" TO "service_role";



GRANT ALL ON TABLE "public"."v_marketplace" TO "anon";
GRANT ALL ON TABLE "public"."v_marketplace" TO "authenticated";
GRANT ALL ON TABLE "public"."v_marketplace" TO "service_role";



GRANT ALL ON TABLE "public"."v_mrr" TO "anon";
GRANT ALL ON TABLE "public"."v_mrr" TO "authenticated";
GRANT ALL ON TABLE "public"."v_mrr" TO "service_role";



GRANT ALL ON TABLE "public"."v_north_star" TO "anon";
GRANT ALL ON TABLE "public"."v_north_star" TO "authenticated";
GRANT ALL ON TABLE "public"."v_north_star" TO "service_role";



GRANT ALL ON TABLE "public"."v_path_performance" TO "anon";
GRANT ALL ON TABLE "public"."v_path_performance" TO "authenticated";
GRANT ALL ON TABLE "public"."v_path_performance" TO "service_role";



GRANT ALL ON TABLE "public"."v_paywall_conversion" TO "anon";
GRANT ALL ON TABLE "public"."v_paywall_conversion" TO "authenticated";
GRANT ALL ON TABLE "public"."v_paywall_conversion" TO "service_role";



GRANT ALL ON TABLE "public"."v_trigger_insights" TO "anon";
GRANT ALL ON TABLE "public"."v_trigger_insights" TO "authenticated";
GRANT ALL ON TABLE "public"."v_trigger_insights" TO "service_role";



GRANT ALL ON TABLE "public"."v_user_ltv" TO "anon";
GRANT ALL ON TABLE "public"."v_user_ltv" TO "authenticated";
GRANT ALL ON TABLE "public"."v_user_ltv" TO "service_role";



GRANT ALL ON TABLE "public"."v_viral_loop" TO "anon";
GRANT ALL ON TABLE "public"."v_viral_loop" TO "authenticated";
GRANT ALL ON TABLE "public"."v_viral_loop" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_orders" TO "anon";
GRANT ALL ON TABLE "public"."vendor_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_orders" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_payments" TO "anon";
GRANT ALL ON TABLE "public"."vendor_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_payments" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_requests" TO "anon";
GRANT ALL ON TABLE "public"."vendor_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_requests" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_team_members" TO "anon";
GRANT ALL ON TABLE "public"."vendor_team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_team_members" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_transfers" TO "anon";
GRANT ALL ON TABLE "public"."vendor_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_transfers" TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_events" TO "service_role";



GRANT ALL ON TABLE "public"."wishes" TO "anon";
GRANT ALL ON TABLE "public"."wishes" TO "authenticated";
GRANT ALL ON TABLE "public"."wishes" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_actions" TO "anon";
GRANT ALL ON TABLE "public"."workflow_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_actions" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_announcements" TO "anon";
GRANT ALL ON TABLE "public"."workflow_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_events" TO "anon";
GRANT ALL ON TABLE "public"."workflow_events" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_events" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_templates" TO "anon";
GRANT ALL ON TABLE "public"."workflow_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_templates" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







