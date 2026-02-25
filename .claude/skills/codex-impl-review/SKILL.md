---
name: codex-impl-review
description: Have Codex CLI (GPT) review uncommitted code changes after /spx-apply. Claude Code fixes valid issues and rebuts invalid ones. Codex re-reviews. Repeat until consensus. Codex never touches code — it only reviews.
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

## Step 0: Identify OpenSpec Context

1. Run `npx openspec list` to find the active change that was just implemented.
2. Note the paths to all available artifacts:
   - `openspec/changes/<change-name>/tasks.md`
   - `openspec/changes/<change-name>/design.md`
   - `openspec/changes/<change-name>/proposal.md`
   - Each individual spec file — run `find openspec/changes/<change-name>/specs -name "*.md" -type f` to get the full list
3. These provide Codex with the **implementation intent** — what the code changes are supposed to achieve.
4. **List every spec file explicitly in the prompt** — do NOT just give the `specs/` directory path. Codex may miss files if only given a directory.

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

Codex runs in background — no hardcoded timeout needed. Claude Code polls the JSONL output file periodically and reports progress.

### Polling Loop

1. Launch Codex with `run_in_background: true`. Save `task_id` and absolute JSONL path.
2. **Every ~60 seconds**, poll:
   ```bash
   sleep 60 && tail -20 "$CODEX_OUTPUT"
   ```
3. Report short progress updates to user.
4. `turn.completed` → extract review.
5. `turn.failed` → extract `error.message`, report, stop.
6. Process failure → read stderr, report.

### Stall Detection

3 consecutive polls with no new lines → ask user: **Wait longer** or **Abort and retry**.

## Step 2: Collect Uncommitted Changes

1. Run `git status --porcelain` to detect ALL changes including untracked files.
2. If no changes at all → inform user and stop.
3. **Detect if HEAD exists** — run `git rev-parse --verify HEAD 2>/dev/null`. If fails (fresh repo), use `git diff --cached` + `git diff`. If HEAD exists, use `git diff HEAD`.
4. **Stage untracked files for diffing** — if untracked files (`??` in porcelain), run `git add -N <file>` for each so they appear in diff.
5. Run appropriate `git diff --stat` to get summary of all changed files.
6. If very large number of files → ask user which files to focus on.

## Prompt Construction Principle

**Only include what Codex cannot access on its own:**
- Paths to OpenSpec artifact files (so Codex can cross-reference implementation intent)
- The user's original request / task description
- Session context: user comments, constraints, preferences
- Project conventions relevant to the review

**Do NOT include:**
- Diff content (Codex runs `git diff HEAD` itself)
- File contents (Codex reads files itself)

## Step 3: Send Changes to Codex for Review (Round 1)

Run Codex in background with `--json` output. Use Bash tool with `run_in_background: true`:

```bash
TMPDIR="${TMPDIR:-${TMP:-/tmp}}" && RUN_ID=$(date +%s)-$$ && CODEX_OUTPUT="$TMPDIR/codex-review-$RUN_ID.jsonl" && CODEX_ERR="$TMPDIR/codex-review-$RUN_ID.err" && echo "$CODEX_OUTPUT $CODEX_ERR" && codex exec --skip-git-repo-check --json --sandbox read-only --config model_reasoning_effort="<EFFORT>" -C <PROJECT_DIR> 2>"$CODEX_ERR" <<'EOF' > "$CODEX_OUTPUT"
<PROMPT>
EOF
```

**IMPORTANT**: Save `task_id`, absolute JSONL path, absolute ERR path. Save `thread_id` from first `thread.started` event for resuming.

The `<PROMPT>` must follow this structure:

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
1. Run `git status --porcelain` to see all changes.
2. Check if HEAD exists: `git rev-parse --verify HEAD 2>/dev/null`. If fails, use `git diff --cached --stat` + `git diff --cached` (staged) plus `git diff --stat` + `git diff` (unstaged). If succeeds, use `git diff --stat HEAD` + `git diff HEAD`.
3. Run the appropriate git diff command to see the full diff.
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

## User's Original Request
<DESCRIPTION>

## Session Context
<CONTEXT_OR_"No additional context.">

## Instructions
1. Read the diff using the git commands above.
2. Read the OpenSpec artifact files to understand what these changes are supposed to achieve.
3. Cross-reference: does the implementation match the plan? Are there deviations?
4. Check project conventions listed above are followed.
5. Analyze every changed file and produce your review in the EXACT format below.

## Required Output Format

For each issue found, use this structure:

### ISSUE-{N}: {Short title}
- **Category**: Bug | Edge Case | Error Handling | Security | Code Quality | Plan Deviation | Convention Violation
- **Severity**: CRITICAL | HIGH | MEDIUM | LOW
- **File**: `{file_path}:{line_number or line_range}`
- **Description**: What the problem is, in detail.
- **Why It Matters**: Concrete scenario or example showing how this causes a real failure.
- **Suggested Fix**: Specific code change or approach to fix this. (Required for CRITICAL and HIGH.)

After all issues, provide:

### VERDICT
- **Result**: REJECT | APPROVE_WITH_CHANGES | APPROVE
- **Summary**: 2-3 sentence overall assessment.
- **Plan Alignment**: Does the implementation correctly follow the OpenSpec tasks? Note any deviations.
- **Convention Compliance**: Are project conventions (CLAUDE.md) followed? Note violations.

Rules:
- Reference exact files and line numbers from the diff.
- Explain WHY each issue is a problem with a concrete scenario.
- Do NOT rubber-stamp. Your value comes from finding real problems.
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
- Severity-to-verdict mapping: any CRITICAL → REJECT, any HIGH or MEDIUM → APPROVE_WITH_CHANGES, only LOW → APPROVE.
- Maximum 5 rounds. If no consensus after 5 rounds → present final state to user for decision.
```

**After receiving Codex's review**, summarize findings grouped by severity.

### Extracting the final review

```bash
grep '"type":"agent_message"' "$CODEX_OUTPUT" | tail -1 | python -c "import sys,json; print(json.loads(sys.stdin.read())['item']['text'])"
```

### Cleanup after extraction

1. `TaskOutput(task_id, block: false)` then `TaskStop(task_id)`.
2. `rm -f "$CODEX_OUTPUT" "$CODEX_ERR"`

## Step 4: Claude Code Responds (Round 1)

After receiving Codex's review:

1. **Analyze each ISSUE-{N}** against the actual code.
2. **Fix valid issues** — Apply fixes directly using Edit tool. Keep fixes minimal and focused.
3. **Push back on invalid points** — Explain with evidence (read code, check docs, CLAUDE.md conventions).
4. **Summarize** for user: what you fixed, what you disputed, and why.
5. **Immediately proceed to Step 5** — do NOT ask the user whether to continue.

## Step 5: Continue the Debate (Rounds 2+)

Resume using **saved `thread_id`**:

```bash
TMPDIR="${TMPDIR:-${TMP:-/tmp}}" && RUN_ID=$(date +%s)-$$ && CODEX_OUTPUT="$TMPDIR/codex-review-$RUN_ID.jsonl" && CODEX_ERR="$TMPDIR/codex-review-$RUN_ID.err" && echo "$CODEX_OUTPUT $CODEX_ERR" && codex exec --skip-git-repo-check --json --sandbox read-only -C <PROJECT_DIR> resume <THREAD_ID> 2>"$CODEX_ERR" <<'EOF' > "$CODEX_OUTPUT"
<REBUTTAL_PROMPT>
EOF
```

The `<REBUTTAL_PROMPT>`:

```
This is Claude Code (Claude Opus 4.6) responding to your review. I have applied fixes and want you to re-review.

## Issues Fixed
<List fixed issues with what was changed>

## Issues Disputed
<List disputed issues with evidence>

## Your Turn
Run `git diff HEAD` again (or `git diff --cached` + `git diff` if fresh repo) to see updated changes, then re-review.
- Have your previous concerns been properly addressed?
- Do the fixes introduce any NEW issues?
- Are there any remaining problems?

Use the same output format as before (ISSUE-{N} structure + VERDICT).
Verdict options: REJECT | APPROVE_WITH_CHANGES | APPROVE
```

**After each Codex response:**
1. Summarize for user.
2. `APPROVE` → Step 6.
3. `APPROVE_WITH_CHANGES` → evaluate, apply if valid, auto-send one more round.
4. `REJECT` → fix remaining, auto-continue.

### Stalemate Detection
Same points for 2 consecutive rounds → present to user for decision.

## Step 6: Finalize and Report

```
## Code Review Debate Summary

### Change: <change-name>
### Rounds: X
### Final Verdict: [CONSENSUS REACHED / STALEMATE - USER DECISION NEEDED]

### Bugs Fixed:
1. [Bug - file:line]
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
```

Then ask user (via `AskUserQuestion`):
- **Accept & proceed to /spx-verify** — Code is ready for verification
- **Request more rounds** — Continue debating specific concerns
- **Review changes manually** — User wants to inspect fixes themselves

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

1. **Codex reads diff and files itself** — Do NOT paste content into prompts. Just give paths and instruct `git diff`.
2. **Only send what Codex can't access** — Paths, user request, session context. NOT diffs or file contents.
3. **Always `git add -N` untracked files first** — So new files appear in diff.
4. **Always heredoc (`<<'EOF'`)** — Prevents shell expansion.
5. **Always provide OpenSpec artifact paths** — So Codex can cross-reference implementation against intent.
6. **Always `--sandbox read-only`** — Codex only reads, never writes.
7. **Always `-C <PROJECT_DIR>`** — Correct project directory.
8. **Always `--skip-git-repo-check`** — Required for Codex CLI.
9. **Redirect stderr to file** — `2>"$ERR"`, never `/dev/null`.
10. **No `-m` flag** — Use Codex's default model.
11. **Use absolute paths for temp files** — Shell variables don't persist.
12. **Resume by thread ID, not `--last`** — Avoid wrong session.
13. **Handle repos with no HEAD** — Check `git rev-parse --verify HEAD` first.
14. **Claude Code does all fixing** — Codex identifies, Claude fixes.
15. **Be genuinely adversarial** — Push back on false positives with evidence.
16. **Don't over-fix** — Only fix what's broken. Don't refactor unrelated code.
17. **Summarize after every round** — User must know what happened.
18. **Respect diff boundary** — Only review/fix code within uncommitted changes.
19. **Require structured output** — If Codex doesn't use ISSUE-{N} format, ask to reformat.
20. **Stop background tasks after each round** — Drain + terminate.
21. **Check CLAUDE.md conventions** — Codex prompt includes project conventions so it can flag violations.
22. **OpenSpec cross-reference** — Codex should verify implementation matches tasks.md plan.

## Error Handling

- No uncommitted changes → inform user, stop.
- Fresh repo (no HEAD) → use `git diff --cached` + `git diff`.
- Codex process error → read stderr, report.
- Codex stalls → ask user to wait or abort.
- Diff too large → suggest splitting by file/directory.
- Debate stalls → present both positions to user.
- `TaskOutput`/`TaskStop` errors → safe to ignore.
- No OpenSpec change found → proceed without artifacts but warn that review quality is reduced.
