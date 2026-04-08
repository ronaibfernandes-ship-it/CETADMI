-- CETADMI - EVENT CONTENT BLOCKS
-- Purpose: support premium event pages with curated speakers and program sections.

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS speakers JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS program JSONB NOT NULL DEFAULT '[]'::jsonb;

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
    e.speakers,
    e.program,
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
