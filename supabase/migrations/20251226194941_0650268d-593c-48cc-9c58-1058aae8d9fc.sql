-- Fix threat_feeds Service Role Policy
-- Problem: "Service role can manage threat feeds" with ALL and USING (true) allows unauthenticated SELECT
-- Fix: Split into separate INSERT/UPDATE policies for backend sync operations only

DROP POLICY IF EXISTS "Service role can manage threat feeds" ON threat_feeds;

-- Service role needs INSERT for adding new threat feeds
CREATE POLICY "Service role can insert threat feeds" ON threat_feeds
FOR INSERT WITH CHECK (true);

-- Service role needs UPDATE for sync status updates
CREATE POLICY "Service role can update threat feeds" ON threat_feeds
FOR UPDATE USING (true);