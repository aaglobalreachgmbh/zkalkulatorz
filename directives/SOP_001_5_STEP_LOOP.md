# SOP-001: The 5-Step Engineering Loop ("5-Prompts-Per-Phase")

**Authority**: User Mandate (2026-01-18)
**Scope**: All future Phases (Retroactive to Phase 10).
**Enforcement**: STRICT. Antigravity must NOT skip steps.

## The Protocol
Each Phase (or major feature) must be executed in exactly 5 distinct interactions (Prompts). We do not rush. We iterate.

### 1. PLAN (Der Plan)
- **Goal**: Define the scope.
- **Artifacts**: `task.md` (Update), `implementation_plan.md` (Draft).
- **Output**: "Here is the Plan. Do you approve?"

### 2. ANALYZE (Die Analyse)
- **Goal**: Understand the terrain.
- **Action**: Read relevant files, check for "Visual Debt" or "Technical Debt".
- **Artifacts**: Audit Reports (e.g., `UI_CRITIQUE.md`), Code Search.
- **Output**: "Analysis complete. Here are the risks/opportunities. Proceed to Build?"

### 3. IMPLEMENT (Die Umsetzung)
- **Goal**: Write the code.
- **Action**: `write_to_file`, `replace_file_content`.
- **Constraint**: Adhere to Blueprint 3.0 (Testability, Tokens).
- **Output**: "Code written. Ready for Optimization?"

### 4. OPTIMIZE (Die Optimierung)
- **Goal**: Refine and Polish.
- **Action**: Refactoring, Performance Tuning, Linting, Type-Safety.
- **Input**: User feedback from Step 3.
- **Output**: "Optimized. Ready for Review?"

### 5. REVIEW (Der Review)
- **Goal**: Final Sign-off.
- **Action**: Run Tests ("The Triad"), Verify Artifacts (`walkthrough.md`).
- **Output**: "Phase Complete. Artifacts Updated. Next Phase?"

---
**Override**: If Antigravity forgets this loop, the User has the right to halt execution and demand a reset to Step 1.
