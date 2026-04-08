-- CETADMI - INSTITUTION SETTINGS AND CERTIFICATES
-- Purpose: persist institutional branding and support real certificate issuance/validation.

CREATE TABLE IF NOT EXISTS public.institution_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    short_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    legacy_name TEXT NOT NULL,
    mission TEXT NOT NULL,
    audience TEXT NOT NULL,
    doctrinal_line TEXT NOT NULL,
    leadership TEXT NOT NULL,
    category_highlight TEXT NOT NULL,
    support_whatsapp TEXT NOT NULL,
    support_email TEXT NOT NULL,
    support_hours TEXT NOT NULL,
    certificate_director_name TEXT NOT NULL,
    certificate_director_role TEXT NOT NULL,
    stats JSONB NOT NULL DEFAULT '[]'::jsonb,
    featured_courses JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.certificate_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    registration_id UUID UNIQUE REFERENCES public.registrations(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'revoked')),
    recipient_name TEXT NOT NULL,
    recipient_email TEXT,
    event_title TEXT NOT NULL,
    event_subtitle TEXT,
    event_date_label TEXT,
    location_label TEXT,
    speaker_name TEXT,
    director_name TEXT NOT NULL,
    director_role TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    issued_by UUID REFERENCES auth.users(id),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id),
    revoke_reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certificate_issues_event_id ON public.certificate_issues(event_id);
CREATE INDEX IF NOT EXISTS idx_certificate_issues_issued_at ON public.certificate_issues(issued_at DESC);

CREATE TRIGGER update_institution_settings_updated_at BEFORE UPDATE ON public.institution_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_certificate_issues_updated_at BEFORE UPDATE ON public.certificate_issues FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE public.institution_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read institution settings" ON public.institution_settings;
DROP POLICY IF EXISTS "Admins can manage institution settings" ON public.institution_settings;
DROP POLICY IF EXISTS "Admins can manage certificate issues" ON public.certificate_issues;

CREATE POLICY "Public can read institution settings"
ON public.institution_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage institution settings"
ON public.institution_settings FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage certificate issues"
ON public.certificate_issues FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.institution_settings (
    id, short_name, full_name, legacy_name, mission, audience, doctrinal_line,
    leadership, category_highlight, support_whatsapp, support_email, support_hours,
    certificate_director_name, certificate_director_role, stats, featured_courses
) VALUES (
    1,
    'CETADMI',
    'Centro Educacional e Teologico para capacitacao e aperfeicoamento',
    'Colegio Teologico CETADMI',
    'Capacitacao biblica, teologica e ministerial com compromisso doutrinario, excelencia academica e suporte pastoral.',
    'Obreiros, esposas, lideres, professores e alunos comprometidos com a formacao crista.',
    'Linha teologica pentecostal classica, alinhada a Declaracao de Fe das Assembleias de Deus.',
    'Direcao executiva: Pr Alex Vieira.',
    'Curso Basico em Teologia',
    '+55 91 98189-7040',
    'cetadmicursos@gmail.com',
    '08:00 as 17:00',
    'Pr. Alex Vieira',
    'Diretor de Ensino',
    '[{"label":"Alunos","value":"341"},{"label":"Cursos","value":"15"},{"label":"Avaliacoes","value":"194"},{"label":"Certificados","value":"45"}]'::jsonb,
    '["Bibliologia","Soteriologia","Cristologia","Evangelhos Sinoticos","Atos dos Apostolos","Homiletica"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.generate_certificate_code()
RETURNS TEXT AS $$
DECLARE
    generated_code TEXT;
BEGIN
    LOOP
        generated_code := 'CET-' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 12));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.certificate_issues WHERE code = generated_code);
    END LOOP;

    RETURN generated_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.issue_certificate(p_registration_id UUID)
RETURNS TABLE(id UUID, code TEXT, issued_at TIMESTAMPTZ) AS $$
DECLARE
    target_registration public.registrations%ROWTYPE;
    target_event public.events%ROWTYPE;
    settings_row public.institution_settings%ROWTYPE;
    existing_issue public.certificate_issues%ROWTYPE;
    first_speaker_name TEXT;
BEGIN
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION '42501';
    END IF;

    SELECT * INTO existing_issue
    FROM public.certificate_issues
    WHERE registration_id = p_registration_id
      AND status = 'issued'
    LIMIT 1;

    IF existing_issue.id IS NOT NULL THEN
        RETURN QUERY SELECT existing_issue.id, existing_issue.code, existing_issue.issued_at;
        RETURN;
    END IF;

    SELECT * INTO target_registration
    FROM public.registrations
    WHERE public.registrations.id = p_registration_id;

    IF target_registration.id IS NULL THEN
        RAISE EXCEPTION 'REGISTRATION_NOT_FOUND';
    END IF;

    IF target_registration.status <> 'paid' THEN
        RAISE EXCEPTION 'REGISTRATION_NOT_PAID';
    END IF;

    SELECT * INTO target_event
    FROM public.events
    WHERE public.events.id = target_registration.event_id;

    SELECT * INTO settings_row
    FROM public.institution_settings
    WHERE public.institution_settings.id = 1;

    SELECT speaker ->> 'name'
    INTO first_speaker_name
    FROM jsonb_array_elements(COALESCE(target_event.speakers, '[]'::jsonb)) AS speaker
    WHERE speaker ? 'name'
      AND coalesce(trim(speaker ->> 'name'), '') <> ''
    LIMIT 1;

    INSERT INTO public.certificate_issues (
        code,
        registration_id,
        event_id,
        recipient_name,
        recipient_email,
        event_title,
        event_subtitle,
        event_date_label,
        location_label,
        speaker_name,
        director_name,
        director_role,
        issued_by,
        metadata
    ) VALUES (
        public.generate_certificate_code(),
        target_registration.id,
        target_event.id,
        target_registration.full_name,
        target_registration.email,
        target_event.title,
        target_event.subtitle,
        CASE WHEN target_event.event_date IS NOT NULL THEN to_char(target_event.event_date AT TIME ZONE 'America/Belem', 'DD "de" TMMonth "de" YYYY') ELSE NULL END,
        CASE
            WHEN target_event.location IS NOT NULL AND target_event.event_date IS NOT NULL THEN target_event.location || ', ' || to_char(target_event.event_date AT TIME ZONE 'America/Belem', 'DD "de" TMMonth "de" YYYY')
            WHEN target_event.location IS NOT NULL THEN target_event.location
            ELSE NULL
        END,
        first_speaker_name,
        COALESCE(settings_row.certificate_director_name, 'Pr. Alex Vieira'),
        COALESCE(settings_row.certificate_director_role, 'Diretor de Ensino'),
        auth.uid(),
        jsonb_build_object(
            'registration_status', target_registration.status,
            'selected_price_label', target_registration.selected_price_label,
            'amount_paid', target_registration.amount_paid
        )
    )
    RETURNING public.certificate_issues.id, public.certificate_issues.code, public.certificate_issues.issued_at
    INTO id, code, issued_at;

    RETURN QUERY SELECT id, code, issued_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_certificate_public(p_code TEXT)
RETURNS TABLE(
    id UUID,
    code TEXT,
    status TEXT,
    recipient_name TEXT,
    event_title TEXT,
    event_subtitle TEXT,
    event_date_label TEXT,
    location_label TEXT,
    speaker_name TEXT,
    director_name TEXT,
    director_role TEXT,
    issued_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoke_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ci.id,
        ci.code,
        ci.status,
        ci.recipient_name,
        ci.event_title,
        ci.event_subtitle,
        ci.event_date_label,
        ci.location_label,
        ci.speaker_name,
        ci.director_name,
        ci.director_role,
        ci.issued_at,
        ci.revoked_at,
        ci.revoke_reason
    FROM public.certificate_issues ci
    WHERE ci.code = p_code
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
