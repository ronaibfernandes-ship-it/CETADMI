-- CETADMI - OFFICIAL DATABASE SCHEMA (BLOCK 4)
-- Purpose: Professional event and registration management with RLS and Audit Integrity.

-- 0. ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. TABLES

-- TABLE: events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    banner_url TEXT,
    location TEXT,
    event_date TIMESTAMPTZ,
    registration_deadline TIMESTAMPTZ,
    capacity INTEGER CHECK (capacity >= 0),
    price_options JSONB NOT NULL DEFAULT '[]'::jsonb,
    pix_key TEXT,
    whatsapp_number TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABLE: registrations
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    cpf TEXT,
    church_name TEXT,
    city TEXT,
    state TEXT,
    selected_price_id TEXT NOT NULL,
    selected_price_label TEXT NOT NULL,
    amount_due NUMERIC(10,2) NOT NULL CHECK (amount_due >= 0),
    amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    pricing_snapshot JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'cancelled', 'expired')),
    payment_proof_received BOOLEAN NOT NULL DEFAULT false,
    payment_notes TEXT,
    whatsapp_sent_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TRIGGERS

-- Updated At Triggers
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Auto Expire Registration Trigger
CREATE OR REPLACE FUNCTION set_registration_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending_payment' AND NEW.expires_at IS NULL THEN
        NEW.expires_at = now() + interval '24 hours';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_set_registration_expiration
BEFORE INSERT ON public.registrations
FOR EACH ROW EXECUTE FUNCTION set_registration_expiration();

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_published ON public.events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON public.registrations(event_id, status);

-- 5. RLS POLICIES

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Events Policies
CREATE POLICY "Public can view published events" ON public.events FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can do everything on events" ON public.events FOR ALL USING (auth.role() = 'authenticated');

-- Registrations Policies
CREATE POLICY "Public can create registration" ON public.registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all registrations" ON public.registrations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can update registrations" ON public.registrations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete registrations" ON public.registrations FOR DELETE USING (auth.role() = 'authenticated');

-- 6. STORAGE BUCKET CONFIG (Manual step or via SQL if supported)
-- NOTE: Supabase Storage configuration usually happens via dashboard or storage API policies.
-- Bucket: 'event-banners'

-- Storage Policies (Public Access for Banners)
-- Policy for SELECT: (bucket_id = 'event-banners')
-- Policy for ALL: (bucket_id = 'event-banners' AND auth.role() = 'authenticated')

-- 7. VIEW: ADMIN_EVENT_SUMMARY
-- Facilita o dashboard administrativo calculando vagas ocupadas.
CREATE OR REPLACE VIEW public.admin_event_summary AS
SELECT 
    e.id,
    e.title,
    e.capacity,
    COUNT(r.id) FILTER (WHERE r.status = 'paid' OR (r.status = 'pending_payment' AND r.expires_at > now())) as occupied_slots,
    COUNT(r.id) FILTER (WHERE r.status = 'paid') as confirmed_registrations,
    COUNT(r.id) FILTER (WHERE r.status = 'pending_payment' AND r.expires_at > now()) as pending_registrations,
    e.capacity - COUNT(r.id) FILTER (WHERE r.status = 'paid' OR (r.status = 'pending_payment' AND r.expires_at > now())) as available_slots
FROM public.events e
LEFT JOIN public.registrations r ON e.id = r.event_id
GROUP BY e.id;
