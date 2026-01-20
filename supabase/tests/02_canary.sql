-- Test: 02_canary.sql
-- Purpose: "Negative Testing" - Verify that unauthorized actions FAIL.
-- The "Canary in the verify mine" dying means the test passed (security caught it).

BEGIN;

SELECT plan(9); -- Adjust plan count based on tests

-- PREPARE: Mock Data
-- We need data to NOT find.
INSERT INTO auth.users (id, email) VALUES ('user_a', 'a@example.com'), ('user_b', 'b@example.com');
-- Assuming a table with tenant isolation exists, e.g., 'orders' or similar. 
-- Using 'api_logs' as a proxy for multi-tenancy if 'orders' doesn't exist, or just checking 'tariffs_commercial' access.

-- TEST 1: The "Curious User" (Authenticated but unauthorized)
-- Scenario: User A tries to read commercial tariffs (Cost Prices).
-- Expectation: 0 rows returned (RLS filtering).

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO 'user_a';

SELECT is_empty(
    $$SELECT * FROM tariffs_commercial$$,
    'Authenticated user should NOT see any commercial tariffs (Cost Price Protection)'
);

-- TEST 2: The "Sabotage" (Unauthorized Update)
-- Scenario: User A tries to change public prices.
-- Expectation: Exception thrown (RLS Policy Violation or Permission Denied).

SELECT throws_ok(
    $$UPDATE tariffs_public SET list_price_netto = 0 WHERE id = 'some_id'$$,
    'new row violates row-level security policy for table "tariffs_public"', -- Expected Postgres error message for RLS block on UPDATE
    'User cannot sabotage pricing'
);


-- TEST 3: The "Wrong Tenant" (Multi-Tenancy)
-- Scenario: User A tries to read User B's logs/data.
-- We insert a log for User B first (as superuser/admin context before switching).

SET LOCAL ROLE postgres;
INSERT INTO api_logs (request_id, user_id, function_name) VALUES ('req_b', 'user_b', 'test_func');

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO 'user_a';

SELECT is_empty(
    $$SELECT * FROM api_logs WHERE user_id = 'user_b'$$,
    'User A should NOT see User B logs'
);

-- CLEANUP (Automatic via ROLLBACK, but good to be explicit in thought)
SELECT * FROM finish();
ROLLBACK;
