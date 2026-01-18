-- Fix team_members INSERT Policy SQL bug
-- Bug: WHERE team_members_1.team_id = team_members_1.team_id (compares column to itself, always true!)
-- Fix: Correct comparison with the outer query's team_id

DROP POLICY IF EXISTS "Team owners and admins can add members" ON team_members;

CREATE POLICY "Team owners and admins can add members" ON team_members
FOR INSERT WITH CHECK (
  -- Admins/Owners can add members
  get_team_role(auth.uid(), team_id) IN ('owner', 'admin')
  -- OR: User can add themselves as the first member (team creation)
  OR (
    auth.uid() = user_id 
    AND NOT EXISTS (
      SELECT 1 FROM team_members existing_members 
      WHERE existing_members.team_id = team_members.team_id
    )
  )
);