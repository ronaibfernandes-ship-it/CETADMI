-- CETADMI - SECURITY AND CAPACITY HARDENING
-- Purpose: restrict admin access, protect event capacity, and prevent duplicate active registrations.

CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = check_user_id
    );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_owner(check_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = check_user_id
          AND role = 'owner'
    );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_user_profile_sync()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_profile_sync ON auth.users;
CREATE TRIGGER on_auth_user_profile_sync
AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_profile_sync();

INSERT INTO public.profiles (id, email, full_name)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name')
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = now();

DROP POLICY IF EXISTS "Admins can do everything on events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins can delete registrations" ON public.registrations;

DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Bootstrap first admin user" ON public.admin_users;
DROP POLICY IF EXISTS "Owners can insert admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Owners can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Owners can delete admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Admins can view admin users"
ON public.admin_users FOR SELECT
USING (
    public.is_admin(auth.uid())
    OR user_id = auth.uid()
);

CREATE POLICY "Bootstrap first admin user"
ON public.admin_users FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND role = 'owner'
    AND NOT EXISTS (SELECT 1 FROM public.admin_users)
);

CREATE POLICY "Owners can insert admin users"
ON public.admin_users FOR INSERT
WITH CHECK (
    public.is_owner(auth.uid())
);

CREATE POLICY "Owners can update admin users"
ON public.admin_users FOR UPDATE
USING (
    public.is_owner(auth.uid())
)
WITH CHECK (
    public.is_owner(auth.uid())
);

CREATE POLICY "Owners can delete admin users"
ON public.admin_users FOR DELETE
USING (
    public.is_owner(auth.uid())
    AND user_id <> auth.uid()
);

CREATE POLICY "Admins can view profiles"
ON public.profiles FOR SELECT
USING (
    public.is_admin(auth.uid())
);

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Admins can do everything on events"
ON public.events FOR ALL
USING (
    public.is_admin(auth.uid())
)
WITH CHECK (
    public.is_admin(auth.uid())
);

CREATE POLICY "Admins can view all registrations"
ON public.registrations FOR SELECT
USING (
    public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update registrations"
ON public.registrations FOR UPDATE
USING (
    public.is_admin(auth.uid())
)
WITH CHECK (
    public.is_admin(auth.uid())
);

CREATE POLICY "Admins can delete registrations"
ON public.registrations FOR DELETE
USING (
    public.is_admin(auth.uid())
);

CREATE OR REPLACE FUNCTION public.ensure_registration_is_allowed()
RETURNS TRIGGER AS $$
DECLARE
    target_event public.events%ROWTYPE;
    occupied_slots INTEGER;
BEGIN
    SELECT *
    INTO target_event
    FROM public.events
    WHERE id = NEW.event_id
    FOR UPDATE;

    IF target_event.id IS NULL THEN
        RAISE EXCEPTION 'EVENT_NOT_FOUND';
    END IF;

    IF NOT target_event.is_published THEN
        RAISE EXCEPTION 'EVENT_NOT_PUBLISHED';
    END IF;

    IF target_event.registration_deadline IS NOT NULL AND target_event.registration_deadline < now() THEN
        RAISE EXCEPTION 'REGISTRATION_CLOSED';
    END IF;

    SELECT COUNT(*)
    INTO occupied_slots
    FROM public.registrations r
    WHERE r.event_id = NEW.event_id
      AND (r.status = 'paid' OR (r.status = 'pending_payment' AND (r.expires_at IS NULL OR r.expires_at > now())));

    IF target_event.capacity IS NOT NULL AND occupied_slots >= target_event.capacity THEN
        RAISE EXCEPTION 'EVENT_FULL';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.registrations r
        WHERE r.event_id = NEW.event_id
          AND r.status IN ('pending_payment', 'paid')
          AND (
              (NEW.email IS NOT NULL AND r.email IS NOT NULL AND lower(r.email) = lower(NEW.email))
              OR regexp_replace(COALESCE(r.phone, ''), '\\D', '', 'g') = regexp_replace(COALESCE(NEW.phone, ''), '\\D', '', 'g')
          )
    ) THEN
        RAISE EXCEPTION 'DUPLICATE_ACTIVE_REGISTRATION';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_ensure_registration_is_allowed ON public.registrations;
CREATE TRIGGER tr_ensure_registration_is_allowed
BEFORE INSERT ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.ensure_registration_is_allowed();

DROP VIEW IF EXISTS public.admin_event_summary;
CREATE OR REPLACE VIEW public.admin_event_summary AS
SELECT
    e.id,
    e.slug,
    e.title,
    e.subtitle,
    e.description,
    e.banner_url,
    e.location,
    e.event_date,
    e.registration_deadline,
    e.capacity,
    e.price_options,
    e.pix_key,
    e.whatsapp_number,
    e.is_published,
    e.created_by,
    e.created_at,
    e.updated_at,
    COUNT(r.id) FILTER (WHERE r.status = 'paid' OR (r.status = 'pending_payment' AND r.expires_at > now())) AS occupied_slots,
    COUNT(r.id) FILTER (WHERE r.status = 'paid') AS confirmed_registrations,
    COUNT(r.id) FILTER (WHERE r.status = 'pending_payment' AND r.expires_at > now()) AS pending_registrations,
    GREATEST(COALESCE(e.capacity, 0) - COUNT(r.id) FILTER (WHERE r.status = 'paid' OR (r.status = 'pending_payment' AND r.expires_at > now())), 0) AS available_slots,
    COUNT(r.id) AS total_registrations
FROM public.events e
LEFT JOIN public.registrations r ON e.id = r.event_id
GROUP BY e.id;
