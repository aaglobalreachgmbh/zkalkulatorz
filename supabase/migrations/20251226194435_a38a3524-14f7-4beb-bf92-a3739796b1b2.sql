-- Fix saved_offers RLS policy to ensure team_id is NOT NULL when visibility = 'team'
DROP POLICY IF EXISTS "Users can view own and team offers" ON saved_offers;

CREATE POLICY "Users can view own and team offers" ON saved_offers
FOR SELECT USING (
  (auth.uid() = user_id) 
  OR (
    visibility = 'team' 
    AND team_id IS NOT NULL 
    AND is_team_member(auth.uid(), team_id)
  )
);