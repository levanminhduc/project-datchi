---
name: codex-impl-review
description: Have Codex CLI (GPT) review uncommitted code changes after /spx-apply. Claude Code fixes valid issues and rebuts invalid ones. Codex re-reviews. Repeat until consensus. Codex never touches code — it only reviews. (OpenSpec Integration)
---

# Codex Implementation Review — Skill Guide (OpenSpec Integration)

## Overview
This skill sends uncommitted changes to Codex CLI for **review only** after `/spx-apply` implementation. Codex reads the diff + OpenSpec artifacts, finds bugs/edge cases/security issues, and reports back. Claude Code fixes valid issues, pushes back on invalid ones, then sends updated code back for re-review. Repeats until consensus.

**Codex NEVER modifies code.** It only reads and reviews. All fixes are done by Claude Code.

**Flow:** `/spx-apply` done → Codex reads diff + OpenSpec artifacts → Codex reviews → Claude Code fixes & rebuts → Codex re-reviews → ... → Consensus → `/spx-verify` → commit → `/spx-archive`

## Prerequisites
- There must be uncommitted changes (staged or unstaged) in the working directory (typically after `/spx-apply`).
- The Codex CLI (`codex`) must be installed and available in PATH.
- OpenAI API key configured for Codex.

### Codex CLI Pre-Check
Before starting the review, verify Codex is available:
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

## Step 0: Identify OpenSpec Context

1. Run `npx openspec list` to find the active change that was just implemented.
2. Note the paths to all available artifacts:
   - `openspec/changes/<change-name>/tasks.md`
   - `openspec/changes/<change-name>/design.md`
   - `openspec/changes/<change-name>/proposal.md`
   - Each individual spec file — run `find openspec/changes/<change-name>/specs -name "*.md" -type f` to get the full list
3. These provide Codex with the **implementation intent** — what the code changes are supposed to achieve.
4. **List every spec file explicitly in the prompt** — do NOT just give the `specs/` directory path. Codex may miss files if only given a directory.
5. If no OpenSpec change found → proceed without artifacts but warn that review quality is reduced.

## Step 1: Gather Configuration

Ask the user (via `AskUserQuestion`) **only one question**:
- Which reasoning effort to use (`xhigh`, `high`, `medium`, or `low`)

**Do NOT ask** which model to use — always use Codex's default model (no `-m` flag).
**Do NOT ask** how many rounds — the loop runs automatically until consensus.

## Step 2: Collect Uncommitted Changes

1. Run `git status --porcelain` to detect ALL changes including untracked (new) files.
2. If there are no changes at all, inform the user and stop.
3. **Detect if HEAD exists** — run `git rev-parse --verify HEAD 2>/dev/null`. If it fails (exit code non-zero), this is a fresh repo with no commits. Use `git diff --cached` and `git diff --cached --stat` (to capture staged changes) **plus** `git diff` and `git diff --stat` (to capture unstaged changes). If HEAD exists, use `git diff HEAD` and `git diff --stat HEAD` as normal (which covers both staged and unstaged).
4. **Stage untracked files for diffing** — if there are untracked files (`??` in porcelain output), run `git add -N <file>` (intent-to-add) for each one so they appear in git diff. This does NOT actually stage the files for commit — it only makes them visible to diff.
5. Run the appropriate `git diff --stat` command (with or without `HEAD` per step 3) to get a summary of all changed files.
6. If the number of changed files is very large, ask the user which files to focus on, or split into multiple review sessions.

## Prompt Construction Principle

**Only include in the Codex prompt what Codex cannot access on its own:**
- Paths to OpenSpec artifact files (so Codex can cross-reference implementation intent)
- The user's original request / task description
- Important context from the conversation: user comments, constraints, preferences, architectural decisions discussed verbally
- Clarifications or special instructions the user gave
- Which specific files to focus on (if the user specified)

**Do NOT include:**
- The diff content (Codex runs `git diff HEAD` itself)
- File contents (Codex reads files itself)
- Code snippets Codex can read from the repo
- Information Codex can derive by reading files

## Step 3: Send Changes to Codex for Review (Round 1)

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
- stdout starts with `POLL:running:` → Codex is still working. The stderr output shows progress events like `[45s] Codex running: git diff HEAD`. Call poll again — use `sleep 30` for the second poll, then `sleep 15` for all subsequent polls.
- stdout starts with `POLL:completed:` → Extract thread_id from the `THREAD_ID:` line. Read the review from `<STATE_DIR>/review.txt` using the Read tool. Proceed to Step 3c.
- stdout starts with `POLL:failed:` or `POLL:timeout:` or `POLL:stalled:` → Handle per Error Handling section. Call `stop` to cleanup.

**Progress reporting**: The stderr output from the Bash tool call shows progress events (e.g., `[45s] Codex is thinking...`, `[52s] Codex running: git diff HEAD`). Summarize these for the user between polls.

### Step 3c — Cleanup

After extracting the completed result (or handling an error):

```bash
"$RUNNER" stop <STATE_DIR>
```

This kills any remaining processes and removes the state directory.

Save the `thread_id` from the `THREAD_ID:` line — you will need it for subsequent rounds.

### Review Prompt Template

```
You are participating in a code review with Claude Code (Claude Opus 4.6).

## Your Role
You are the CODE REVIEWER. You review ONLY — you do NOT modify any code. Your job is to inspect uncommitted changes for a Vietnamese-language Thread Inventory Management System (garment industry). Find bugs, missing edge cases, error handling gaps, security vulnerabilities, and code quality issues. Be thorough, specific, and constructive. Claude Code will handle all fixes.

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

## How to Inspect Changes
1. Run `git status --porcelain` to see all changes including untracked files.
2. Check if HEAD exists: `git rev-parse --verify HEAD 2>/dev/null`. If it fails, use `git diff --cached --stat` and `git diff --cached` (for staged changes) plus `git diff --stat` and `git diff` (for unstaged changes). If it succeeds, use `git diff --stat HEAD` and `git diff HEAD`.
3. Run the appropriate git diff command to see the full diff. (Note: untracked files have already been marked with `git add -N` so they appear in the diff.)
4. Read any relevant source files for additional context if needed.

## OpenSpec Artifacts — Read These for Implementation Intent
1. **Tasks (implementation plan)**: <ABSOLUTE_PATH_TO_TASKS_MD>
2. **Design (architecture decisions)**: <ABSOLUTE_PATH_TO_DESIGN_MD>
3. **Proposal (why + what)**: <ABSOLUTE_PATH_TO_PROPOSAL_MD>
4. **Specs** (read ALL — each file is a separate capability/requirement):
   - <ABSOLUTE_PATH_TO_SPEC_FILE_1>
   - <ABSOLUTE_PATH_TO_SPEC_FILE_2>
   - ... (list every .md file found in specs/ directory)

Cross-reference the diff against ALL artifacts above to verify the implementation matches the plan. Do NOT skip any spec file.

(If no OpenSpec artifacts exist, write: "No OpenSpec artifacts available — review the diff based on code quality and project conventions alone.")

## User's Original Request
<The user's original task/request>

## Session Context
<Any important context from the conversation that Codex cannot access on its own>

(If there is no additional context, write "No additional context.")

## Instructions
1. Read the diff using the git commands above.
2. Read the OpenSpec artifact files to understand what these changes are supposed to achieve.
3. Cross-reference: does the implementation match the plan? Are there deviations?
4. Check project conventions listed above are followed.
5. Analyze every changed file and produce your review in the EXACT format below.

## Required Output Format

For each issue found, use this structure:

### ISSUE-{N}: {Short title}
- **Category**: Bug | Edge Case | Error Handling | Security | Code Quality | Plan Deviation | Convention Violation | Performance | Type Safety | Architecture Violation
- **Severity**: CRITICAL | HIGH | MEDIUM | LOW
- **File**: `{file_path}:{line_number or line_range}`
- **Description**: What the problem is, in detail.
- **Why It Matters**: Concrete scenario or example showing how this causes a real failure.
- **Suggested Fix**: Specific code change or approach to fix this. (Required for CRITICAL and HIGH severity. Recommended for others.)

After all issues, provide:

### VERDICT
- **Result**: REJECT | APPROVE_WITH_CHANGES | APPROVE
- **Summary**: 2-3 sentence overall assessment.
- **Plan Alignment**: Does the implementation correctly follow the OpenSpec tasks? Note any deviations.
- **Convention Compliance**: Are project conventions (CLAUDE.md) followed? Note violations.

Severity-to-Verdict mapping:
- Any CRITICAL issue → REJECT
- Only HIGH/MEDIUM issues → APPROVE_WITH_CHANGES
- Only LOW issues or no issues → APPROVE

Rules:
- Reference exact files and line numbers/hunks in the diff.
- Explain WHY each issue is a problem with a concrete scenario.
- Do NOT rubber-stamp the code. Your value comes from finding real problems.
- Do NOT nitpick style or formatting unless it causes actual issues.
- Do NOT attempt to fix or modify any files. Report issues only.
- Every CRITICAL or HIGH severity issue MUST have a Suggested Fix.
- Pay special attention to:
  - Hono route ordering (specific routes before generic /:id)
  - Supabase column names matching actual schema
  - fetchApi usage (not raw fetch)
  - AppInput/AppSelect/AppButton usage (not q-*)
  - Vietnamese messages for user-facing text
  - Soft delete patterns (deleted_at)
  - FEFO allocation logic correctness
  - Dual UoM consistency (kg + meters)
- Maximum 5 rounds. If no consensus after 5 rounds → present final state to user for decision.
```

**After receiving Codex's review**, summarize the findings for the user, grouped by severity.

## Step 4: Claude Code Responds (Round 1)

After receiving Codex's review, you (Claude Code) must:

1. **Analyze each ISSUE-{N}** against the actual code.
2. **Fix valid issues** - If Codex found real bugs, edge cases, or security issues:
   - Apply the fixes directly to the code files using Edit tool.
   - Keep fixes minimal and focused — don't refactor surrounding code.
3. **Push back on invalid points** - If Codex flagged something incorrectly:
   - Explain why it's not actually a problem (e.g., the edge case is handled upstream, the framework guarantees safety, etc.)
   - Use evidence: read the relevant code, check documentation, web search if needed.
4. **Summarize for the user**: What you fixed, what you disputed, and why.
5. **Immediately proceed to Step 5** — do NOT ask the user whether to continue. Always send the updated code back to Codex for re-review.

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
This is Claude Code (Claude Opus 4.6) responding to your review. I have applied fixes and want you to re-review.

## Issues Fixed
<For each fixed issue, reference by ISSUE-{N} and describe the specific change made>

## Issues Disputed
<For each disputed issue, reference by ISSUE-{N} and explain why with evidence>

## Your Turn
Run `git diff HEAD` again to see the updated changes (or `git diff --cached` plus `git diff` if this is a fresh repo with no commits), then re-review.
- Have your previous concerns been properly addressed?
- Do the fixes introduce any NEW issues?
- Are there any remaining problems you still see?

Use the same output format as before (ISSUE-{N} structure + VERDICT).
Verdict options: REJECT | APPROVE_WITH_CHANGES | APPROVE
```

**After each Codex response:**
1. Summarize Codex's response for the user.
2. If verdict is `APPROVE` → proceed to Step 6.
3. If verdict is `APPROVE_WITH_CHANGES` → evaluate suggestions, apply if valid, then **automatically** send one more round to Codex for confirmation. Do NOT ask the user.
4. If verdict is `REJECT` → fix remaining issues and **automatically** continue to next round. Do NOT ask the user.

**IMPORTANT**: The debate loop is fully automatic. After fixing issues, ALWAYS send the updated code back to Codex without asking the user. The loop only stops when Codex returns `APPROVE`. The user is only consulted at the very end (Step 6) or if a stalemate is detected.

### Early Termination & Round Extension

- **Early termination**: If Codex returns `APPROVE`, end the debate immediately and proceed to Step 6.
- **Max round limit**: The debate runs for a maximum of **5 rounds**. After 5 rounds without `APPROVE`, present the current state to the user and let them decide whether to continue, accept as-is, or review manually.
- **Stalemate detection**: If the same points go back and forth without progress for 2 consecutive rounds, present the disagreement to the user and let them decide (even if under 5 rounds).

**Repeat** Steps 4-5 until consensus or stalemate.

## Step 6: Finalize and Report

Present the user with a **Code Review Debate Summary**:

```
## Code Review Debate Summary

### Change: <change-name>
### Rounds: X
### Final Verdict: [CONSENSUS REACHED / STALEMATE - USER DECISION NEEDED]

### Bugs Fixed:
1. [Bug description - file:line]
...

### Edge Cases Added:
1. [Edge case - file:line]
...

### Error Handling Improved:
1. [What was added - file:line]
...

### Security Issues Resolved:
1. [Issue - file:line]
...

### Convention Violations Fixed:
1. [Violation - file:line]
...

### Plan Deviations Found:
1. [Deviation - context]
...

### Disputed Points (Claude's position maintained):
1. [Point - reasoning]
...

### Remaining Concerns (if stalemate):
1. [Unresolved issue - context]
...
```

Then ask the user (via `AskUserQuestion`):
- **Accept & proceed to /spx-verify** — Code is ready for verification
- **Request more rounds** — Continue debating specific concerns
- **Review changes manually** — User wants to inspect the fixes themselves before deciding

## Important Rules

1. **Codex reads the diff and files itself** - Do NOT paste diff content or file contents into the prompt. Just give Codex the file paths and instruct it to run `git diff`.
2. **Only send what Codex can't access** - The prompt should contain: file paths, user's original request, session context. NOT: diffs, file contents, code snippets.
3. **Always `git add -N` untracked files first** - So new files appear in `git diff`.
4. **Always use heredoc (`<<'EOF'`) for prompts** - Heredoc with single-quoted delimiter prevents shell expansion.
5. **Always provide OpenSpec artifact paths** - So Codex can cross-reference implementation against intent. If no OpenSpec artifacts exist, explicitly state that.
6. **Always `--sandbox read-only`** - Codex only reads, never writes.
7. **Always `-C <PROJECT_DIR>`** - Correct project directory.
8. **Always `--skip-git-repo-check`** - Required for Codex CLI.
9. **Redirect stderr to file** - `2>"$ERR"`, never `/dev/null`.
10. **No `-m` flag** - Always use Codex's default model.
11. **Use absolute paths for temp files** - Shell variables don't persist.
12. **Resume by thread ID** - Use the `thread_id` from the `THREAD_ID:` line of poll completed output for subsequent rounds.
13. **Handle repos with no HEAD** - Before running `git diff HEAD`, check `git rev-parse --verify HEAD`. If HEAD doesn't exist, use `git diff --cached` + `git diff` instead.
14. **Claude Code does all the fixing** - Codex identifies issues, Claude Code applies fixes.
15. **Be genuinely adversarial** - Don't blindly accept all of Codex's findings. Push back with evidence when Codex is wrong.
16. **Don't over-fix** - Only fix what's actually broken or risky. Don't add defensive code for impossible scenarios.
17. **Summarize after every round** - The user should always know what happened before the next round begins.
18. **Respect the diff boundary** - Only review and fix code within the uncommitted changes.
19. **Require structured output** - If Codex's response doesn't follow the ISSUE-{N} format, ask it to reformat in the resume prompt.
20. **Always call `stop` after getting results** - Clean up the state directory after extracting the completed result or handling errors.
21. **Check CLAUDE.md conventions** - Codex prompt includes project conventions so it can flag violations.
22. **OpenSpec cross-reference** - Codex should verify implementation matches tasks.md plan.

## Error Handling

- If `git status --porcelain` shows no changes, inform the user and stop.
- If `git rev-parse --verify HEAD` fails, use `git diff --cached` + `git diff` instead of `git diff HEAD`.
- If poll returns `POLL:timeout:`, inform the user and ask if they want to retry. Call `stop` to cleanup.
- If poll returns `POLL:failed:`, report the error message to the user. Call `stop` to cleanup.
- If poll returns `POLL:stalled:`, ask the user whether to retry or abort. Call `stop` to cleanup.
- If the `start` command exits with code `5` (codex not found), tell the user to install the Codex CLI.
- If the diff is too large for a single prompt, suggest splitting by file or directory.
- If the debate stalls on a point, present both positions to the user and let them decide.
- No OpenSpec change found → proceed without artifacts but warn that review quality is reduced.
