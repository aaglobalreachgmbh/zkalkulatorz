# Bridge Protocol (Antigravity <-> ChatGPT)

> [!IMPORTANT]
> This directive MUST be followed at the end of EVERY execution cycle.

## Purpose
To maintain a seamless context synchronization with the External AI (ChatGPT), preventing the need for repetitive explanations by the User.

## Protocol Steps
1.  **Analyze**: Synthesize the User's latest prompt and your understanding of it.
2.  **Report**: Update `SYNC_REPORT_FOR_CHATGPT.md` (Absolute Path: `<appDataDir>/brain/<conversation-id>/SYNC_REPORT_FOR_CHATGPT.md`) with the **Latest Run** details.
3.  **Ask**: Formulate specific questions for ChatGPT if architectural validation is needed.

## `SYNC_REPORT_FOR_CHATGPT.md` Structure
Each entry must contain:
1.  **TIMESTAMP**: Time of execution.
2.  **USER PROMPT SUMMARY**: What was requested?
3.  **ACTIONS EXECUTED**: List of created/modified files and key logic decisions.
4.  **CURRENT SYSTEM STATE**: Which Phase/Sub-Phase is active? What is the "Health" of the code?
5.  **QUESTIONS FOR EXTERNAL AI**: Specific queries (e.g., "Is the Licensing Schema sufficient for the defined Enterprise tiers?").

## Constraints (The "Anchor")
*   **DO NOT** propose jumping to the next major Phase unless explicitly instructed.
*   **FOCUS** on optimizing, refining, and perfecting the *current* deliverables.
*   **PING-PONG**: Encourage a back-and-forth iteration with ChatGPT to improve efficiency.
