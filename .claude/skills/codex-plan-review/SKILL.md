---
name: codex-plan-review
description: Debate OpenSpec implementation plans between Claude Code and Codex CLI (GPT). After creating tasks.md via OpenSpec, invoke this skill to have Codex review the plan. Both AIs debate through multiple rounds until reaching consensus before /spx-apply begins.
---

# Codex Plan Review — Skill Guide (OpenSpec Integration)

## Overview
This skill orchestrates an adversarial debate between Claude Code and OpenAI Codex CLI to stress-test OpenSpec implementation plans. The goal is to catch flaws, blind spots, and improvements **before** any code is written via `/spx-apply`.

**Flow:** OpenSpec artifacts (proposal + specs + design + tasks) → Codex reviews → Claude Code rebuts → Codex rebuts → ... → Consensus → `/spx-apply`

## Prerequisites
- An active OpenSpec change must exist with at least `tasks.md` written (ideally all 4 artifacts: proposal.md, specs/, design.md, tasks.md).
- The Codex CLI (`codex`) must be installed and available in PATH.
- OpenAI API key configured for Codex.

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

## Pre-flight Check

Before launching Codex, verify it's available:
```bash
command -v codex >/dev/null 2>&1 && echo "OK" || echo "MISSING: codex not found in PATH"
```
If missing, inform the user and stop.

## Progress Monitoring Strategy

Codex runs in background — no hardcoded timeout needed. Instead, Claude Code polls the JSONL output file periodically and reports progress to the user.

### Polling Loop

1. Launch Codex with `run_in_background: true` in the Bash tool. The Bash tool will return a `task_id` for the background process — **save this `task_id`** for cleanup after extraction. The first line of output will be the absolute path to the JSONL file — **save this path** for use in all subsequent poll and extract commands.
2. **Every ~60 seconds**, poll the output file with the Bash tool using the **absolute path** saved in step 1. **You MUST wait before each poll**:
   ```bash
   sleep 60 && tail -20 "$CODEX_OUTPUT"
   ```
3. Parse the last few JSONL lines and report a **short progress update** to the user. Examples:
   - "Codex is thinking... (*Reading the tasks file*)"
   - "Codex is running: `cat openspec/changes/bin-management-system/design.md`"
   - "Codex finished reading the plan, now analyzing..."
4. **Check for completion**: if `turn.completed` appears in the output, Codex is done — proceed to extract the review.
5. **Check for turn failure**: if `turn.failed` appears, extract `error.message`, report to user, stop polling.
6. **Check for process failure**: if the background task exited with error but no `turn.completed` or `turn.failed`, read stderr and report.

### Stall Detection

If 3 consecutive polls (~3 minutes) show **no new lines**, Codex may be stuck:
1. Report: "Codex appears to be stalled — no new output for ~3 minutes."
2. Ask user: **Wait longer** or **Abort and retry**.

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

### Running Codex with Progress Monitoring

Run Codex in background with `--json` output. Use the Bash tool with `run_in_background: true`:

```bash
TMPDIR="${TMPDIR:-${TMP:-/tmp}}" && RUN_ID=$(date +%s)-$$ && CODEX_OUTPUT="$TMPDIR/codex-review-$RUN_ID.jsonl" && CODEX_ERR="$TMPDIR/codex-review-$RUN_ID.err" && echo "$CODEX_OUTPUT $CODEX_ERR" && codex exec --skip-git-repo-check --json --config model_reasoning_effort="<EFFORT>" --sandbox read-only -C <PROJECT_DIR> 2>"$CODEX_ERR" <<'EOF' > "$CODEX_OUTPUT"
<PROMPT>
EOF
```

**IMPORTANT**: Save `task_id`, absolute JSONL path, absolute ERR path. Each Bash call is a new shell — variables don't persist. Always use literal absolute paths.

Also save the `thread_id` from the first `thread.started` event in the JSONL for resuming in subsequent rounds.

The `<PROMPT>` must follow this structure:

```
You are participating in a plan review debate with Claude Code (Claude Opus 4.6).

## Your Role
You are the REVIEWER. Your job is to critically evaluate an implementation plan for a Vietnamese-language Thread Inventory Management System (garment industry). Be thorough, constructive, and specific.

## Project Context
- **Stack**: Vue 3 + Quasar 2 + TypeScript + Vite | Hono backend | Supabase (PostgreSQL)
- **Architecture**: Frontend → Hono API (fetchApi) → supabaseAdmin → PostgreSQL
- **Key conventions**: AppInput/AppSelect/AppButton (not q-*), useSnackbar for toasts, DD/MM/YYYY dates, ExcelJS for exports, Vietnamese UI messages
- **Database**: snake_case tables, soft delete (deleted_at), enums use UPPERCASE values, views use v_ prefix, functions use fn_ prefix
- **Response format**: { data: T|null, error: string|null, message?: string }
- **Auth**: global authMiddleware via except() in server/index.ts, per-route requirePermission()

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
<DESCRIPTION>

## Session Context
<CONTEXT_OR_"No additional context — the OpenSpec artifacts are self-contained.">

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
- Be specific: reference exact task numbers, file paths, or design decisions.
- Do NOT rubber-stamp the plan. Your value comes from finding real problems.
- Do NOT raise vague concerns without concrete scenarios.
- Every Critical Issue and Missing Task MUST have a Suggested Fix.
- Pay special attention to: database migration order, Hono route ordering (specific before generic), Supabase column names, FEFO allocation logic, dual UoM (kg + meters).
- Severity-to-verdict mapping: any CRITICAL → REJECT, any HIGH or MEDIUM → APPROVE_WITH_CHANGES, only LOW → APPROVE.
- Maximum 5 rounds. If no consensus after 5 rounds → present final state to user for decision.
```

**After receiving Codex's review**, summarize it for the user before proceeding.

### Extracting the final review

```bash
grep '"type":"agent_message"' "$CODEX_OUTPUT" | tail -1 | python -c "import sys,json; print(json.loads(sys.stdin.read())['item']['text'])"
```

### Cleanup after extraction

1. Stop background task: `TaskOutput(task_id, block: false)` then `TaskStop(task_id)`.
2. Remove temp files:
```bash
rm -f "$CODEX_OUTPUT" "$CODEX_ERR"
```

## Step 4: Claude Code Rebuts (Round 1)

After receiving Codex's review:

1. **Analyze** each ISSUE against the actual OpenSpec artifacts and codebase.
2. **Accept valid criticisms** — update `tasks.md` (and `design.md` if needed) with accepted changes using Edit tool.
3. **Push back on invalid points** — explain why with evidence from the codebase, CLAUDE.md conventions, or documentation.
4. **Summarize** for the user what you accepted, rejected, and why.
5. **Immediately proceed to Step 5** — do NOT ask the user whether to continue.

## Step 5: Continue the Debate (Rounds 2+)

Resume using the **saved `thread_id`**:

```bash
TMPDIR="${TMPDIR:-${TMP:-/tmp}}" && RUN_ID=$(date +%s)-$$ && CODEX_OUTPUT="$TMPDIR/codex-review-$RUN_ID.jsonl" && CODEX_ERR="$TMPDIR/codex-review-$RUN_ID.err" && echo "$CODEX_OUTPUT $CODEX_ERR" && codex exec --skip-git-repo-check --json --sandbox read-only -C <PROJECT_DIR> resume <THREAD_ID> 2>"$CODEX_ERR" <<'EOF' > "$CODEX_OUTPUT"
<REBUTTAL_PROMPT>
EOF
```

The `<REBUTTAL_PROMPT>`:

```
This is Claude Code (Claude Opus 4.6) responding to your review.

## Issues Accepted & Fixed
<List accepted issues and what was changed in tasks.md/design.md>

## Issues Disputed
<List disputed issues with evidence why they're not valid>

## Your Turn
Re-read the OpenSpec artifact files (same paths as before) to see updated plan, then re-review.
- Have your previous concerns been properly addressed?
- Do the changes introduce any NEW issues?
- Are there any remaining problems?

Use the same output format as before (ISSUE-{N} structure + VERDICT).
Verdict options: REJECT | APPROVE_WITH_CHANGES | APPROVE
```

**After each Codex response:**
1. Summarize for the user.
2. `APPROVE` → proceed to Step 6.
3. `APPROVE_WITH_CHANGES` → address suggestions, automatically send one more round.
4. `REJECT` → address issues, automatically continue next round.

### Stalemate Detection
If same points go back and forth for 2 consecutive rounds → present disagreement to user and let them decide.

## Step 6: Finalize and Report

Present:

```
## Plan Review Debate Summary

### Change: <change-name>
### Rounds: X
### Final Verdict: [CONSENSUS REACHED / STALEMATE - USER DECISION NEEDED]

### Key Changes from Debate:
1. [Change 1 - accepted from Codex]
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
- **Approve & Implement** — Proceed with `/spx-apply`
- **Request more rounds** — Continue debating specific points
- **Modify manually** — User wants to adjust before implementing

## Step 7: Transition to Implementation

If the user approves:
1. Inform user the plan has been stress-tested and is ready for `/spx-apply`.
2. The user can now run `/spx-apply` to begin implementation.

## Codex Command Reference

| Action | Command |
| --- | --- |
| Initial review | `TMPDIR="${TMPDIR:-${TMP:-/tmp}}" && ... codex exec --skip-git-repo-check --json --sandbox read-only --config model_reasoning_effort="<EFFORT>" -C <DIR> 2>"$CODEX_ERR" <<'EOF' ... EOF > "$CODEX_OUTPUT"` |
| Subsequent rounds | `codex exec --skip-git-repo-check --json --sandbox read-only -C <DIR> resume <THREAD_ID> 2>"$CODEX_ERR" <<'EOF' ... EOF > "$CODEX_OUTPUT"` |
| Poll progress | `tail -5 "$CODEX_OUTPUT"` |
| Extract review | `grep '"type":"agent_message"' "$CODEX_OUTPUT" \| tail -1 \| python -c "..."` |
| Check errors | `tail -20 "$CODEX_ERR"` |
| Stop background | `TaskOutput(task_id, block: false)` then `TaskStop(task_id)` |

## Important Rules

1. **Codex reads files itself** — Do NOT paste content into prompts. Just give paths.
2. **Only send what Codex can't access** — Paths, user request, session context. NOT file contents.
3. **Always use heredoc (`<<'EOF'`)** — Prevents shell expansion.
4. **Always `--sandbox read-only`** — Review only, no file edits during debate.
5. **Always `-C <PROJECT_DIR>`** — Correct project directory.
6. **Always `--skip-git-repo-check`** — Required for Codex CLI.
7. **Redirect stderr to file** — `2>"$ERR"`, never `/dev/null`.
8. **No `-m` flag** — Use Codex's default model.
9. **Use absolute paths for temp files** — Shell variables don't persist between Bash calls.
10. **Resume by thread ID, not `--last`** — Avoid resuming wrong session.
11. **Always summarize after each round** — User must know what happened.
12. **Be genuinely adversarial** — Push back when you have good reason to. Don't just accept everything.
13. **Track artifact evolution** — Update tasks.md/design.md after each round so Codex reads latest version.
14. **Require structured output** — If Codex doesn't use ISSUE-{N} format, ask to reformat in resume prompt.
15. **Stop background tasks after each round** — Drain with `TaskOutput`, terminate with `TaskStop`.
16. **OpenSpec artifact priority** — tasks.md is the primary review target, but design.md and specs/ provide crucial context for validating completeness.

## Error Handling

- If no active OpenSpec change exists → inform user, suggest running `npx openspec new change <name>` first.
- If `tasks.md` is missing → inform user, suggest completing the OpenSpec flow first.
- If Codex background process errors → read stderr file, report to user.
- If Codex stalls → ask user to wait or abort.
- If debate stalls (same points 2 rounds) → present to user for decision.
- If `TaskOutput`/`TaskStop` errors on cleanup → safe to ignore.
