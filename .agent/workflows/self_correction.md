---
description: Protocol for analyzing errors and updating the Self-Annealing System
---

# Self-Correction Protocol (The Learning Loop)

This workflow defines how Antigravity analyzes errors and updates its own immune system (`pre_push_check.py` & `ERROR_PATTERNS.md`).

## Trigger
Run this workflow whenever:
1. A GitHub Action fails.
2. A build fails locally with a new error.
3. The user reports a recurring issue.

## Steps

1. **Capture the Error**
   - Get the exact error log (CLI or GitHub Actions).
   - Identify the specific line or flag that failed.

2. **Pattern Analysis**
   - Is this a known pattern in `directives/ERROR_PATTERNS.md`?
   - **YES:** Apply the known fix.
   - **NO:** Create a new pattern definition.
     - Assign ID (e.g., ERR_006).
     - Define the Regex match.
     - Determine Root Cause.

3. **Update The Registry**
   - Edit `directives/ERROR_PATTERNS.md`.
   - Add the new pattern entry with "Prevention" steps.

4. **Update The Enforcer**
   - Open `execution/pre_push_check.py`.
   - Look for the `ErrorPatternChecker` class.
   - Add a new method `check_[error_name]`.
   - Implement the detection logic (e.g., grep for specific files/strings).
   - Add the new check to `run_all_checks`.

5. **Verify The Mutation**
   - Run `python3 execution/pre_push_check.py`.
   - Ensure it passes (or correctly flags the error if present).
   - Commit the changes to `directives/` and `execution/`.

6. **Self-Reflection**
   - Update `directives/ANTIGRAVITY_KERNEL.md` if a fundamental architectural rule has changed.
