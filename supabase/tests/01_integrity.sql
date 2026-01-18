-- Test: 01_integrity.sql
-- Purpose: Verify RLS is active and tables exist.

BEGIN;

SELECT plan(3);

-- Test 1: Check if critical tables exist
SELECT has_table('tariffs_public');
SELECT has_table('tariffs_commercial');

-- Test 2: Check RLS is enabled on tariffs_commercial
SELECT results_eq(
    $$SELECT rowsecurity FROM pg_tables WHERE tablename = 'tariffs_commercial'$$,
    $$VALUES (true)$$,
    'Row Level Security should be enabled on commercial tariffs'
);

SELECT * FROM finish();
ROLLBACK;
