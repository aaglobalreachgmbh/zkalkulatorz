DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT p.proname, pg_get_function_identity_arguments(p.oid) args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname = ANY (ARRAY[
      'is_same_tenant','is_team_member','is_distribution_member','get_my_distribution_id',
      'get_my_distribution_ids','can_view_economics','is_user_approved','is_tenant_manager',
      'get_my_department_id','is_superadmin','is_owner','is_tenant_owner','is_tenant_member_or_admin',
      'get_team_role','has_ai_access','get_leaderboard','get_effective_provision_split',
      'get_catalog_hardware_safe','get_dataset_catalog_safe','update_user_meta',
      'check_email_allowed','validate_invite_token','get_shared_offer_public','increment_shared_offer_views'])
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated', r.proname, r.args);
  END LOOP;
  FOR r IN SELECT p.proname, pg_get_function_identity_arguments(p.oid) args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname = ANY (ARRAY[
      'check_email_allowed','validate_invite_token','get_shared_offer_public','increment_shared_offer_views'])
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO anon', r.proname, r.args);
  END LOOP;
END $$;