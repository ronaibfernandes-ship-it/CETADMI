-- CETADMI - SLUG NORMALIZATION & GUARD
-- Purpose: normalize legacy event slugs and prevent malformed slugs from being saved again.

WITH normalized_events AS (
    SELECT
        id,
        lower(regexp_replace(trim(slug), '\s+', '-', 'g')) AS base_slug,
        row_number() OVER (
            PARTITION BY lower(regexp_replace(trim(slug), '\s+', '-', 'g'))
            ORDER BY created_at, id
        ) AS slug_rank
    FROM public.events
), resolved_slugs AS (
    SELECT
        id,
        CASE
            WHEN slug_rank = 1 THEN base_slug
            ELSE base_slug || '-' || left(id::text, 8)
        END AS normalized_slug
    FROM normalized_events
)
UPDATE public.events e
SET slug = r.normalized_slug
FROM resolved_slugs r
WHERE e.id = r.id
  AND e.slug IS DISTINCT FROM r.normalized_slug;

ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_slug_format_check;

ALTER TABLE public.events
ADD CONSTRAINT events_slug_format_check CHECK (
    slug = lower(trim(slug))
    AND slug <> ''
    AND slug !~ '\s'
);
