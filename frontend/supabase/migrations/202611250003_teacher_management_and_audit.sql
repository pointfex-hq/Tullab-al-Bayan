BEGIN;

CREATE UNIQUE INDEX user_roles_staff_code_ci_key
ON public.user_roles (lower(btrim(staff_code)))
WHERE staff_code IS NOT NULL;

CREATE TABLE public.role_audit_logs (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
actor_user_id uuid NOT NULL,
target_user_id uuid NOT NULL,
action text NOT NULL CHECK (action IN ('approve_teacher', 'revoke_teacher')),
role text NOT NULL CHECK (role = 'teacher'),
details jsonb NOT NULL DEFAULT '{}'::jsonb,
created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.role_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.role_audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.role_audit_logs TO authenticated;
CREATE POLICY role_audit_logs_admin_read ON public.role_audit_logs
FOR SELECT TO authenticated USING ((SELECT public.current_user_role()) = 'admin');

CREATE FUNCTION public.list_teacher_accounts()
RETURNS TABLE (user_id uuid, email text, full_name text, staff_code text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
IF public.current_user_role() IS DISTINCT FROM 'admin' THEN
  RAISE EXCEPTION 'Only admins can list teacher accounts.' USING ERRCODE = '42501';
END IF;

RETURN QUERY
SELECT ur.user_id, u.email::text, ur.full_name, ur.staff_code
FROM public.user_roles ur JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'teacher'
ORDER BY ur.full_name, u.email, ur.user_id;
END;
$$;

CREATE FUNCTION public.list_pending_teacher_accounts()
RETURNS TABLE (user_id uuid, email text, full_name text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
IF public.current_user_role() IS DISTINCT FROM 'admin' THEN
  RAISE EXCEPTION 'Only admins can list pending teacher accounts.' USING ERRCODE = '42501';
END IF;

RETURN QUERY
SELECT p.user_id, p.email, p.full_name, p.created_at
FROM public.list_pending_auth_users() p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email_confirmed_at IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = p.user_id AND i.provider = 'google')
ORDER BY p.created_at DESC;
END;
$$;

CREATE FUNCTION public.link_teacher_account(p_user_id uuid, p_full_name text, p_staff_code text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
v_role text;
v_name text := NULLIF(btrim(p_full_name), '');
v_code text := NULLIF(btrim(p_staff_code), '');
BEGIN
IF public.current_user_role() IS DISTINCT FROM 'admin' THEN
  RAISE EXCEPTION 'Only admins can approve teachers.' USING ERRCODE = '42501';
END IF;
IF p_user_id IS NULL OR v_name IS NULL THEN
  RAISE EXCEPTION 'An account and verified name are required.' USING ERRCODE = '22023';
END IF;

PERFORM 1 FROM auth.users u WHERE u.id = p_user_id AND u.deleted_at IS NULL FOR UPDATE;
IF NOT FOUND THEN
  RAISE EXCEPTION 'Auth user not found.' USING ERRCODE = 'P0002';
END IF;

SELECT ur.role INTO v_role FROM public.user_roles ur WHERE ur.user_id = p_user_id;
IF v_role = 'teacher' THEN
  RAISE EXCEPTION 'This account is already a teacher.' USING ERRCODE = '23505';
ELSIF v_role IS NOT NULL THEN
  RAISE EXCEPTION 'This account already has an institute role.' USING ERRCODE = '23514';
END IF;

IF NOT EXISTS (
  SELECT 1 FROM auth.users u JOIN auth.identities i ON i.user_id = u.id
  WHERE u.id = p_user_id AND u.email_confirmed_at IS NOT NULL AND i.provider = 'google'
) THEN
  RAISE EXCEPTION 'The account must sign in with Google first.' USING ERRCODE = '23514';
END IF;

INSERT INTO public.user_roles (user_id, role, full_name, staff_code)
VALUES (p_user_id, 'teacher', v_name, v_code)
ON CONFLICT (user_id) DO NOTHING;
IF NOT FOUND THEN
  RAISE EXCEPTION 'This account already has an institute role. Refresh the account list.' USING ERRCODE = '23514';
END IF;

INSERT INTO public.role_audit_logs (actor_user_id, target_user_id, action, role, details)
VALUES (auth.uid(), p_user_id, 'approve_teacher', 'teacher',
        jsonb_build_object('full_name', v_name, 'staff_code', v_code));
END;
$$;

CREATE FUNCTION public.unlink_teacher_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
v_name text;
v_code text;
BEGIN
IF public.current_user_role() IS DISTINCT FROM 'admin' THEN
  RAISE EXCEPTION 'Only admins can revoke teacher access.' USING ERRCODE = '42501';
END IF;
IF p_user_id IS NULL THEN
  RAISE EXCEPTION 'An account is required.' USING ERRCODE = '22023';
END IF;
IF p_user_id = auth.uid() THEN
  RAISE EXCEPTION 'You cannot revoke your own access.' USING ERRCODE = '23514';
END IF;

DELETE FROM public.user_roles
WHERE user_id = p_user_id AND role = 'teacher'
RETURNING full_name, staff_code INTO v_name, v_code;
IF NOT FOUND THEN
  RAISE EXCEPTION 'Only teacher access can be revoked here.' USING ERRCODE = '23514';
END IF;

INSERT INTO public.role_audit_logs (actor_user_id, target_user_id, action, role, details)
VALUES (auth.uid(), p_user_id, 'revoke_teacher', 'teacher',
        jsonb_build_object('full_name', v_name, 'staff_code', v_code));
END;
$$;

REVOKE ALL ON FUNCTION public.list_teacher_accounts(), public.list_pending_teacher_accounts(),
public.link_teacher_account(uuid, text, text), public.unlink_teacher_account(uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_teacher_accounts(), public.list_pending_teacher_accounts(),
public.link_teacher_account(uuid, text, text), public.unlink_teacher_account(uuid)
TO authenticated;

COMMIT;
