---
description: Enterprise-Grade QA & Verification Protocol
---

# Enterprise QA Protocol

## 1. Automated Integrity Checks
Run the self-annealing system validator:
`python3 execution/pre_push_check.py`
- [x] Kernel Integrity
- [x] No 'Vibe Coding' Anti-Patterns
- [x] No Parasitic `node_modules`

## 2. Visual "Apple Standard" Audit
Using the Browser Subagent, verify:
- [x] **Layout**: Grid systems, responsive behavior (Laptops/Mobile).
- [x] **Typography**: Hierarchy check (Price > Title > Meta).
- [x] **Touch Targets**: Min 44px for interactive elements.
- [x] **Interaction**: Hover states, Active states, Feedback loops.

## 3. Functional Simulation
- [x] **User Flow**: Registration -> Dashboard -> Calculator -> PDF.
- [x] **Data Integrity**: Business (Netto) vs Consumer (Brutto).
- [x] **Error Handling**: Graceful degradation (no white screens).

## 4. Release Decision
IF (Automated == PASS) AND (Visual == PASS) AND (Functional == PASS):
    -> **GIT PUSH**
ELSE:
    -> **ROLLBACK / FIX**
