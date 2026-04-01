# Plan Complete Auto-Compact Hook

## Overview

PostToolUse hook that detects when a Superpowers plan is saved to `docs/superpowers/plans/*.md` and automatically schedules `/compact` to free context window before implementation begins.

## Motivation

After brainstorming + writing-plans workflow, context window is typically heavily consumed. Manual compact is easy to forget. Auto-compact ensures clean context for the next phase (executing-plans / subagent-driven-development).

## Hook Specification

### Registration (settings.json)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/plan-complete-auto-compact.cjs",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### Input (stdin JSON)

Standard PostToolUse payload from Claude Code:

```json
{
  "session_id": "abc123",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "D:/project/docs/superpowers/plans/2026-04-01-my-feature.md",
    "content": "..."
  },
  "tool_response": {
    "filePath": "...",
    "success": true
  }
}
```

### Path Matching

| Match | Pattern | Example |
|-------|---------|---------|
| Include | `/docs/superpowers/plans/` + `.md` extension | `docs/superpowers/plans/2026-04-01-feature.md` |
| Exclude | `-design.md` suffix | `docs/superpowers/specs/2026-04-01-feature-design.md` |

Path normalization: Windows backslashes (`\`) converted to forward slashes (`/`) before matching.

### Output (stdout JSON)

PostToolUse hooks require JSON output to inject context into Claude (plain stdout only shows in transcript mode, not fed to Claude):

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "PLAN SAVED: 2026-04-01-my-feature.md\nMANDATORY — Schedule /compact via CronCreate for next idle minute.\nCronCreate({ cron: \"MM HH * * *\", prompt: \"/compact\", recurring: false })\nPlan xong. Compact de giai phong context truoc khi implement."
  }
}
```

### Deduplication

Plans may be written multiple times (edits, re-saves). Use tmp flag file:

- **Flag path:** `{os.tmpdir()}/ck-plan-compact-{session_id}`
- **First write:** Create flag, output JSON instruction
- **Subsequent writes:** Flag exists, exit 0 silently
- **Reset:** Flag auto-cleared when OS cleans tmp, or on new session

### Error Handling

- All errors caught and silently swallowed (fail-open)
- Crash logged to `.claude/hooks/.logs/hook-log.jsonl`
- Exit code always 0 (never blocks)

### Config Integration

- Respects `isHookEnabled('plan-complete-auto-compact')` from `ck-config-utils.cjs`
- Can be disabled via `.claude/.ck.json`: `{ "hooks": { "plan-complete-auto-compact": false } }`

## Files

| File | Action |
|------|--------|
| `.claude/hooks/plan-complete-auto-compact.cjs` | Create — hook implementation |
| `.claude/settings.json` | Edit — add PostToolUse entry |

## Non-Goals

- Does NOT handle ClaudeKit plans (`plans/*/plan.md`) — separate system with `cook-after-plan-reminder.cjs`
- Does NOT check context % — always compacts (plan workflow is inherently context-heavy)
- Does NOT compact directly — schedules via CronCreate for next idle minute
