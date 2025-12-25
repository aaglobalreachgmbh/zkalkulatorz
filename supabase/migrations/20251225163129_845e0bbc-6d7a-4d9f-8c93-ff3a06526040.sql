-- ============================================
-- Phase 5: Erweiterte Features
-- ============================================

-- 1. Customers Table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  industry text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Customer policies
CREATE POLICY "Users can view their own customers"
ON public.customers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own customers"
ON public.customers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers"
ON public.customers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers"
ON public.customers FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_customers_user_id ON public.customers(user_id);

-- 2. Teams Table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Team Members Table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id),
  CONSTRAINT valid_team_role CHECK (role IN ('owner', 'admin', 'member'))
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);

-- 4. Function to check team membership (SECURITY DEFINER to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
  )
$$;

-- 5. Function to check team role
CREATE OR REPLACE FUNCTION public.get_team_role(_user_id uuid, _team_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.team_members
  WHERE user_id = _user_id
    AND team_id = _team_id
$$;

-- 6. Teams RLS Policies
CREATE POLICY "Users can view teams they are members of"
ON public.teams FOR SELECT
USING (public.is_team_member(auth.uid(), id));

CREATE POLICY "Users can create teams"
ON public.teams FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners and admins can update teams"
ON public.teams FOR UPDATE
USING (public.get_team_role(auth.uid(), id) IN ('owner', 'admin'));

CREATE POLICY "Team owners can delete teams"
ON public.teams FOR DELETE
USING (public.get_team_role(auth.uid(), id) = 'owner');

-- 7. Team Members RLS Policies
CREATE POLICY "Users can view team members of their teams"
ON public.team_members FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team owners and admins can add members"
ON public.team_members FOR INSERT
WITH CHECK (
  public.get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
  OR (auth.uid() = user_id AND NOT EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_members.team_id))
);

CREATE POLICY "Team owners and admins can update members"
ON public.team_members FOR UPDATE
USING (public.get_team_role(auth.uid(), team_id) IN ('owner', 'admin'));

CREATE POLICY "Team owners can remove members"
ON public.team_members FOR DELETE
USING (
  public.get_team_role(auth.uid(), team_id) = 'owner'
  OR auth.uid() = user_id
);

-- 8. Alter saved_offers for customer and team support
ALTER TABLE public.saved_offers
ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
ADD COLUMN visibility text NOT NULL DEFAULT 'private';

ALTER TABLE public.saved_offers
ADD CONSTRAINT valid_visibility CHECK (visibility IN ('private', 'team'));

CREATE INDEX idx_saved_offers_customer_id ON public.saved_offers(customer_id);
CREATE INDEX idx_saved_offers_team_id ON public.saved_offers(team_id);

-- 9. Update saved_offers SELECT policy to include team visibility
DROP POLICY IF EXISTS "Users can view their own offers" ON public.saved_offers;

CREATE POLICY "Users can view own and team offers"
ON public.saved_offers FOR SELECT
USING (
  auth.uid() = user_id
  OR (visibility = 'team' AND public.is_team_member(auth.uid(), team_id))
);

-- 10. Alter profiles for active team
ALTER TABLE public.profiles
ADD COLUMN active_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

-- 11. Offer Activities Table for Reporting
CREATE TABLE public.offer_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES public.saved_offers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_activity_type CHECK (activity_type IN ('created', 'updated', 'viewed', 'exported', 'shared'))
);

ALTER TABLE public.offer_activities ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_offer_activities_offer_id ON public.offer_activities(offer_id);
CREATE INDEX idx_offer_activities_user_id ON public.offer_activities(user_id);
CREATE INDEX idx_offer_activities_created_at ON public.offer_activities(created_at);

-- Activities policies
CREATE POLICY "Users can view own activities"
ON public.offer_activities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activities"
ON public.offer_activities FOR INSERT
WITH CHECK (auth.uid() = user_id);