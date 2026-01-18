-- ============================================
-- Phase 1-3 Teil 1: ENUM erweitern
-- ============================================

-- 1. Erweitere app_role ENUM um tenant_admin
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tenant_admin' AFTER 'moderator';