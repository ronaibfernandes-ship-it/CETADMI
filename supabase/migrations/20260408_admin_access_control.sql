-- CETADMI - ADMIN ACCESS CONTROL
-- Purpose: remove automatic first-owner bootstrap and keep admin access under pastoral control.

DROP POLICY IF EXISTS "Bootstrap first admin user" ON public.admin_users;
