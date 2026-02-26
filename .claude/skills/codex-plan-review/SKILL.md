---
name: codex-plan-review
description: Debate OpenSpec implementation plans between Claude Code and Codex CLI (GPT). After creating tasks.md via OpenSpec, invoke this skill to have Codex review the plan. Both AIs debate through multiple rounds until reaching consensus before /spx-apply begins. (OpenSpec Integration)
---

# Codex Plan Review — Skill Guide (OpenSpec Integration)

## Overview
This skill orchestrates an adversarial debate between Claude Code and OpenAI Codex CLI to stress-test OpenSpec implementation plans. The goal is to catch flaws, blind spots, and improvements **before** any code is written via `/spx-apply`.

**Flow:** OpenSpec artifacts (proposal + specs + design + tasks) → Codex reviews → Claude Code rebuts → Codex rebuts → ... → Consensus → `/spx-apply`

## Prerequisites
- An active OpenSpec change must exist with at least `tasks.md` written (ideally all 4 artifacts: proposal.md, specs/, design.md, tasks.md).
- The Codex CLI (`codex`) must be installed and available in PATH.
- OpenAI API key configured for Codex.

### Codex CLI Pre-Check
Before starting the debate, verify Codex is available:
```bash
if ! command -v codex &>/dev/null; then
  echo "ERROR: Codex CLI not found in PATH. Install it first: npm install -g @openai/codex"
  exit 1
fi
codex --version
```
If the check fails, inform the user and stop. Do NOT proceed without a working Codex CLI.

## Codex Runner Script

This skill uses `codex-runner` (Go binary) with `start`/`poll`/`stop` subcommands to run Codex CLI in the background and report progress incrementally.

- **`start`** — launches Codex as a detached background process, returns immediately with a state directory path
- **`poll`** — checks progress, outputs plain text status on stdout and progress events on stderr
- **`stop`** — kills processes and cleans up the state directory

### Bootstrap Logic (inline in every Bash call)

Every Bash call that invokes the runner must include this resolve block at the top:

```bash
RUNNER="${CODEX_RUNNER:-$HOME/.local/bin/codex-runner}"
if ! test -x "$RUNNER" || ! "$RUNNER" --version 2>/dev/null | grep -q 'codex-runner 6'; then
  echo "ERROR: codex-runner v6 not found at $RUNNER. SessionStart hook should have installed it." >&2
  exit 1
fi
```

The `codex-runner` binary is a compiled Go program installed by the SessionStart hook. No embedded script is needed — the binary is self-contained.

### Runner Output Format

**Start mode** outputs a single line:
```
CODEX_STARTED:<STATE_DIR>
```

**Poll mode** outputs on stdout (machine-readable, one line per field):
- Running: `POLL:running:<elapsed>s`
- Completed: `POLL:completed:<elapsed>s` + `THREAD_ID:<id>` (review text in `<STATE_DIR>/review.txt`)
- Failed: `POLL:failed:<elapsed>s:<exit_code>:<error>`
- Timeout: `POLL:timeout:<elapsed>s:2:<error>`
- Stalled: `POLL:stalled:<elapsed>s:4:<error>`

Progress events are written to stderr in format `[Xs] message` — these are visible in Bash tool output.

### Exit Codes (legacy mode)
- `0` = success
- `1` = general error
- `2` = timeout (540s default)
- `3` = codex turn failed
- `4` = codex stalled (~3 min no output)
- `5` = codex not found in PATH

### Poll Status Codes
- `running` — Codex still working; stderr shows progress events
- `completed` — Codex finished; `THREAD_ID:<id>` on stdout, review in `<STATE_DIR>/review.txt`
- `failed` — Codex turn failed or process exited unexpectedly
- `timeout` — Exceeded timeout (default 540s)
- `stalled` — No new output for ~3 minutes

## Step 0: Identify the Active OpenSpec Change

Before anything else, identify which OpenSpec change to review:

1. Run `npx openspec list` to find active changes.
2. Verify the change has `tasks.md` by checking: `openspec/changes/<change-name>/tasks.md`
3. Also check for other artifacts:
   - `openspec/changes/<change-name>/proposal.md`
   - `openspec/changes/<change-name>/design.md`
   - Each individual spec file — run `find openspec/changes/<change-name>/specs -name "*.md" -type f` to get the full list
4. Save the `<change-name>` and the **absolute paths** to all available artifacts (including each spec file individually).

If no active change exists or `tasks.md` is missing, inform the user and stop.

## Step 1: Gather Configuration

Ask the user (via `AskUserQuestion`) **only one question**:
- Which reasoning effort to use (`xhigh`, `high`, `medium`, or `low`)

**Do NOT ask** which model to use — always use Codex's default model (no `-m` flag).
**Do NOT ask** how many rounds — the loop runs automatically until consensus.

## Step 2: Prepare the Plan Context

1. Ensure all OpenSpec artifacts are saved to files (they should already be if the OpenSpec flow was followed).
2. Note the **absolute paths** to:
   - `tasks.md` (primary — the implementation plan)
   - `design.md` (architecture decisions, risks, migration)
   - `proposal.md` (why + what + capabilities + impact)
   - Each individual spec file inside `specs/` — run `find openspec/changes/<name>/specs -name "*.md" -type f` to get the full list
3. **Do NOT paste file contents into the Codex prompt.** Codex will read the files directly.
4. **List every spec file explicitly in the prompt** — do NOT just give the `specs/` directory path. Codex may miss files if only given a directory.

## Prompt Construction Principle

**Only include in the Codex prompt what Codex cannot access on its own:**
- Paths to all OpenSpec artifact files
- The user's original request / task description
- Important context from the conversation
- Project conventions from CLAUDE.md that are relevant to the review

**Do NOT include:**
- File contents (Codex reads them)
- Code snippets Codex can read from the repo

## Step 3: Send Plan to Codex for Review (Round 1)

### Step 3a — Start Codex

Run the codex-runner `start` subcommand with the bootstrap block:

```bash
RUNNER="${CODEX_RUNNER:-$HOME/.local/bin/codex-runner}"
if ! test -x "$RUNNER" || ! "$RUNNER" --version 2>/dev/null | grep -q 'codex-runner 6'; then
  echo "ERROR: codex-runner v6 not found at $RUNNER. SessionStart hook should have installed it." >&2
  exit 1
fi
"$RUNNER" start --working-dir <WORKING_DIR> --effort <EFFORT> <<'EOF'
<REVIEW_PROMPT>
EOF
```

The output will be: `CODEX_STARTED:<WORKING_DIR>/.codex-review/runs/<RUN_ID>`

Save the state directory path — you need it for polling and cleanup.

### Step 3b — Poll Loop

Call `poll` repeatedly to check progress. Each poll outputs status on stdout and progress on stderr:

```bash
sleep 60 && "$RUNNER" poll <STATE_DIR>
```

After each poll:
- stdout starts with `POLL:running:` → Codex is still working. The stderr output shows progress events like `[45s] Codex running: cat tasks.md`. Call poll again — use `sleep 30` for the second poll, then `sleep 15` for all subsequent polls.
- stdout starts with `POLL:completed:` → Extract thread_id from the `THREAD_ID:` line. Read the review from `<STATE_DIR>/review.txt` using the Read tool. Proceed to Step 3c.
- stdout starts with `POLL:failed:` or `POLL:timeout:` or `POLL:stalled:` → Handle per Error Handling section. Call `stop` to cleanup.

**Progress reporting**: The stderr output from the Bash tool call shows progress events (e.g., `[45s] Codex is thinking...`, `[52s] Codex running: cat tasks.md`). Summarize these for the user between polls.

### Step 3c — Cleanup

After extracting the completed result (or handling an error):

```bash
"$RUNNER" stop <STATE_DIR>
```

This kills any remaining processes and removes the state directory.

Save the `thread_id` from the `THREAD_ID:` line — you will need it for subsequent rounds.

### Review Prompt Template

```
You are participating in a plan review debate with Claude Code (Claude Opus 4.6).

## Your Role
You are the REVIEWER. Your job is to critically evaluate an implementation plan for a Vietnamese-language Thread Inventory Management System (garment industry). Be thorough, constructive, and specific.

## Project Context
- **Stack**: Vue 3 + Quasar 2 + TypeScript + Vite | Hono backend | Supabase (PostgreSQL)
- **Architecture**: Frontend → Hono API (fetchApi) → supabaseAdmin → PostgreSQL

## Project Conventions — Read These Files FIRST
Read these files to understand ALL project conventions before reviewing:
1. **CLAUDE.md** (project root): <ABSOLUTE_PATH_TO_PROJECT>/CLAUDE.md — master conventions, anti-patterns, architecture
2. **DB conventions**: <ABSOLUTE_PATH_TO_PROJECT>/.claude/skills/new-db/SKILL.md — database layer patterns, migration rules
3. **Backend conventions**: <ABSOLUTE_PATH_TO_PROJECT>/.claude/skills/new-be/SKILL.md — Hono route patterns, Zod validation, response format
4. **Frontend conventions**: <ABSOLUTE_PATH_TO_PROJECT>/.claude/skills/new-fe/SKILL.md — Vue component patterns, service layer, composables

Use the conventions from these files as your review checklist. Any violation is a valid issue.

## OpenSpec Artifacts — Read These Files
1. **Tasks (implementation plan)**: <ABSOLUTE_PATH_TO_TASKS_MD>
2. **Design (architecture decisions)**: <ABSOLUTE_PATH_TO_DESIGN_MD>
3. **Proposal (why + what)**: <ABSOLUTE_PATH_TO_PROPOSAL_MD>
4. **Specs** (read ALL — each file is a separate capability/requirement):
   - <ABSOLUTE_PATH_TO_SPEC_FILE_1>
   - <ABSOLUTE_PATH_TO_SPEC_FILE_2>
   - ... (list every .md file found in specs/ directory)

Read ALL files listed above for full context before reviewing. Do NOT skip any spec file.

## User's Original Request
<The user's original task/request that prompted this plan>

## Session Context
<Any important context from the conversation that Codex cannot access on its own>

(If there is no additional context beyond the artifact files, write "No additional context — the OpenSpec artifacts are self-contained.")

## Instructions
1. Read ALL the OpenSpec artifact files listed above.
2. Read any source files referenced in the plan to understand the current codebase state.
3. Cross-reference tasks.md against design.md and specs/ — do tasks fully cover the design decisions and spec requirements?
4. Analyze and produce your review in the EXACT format below.

## Required Output Format

For each issue found, use this structure:

### ISSUE-{N}: {Short title}
- **Category**: Critical Issue | Missing Task | Improvement | Spec Gap | Security | Question
- **Severity**: CRITICAL | HIGH | MEDIUM | LOW
- **Plan Reference**: Task {X.Y} / Design Decision "{name}" / Spec "{capability}" / Proposal section
- **Description**: What the problem is, in detail.
- **Why It Matters**: Concrete scenario showing how this causes a real failure, bug, or degraded outcome.
- **Suggested Fix**: Specific proposed change to the plan. (Required for Critical Issue and Missing Task. Optional for Question.)

After all issues, provide:

### VERDICT
- **Result**: REJECT | APPROVE_WITH_CHANGES | APPROVE
- **Summary**: 2-3 sentence overall assessment.
- **Spec Coverage**: Are all spec requirements covered by tasks? List any gaps.
- **Design Alignment**: Do tasks correctly implement design decisions? Note any deviations.

Rules:
- Be specific: reference exact task numbers, file paths, or design decisions in the plan.
- Do NOT rubber-stamp the plan. Your value comes from finding real problems.
- Do NOT raise vague concerns without concrete scenarios.
- Every Critical Issue and Missing Task MUST have a Suggested Fix.
- Pay special attention to:
  - Database migration order and dependencies
  - Hono route ordering (specific routes before generic /:id)
  - Supabase column names matching actual schema
  - FEFO allocation logic correctness
  - Dual UoM consistency (kg + meters)
  - fetchApi usage (not raw fetch)
  - AppInput/AppSelect/AppButton usage (not q-*)
  - Vietnamese messages for user-facing text
  - Soft delete patterns (deleted_at)
- Severity-to-verdict mapping: any CRITICAL → REJECT, any HIGH or MEDIUM → APPROVE_WITH_CHANGES, only LOW → APPROVE.
- Maximum 5 rounds. If no consensus after 5 rounds → present final state to user for decision.
```

**After receiving Codex's review**, summarize it for the user before proceeding.

## Step 4: Claude Code Rebuts (Round 1)

After receiving Codex's review, you (Claude Code) must:

1. **Carefully analyze** each ISSUE Codex raised against the actual OpenSpec artifacts and codebase.
2. **Accept valid criticisms** - If Codex found real issues, acknowledge them and update `tasks.md` (and `design.md` if needed) using Edit tool.
3. **Push back on invalid points** - If you disagree with Codex's assessment, explain why with evidence from the codebase, CLAUDE.md conventions, or documentation.
4. **Summarize** for the user what you accepted, what you rejected, and why.
5. **Immediately proceed to Step 5** — do NOT ask the user whether to continue. Always send the updated plan back to Codex for re-review.

## Step 5: Continue the Debate (Rounds 2+)

### Step 5a — Start Codex (resume)

Run the runner with `--thread-id` to resume the existing Codex conversation:

```bash
RUNNER="${CODEX_RUNNER:-$HOME/.local/bin/codex-runner}"
if ! test -x "$RUNNER" || ! "$RUNNER" --version 2>/dev/null | grep -q 'codex-runner 6'; then
  echo "ERROR: codex-runner v6 not found at $RUNNER. SessionStart hook should have installed it." >&2
  exit 1
fi
"$RUNNER" start --working-dir <WORKING_DIR> --effort <EFFORT> --thread-id <THREAD_ID> <<'EOF'
<REBUTTAL_PROMPT>
EOF
```

### Step 5b — Poll Loop

Same as Step 3b — poll until completed, then proceed to Step 5c.

### Step 5c — Cleanup

```bash
"$RUNNER" stop <STATE_DIR>
```

### Rebuttal Prompt Template

```
This is Claude Code (Claude Opus 4.6) responding to your review.

## Issues Accepted & Fixed
<For each accepted issue, reference by ISSUE-{N} and describe what was changed in tasks.md/design.md>

## Issues Disputed
<For each disputed issue, reference by ISSUE-{N} and explain why with evidence>

## Your Turn
Re-read the OpenSpec artifact files (same paths as before) to see the updated plan, then re-review.
- Have your previous concerns been properly addressed?
- Do the changes introduce any NEW issues?
- Are there any remaining problems?

Use the same output format as before (ISSUE-{N} structure + VERDICT).
Verdict options: REJECT | APPROVE_WITH_CHANGES | APPROVE
```

**After each Codex response:**
1. Summarize Codex's response for the user.
2. If Codex's verdict is `APPROVE` → proceed to Step 6.
3. If Codex's verdict is `APPROVE_WITH_CHANGES` → address the suggestions, then **automatically** send one more round to Codex for confirmation. Do NOT ask the user.
4. If Codex's verdict is `REJECT` → address the issues and **automatically** continue to next round. Do NOT ask the user.

**IMPORTANT**: The debate loop is fully automatic. After fixing issues or updating the plan, ALWAYS send it back to Codex without asking the user. The loop only stops when Codex returns `APPROVE`. The user is only consulted at the very end (Step 6) or if a stalemate is detected.

### Early Termination & Round Extension

- **Early termination**: If Codex returns `APPROVE`, end the debate immediately and proceed to Step 6.
- **Max round limit**: The debate runs for a maximum of **5 rounds**. After 5 rounds without `APPROVE`, present the current state to the user and let them decide whether to continue, accept as-is, or modify manually.
- **Stalemate detection**: If the same points go back and forth without progress for 2 consecutive rounds, present the disagreement to the user and let them decide (even if under 5 rounds).

**Repeat** Steps 4-5 until consensus or stalemate.

## Step 6: Finalize and Report

After the debate concludes, present the user with a **Plan Review Debate Summary**:

```
## Plan Review Debate Summary

### Change: <change-name>
### Rounds: X
### Final Verdict: [CONSENSUS REACHED / STALEMATE - USER DECISION NEEDED]

### Key Changes from Debate:
1. [Change 1 - accepted from Codex]
2. [Change 2 - accepted from Codex]
...

### Points Where Claude Prevailed:
1. [Point 1 - Claude's position was maintained]
...

### Points Where Codex Prevailed:
1. [Point 1 - Codex's position was accepted]
...

### Updated Artifacts:
- tasks.md: [changes made]
- design.md: [changes made, if any]
```

Then ask the user (via `AskUserQuestion`):
- **Approve & Implement (/spx-apply)** - Proceed with the final plan
- **Request more rounds** - Continue debating specific points
- **Modify manually** - User wants to make their own adjustments before implementing

## Step 7: Transition to Implementation

If the user approves:
1. Inform user the plan has been stress-tested and is ready for `/spx-apply`.
2. The user can now run `/spx-apply` to begin implementation.

## Important Rules

1. **Codex reads the plan files itself** - Do NOT paste plan content into the prompt. Just give Codex the file paths.
2. **Only send what Codex can't access** - The prompt should contain: file paths, user's original request, session context. NOT: file contents, diffs, code snippets.
3. **Always use heredoc (`<<'EOF'`) for prompts** - Heredoc with single-quoted delimiter prevents shell expansion.
4. **Always `--sandbox read-only`** - Review only, no file edits during debate.
5. **Always `-C <PROJECT_DIR>`** - Correct project directory.
6. **Always `--skip-git-repo-check`** - Required for Codex CLI.
7. **Redirect stderr to file** - `2>"$ERR"`, never `/dev/null`.
8. **No `-m` flag** - Always use Codex's default model.
9. **Use absolute paths for temp files** - Shell variables don't persist.
10. **Resume by thread ID** - Use the `thread_id` from the `THREAD_ID:` line of poll completed output for subsequent rounds.
11. **Always summarize after each round** - User must know what happened before continuing.
12. **Be genuinely adversarial** - Push back when you have good reason to. Don't just accept everything.
13. **Track artifact evolution** - Update tasks.md/design.md after each round so Codex reads latest version.
14. **Require structured output** - If Codex doesn't use ISSUE-{N} format, ask to reformat in resume prompt.
15. **Always call `stop` after getting results** - Clean up the state directory after extracting the completed result or handling errors.
16. **OpenSpec artifact priority** - tasks.md is the primary review target, but design.md and specs/ provide crucial context for validating completeness.

## Error Handling

- If no active OpenSpec change exists → inform user, suggest running `npx openspec new change <name>` first.
- If `tasks.md` is missing → inform user, suggest completing the OpenSpec flow first.
- If poll returns `POLL:timeout:`, inform the user and ask if they want to retry with a longer timeout. Call `stop` to cleanup.
- If poll returns `POLL:failed:`, report the error message to the user. Call `stop` to cleanup.
- If poll returns `POLL:stalled:`, ask the user whether to retry or abort. Call `stop` to cleanup.
- If the `start` command exits with code `5` (codex not found), tell the user to install the Codex CLI.
- If the debate stalls (same points going back and forth without resolution), present the disagreement to the user and let them decide.
