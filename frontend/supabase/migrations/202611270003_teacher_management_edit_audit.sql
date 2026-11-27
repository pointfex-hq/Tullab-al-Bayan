BEGIN;

-- The original check only allowed approval/revocation. Editing a teacher now writes
-- its own audit row, so the allowed action set has to be widened first.
ALTER TABLE public.role_audit_logs DROP CONSTRAINT IF EXISTS role_audit_logs_action_check;
ALTER TABLE public.role_audit_logs ADD CONSTRAINT role_audit_logs_action_check
  CHECK (action IN ('approve_teacher', 'revoke_teacher', 'update_teacher'));

CREATE FUNCTION public.update_teacher_account(
  p_user_id uuid,
  p_full_name text,
  p_staff_code text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_role text;
  v_name text := NULLIF(btrim(p_full_name), '');
  v_code text := NULLIF(btrim(p_staff_code), '');
  v_old_name text;
  v_old_code text;
BEGIN
  IF public.current_user_role() IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can edit teacher accounts.' USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS NULL OR v_name IS NULL THEN
    RAISE EXCEPTION 'An account and verified name are required.' USING ERRCODE = '22023';
  END IF;

  SELECT ur.role, ur.full_name, ur.staff_code
    INTO v_role, v_old_name, v_old_code
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id
  FOR UPDATE;
  IF NOT FOUND OR v_role IS DISTINCT FROM 'teacher' THEN
    RAISE EXCEPTION 'Only teacher access can be edited here.' USING ERRCODE = '23514';
  END IF;

  IF v_code IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id <> p_user_id
      AND lower(btrim(ur.staff_code)) = lower(v_code)
  ) THEN
    RAISE EXCEPTION 'That staff code is already in use.' USING ERRCODE = '23505';
  END IF;

  UPDATE public.user_roles ur
  SET full_name = v_name,
      staff_code = v_code,
      updated_at = now()
  WHERE ur.user_id = p_user_id AND ur.role = 'teacher';

  INSERT INTO public.role_audit_logs (actor_user_id, target_user_id, action, role, details)
  VALUES (auth.uid(), p_user_id, 'update_teacher', 'teacher',
          jsonb_build_object(
            'full_name', v_name,
            'staff_code', v_code,
            'previous_full_name', v_old_name,
            'previous_staff_code', v_old_code
          ));
END;
$$;

-- Admin-only read model for the audit panel. Names are resolved in the definer
-- so the panel does not need direct SELECT access to user_roles or auth.users.
CREATE FUNCTION public.list_teacher_audit_logs(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  action text,
  actor_name text,
  target_name text,
  details jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF public.current_user_role() IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can read teacher audit logs.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.action,
    COALESCE(actor_role.full_name, actor_user.email::text, l.actor_user_id::text) AS actor_name,
    COALESCE(target_role.full_name, l.details ->> 'full_name', target_user.email::text, l.target_user_id::text) AS target_name,
    l.details,
    l.created_at
  FROM public.role_audit_logs l
  LEFT JOIN public.user_roles actor_role ON actor_role.user_id = l.actor_user_id
  LEFT JOIN auth.users actor_user ON actor_user.id = l.actor_user_id
  LEFT JOIN public.user_roles target_role ON target_role.user_id = l.target_user_id
  LEFT JOIN auth.users target_user ON target_user.id = l.target_user_id
  ORDER BY l.created_at DESC, l.id DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200);
END;
$$;

REVOKE ALL ON FUNCTION public.update_teacher_account(uuid, text, text),
  public.list_teacher_audit_logs(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_teacher_account(uuid, text, text),
  public.list_teacher_audit_logs(integer)
  TO authenticated;

COMMIT;
