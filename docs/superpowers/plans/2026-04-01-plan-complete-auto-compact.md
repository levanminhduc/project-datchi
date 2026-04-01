# Plan Complete Auto-Compact Hook Implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PostToolUse hook that auto-schedules `/compact` when a Superpowers plan file is written to `docs/superpowers/plans/*.md`.

**Architecture:** Single CJS hook file following existing patterns (`auto-compact.cjs`, `post-edit-simplify-reminder.cjs`). Uses JSON stdout with `additionalContext` to inject CronCreate instruction into Claude's context. Dedup via tmp flag file per session.

**Tech Stack:** Node.js (CJS), Claude Code hooks API

**Spec:** `docs/superpowers/specs/2026-04-01-plan-complete-auto-compact-design.md`

---

### Task 1: Create hook file

**Files:**
- Create: `.claude/hooks/plan-complete-auto-compact.cjs`

**Reference patterns:**
- `.claude/hooks/auto-compact.cjs` — CronCreate scheduling, cron time calculation
- `.claude/hooks/post-edit-simplify-reminder.cjs` — PostToolUse JSON output format (`{ continue: true, additionalContext }`)
- `.claude/hooks/cook-after-plan-reminder.cjs` — crash wrapper, logging pattern

- [ ] **Step 1: Create the hook file**

```javascript
#!/usr/bin/env node
/**
 * Plan Complete Auto-Compact — PostToolUse(Write)
 *
 * Detects when a Superpowers plan is saved to docs/superpowers/plans/*.md.
 * Injects MANDATORY CronCreate instruction so Claude schedules /compact
 * for the next idle minute, freeing context before implementation.
 *
 * Dedup: tmp flag file prevents re-triggering on plan re-saves within same session.
 * Output: JSON { continue: true, additionalContext } (PostToolUse pattern).
 * Exit: Always 0 (fail-open).
 */

try {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

  if (!isHookEnabled('plan-complete-auto-compact')) {
    process.exit(0);
  }

  let inputStr = '';
  try { inputStr = fs.readFileSync(0, 'utf-8'); } catch {}
  const payload = JSON.parse(inputStr || '{}');

  const filePath = (payload.tool_input || {}).file_path || '';
  const normalized = filePath.replace(/\\/g, '/');

  const isPlanFile = /\/docs\/superpowers\/plans\/.*\.md$/.test(normalized);
  const isDesignFile = /-design\.md$/.test(normalized);

  if (!isPlanFile || isDesignFile) {
    process.exit(0);
  }

  const sessionId = payload.session_id || process.env.CK_SESSION_ID || null;
  if (!sessionId) {
    process.exit(0);
  }

  const flagPath = path.join(os.tmpdir(), `ck-plan-compact-${sessionId}`);
  if (fs.existsSync(flagPath)) {
    process.exit(0);
  }

  fs.writeFileSync(flagPath, Date.now().toString());

  const fileName = path.basename(normalized);
  const now = new Date();
  const cronMin = (now.getMinutes() + 1) % 60;
  const cronHour = now.getMinutes() + 1 >= 60
    ? (now.getHours() + 1) % 24
    : now.getHours();

  console.log(JSON.stringify({
    continue: true,
    additionalContext: [
      `📋 PLAN SAVED: ${fileName}`,
      `MANDATORY — sau khi hoàn thành response hiện tại, bạn PHẢI gọi CronCreate:`,
      `  CronCreate({ cron: "${cronMin} ${cronHour} * * *", prompt: "/compact", recurring: false })`,
      `Plan đã lưu xong. Compact để giải phóng context trước khi implement.`
    ].join('\n')
  }));

  process.exit(0);

} catch (e) {
  try {
    const fs = require('fs');
    const p = require('path');
    const logDir = p.join(__dirname, '.logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(p.join(logDir, 'hook-log.jsonl'),
      JSON.stringify({ ts: new Date().toISOString(), hook: 'plan-complete-auto-compact', status: 'crash', error: e.message }) + '\n');
  } catch (_) {}
  process.exit(0);
}
```

- [ ] **Step 2: Verify file created**

Run: `node -c .claude/hooks/plan-complete-auto-compact.cjs`
Expected: No output (syntax valid)

- [ ] **Step 3: Commit**

```bash
git add .claude/hooks/plan-complete-auto-compact.cjs
git commit -m "feat: add plan-complete-auto-compact hook"
```

---

### Task 2: Register hook in settings.json

**Files:**
- Modify: `.claude/settings.json` — add new PostToolUse matcher entry

- [ ] **Step 1: Add PostToolUse entry to settings.json**

In `.claude/settings.json`, inside `"PostToolUse": [...]`, add a new matcher block **before** the existing `"Edit|Write|MultiEdit"` entry (line ~103). The new entry targets only `Write` (plans are written, not edited):

```json
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
```

The PostToolUse array after edit should have this new entry as the first item, before the existing `post-edit-simplify-reminder` entry.

- [ ] **Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8')); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add .claude/settings.json
git commit -m "feat: register plan-complete-auto-compact hook in settings"
```

---

### Task 3: Manual verification

- [ ] **Step 1: Simulate hook with test input**

Run:
```bash
echo '{"session_id":"test-123","hook_event_name":"PostToolUse","tool_name":"Write","tool_input":{"file_path":"D:/project/docs/superpowers/plans/2026-04-01-test-feature.md","content":"test"}}' | node .claude/hooks/plan-complete-auto-compact.cjs
```

Expected: JSON output with `additionalContext` containing `PLAN SAVED: 2026-04-01-test-feature.md` and CronCreate instruction.

- [ ] **Step 2: Verify dedup — run same command again**

Run the same command again.
Expected: No output (flag file already exists from step 1).

- [ ] **Step 3: Verify non-plan paths are ignored**

Run:
```bash
echo '{"session_id":"test-456","hook_event_name":"PostToolUse","tool_name":"Write","tool_input":{"file_path":"src/pages/index.vue","content":"test"}}' | node .claude/hooks/plan-complete-auto-compact.cjs
```

Expected: No output (path doesn't match plan pattern).

- [ ] **Step 4: Verify design files are excluded**

Run:
```bash
echo '{"session_id":"test-789","hook_event_name":"PostToolUse","tool_name":"Write","tool_input":{"file_path":"docs/superpowers/specs/2026-04-01-test-design.md","content":"test"}}' | node .claude/hooks/plan-complete-auto-compact.cjs
```

Expected: No output (specs path doesn't match, and `-design.md` excluded).

- [ ] **Step 5: Clean up test flag files**

Run:
```bash
rm -f /tmp/ck-plan-compact-test-123 /tmp/ck-plan-compact-test-456 /tmp/ck-plan-compact-test-789
```

- [ ] **Step 6: Commit verification results (if any fixes made)**

Only if fixes were needed during verification.
