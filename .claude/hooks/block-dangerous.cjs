#!/usr/bin/env node
let raw = ''
process.stdin.on('data', (c) => (raw += c))
process.stdin.on('end', () => {
  let command = ''
  try {
    const input = JSON.parse(raw)
    command = String(input?.tool_input?.command ?? '')
  } catch {
    process.exit(0)
  }

  const decide = (permissionDecision, permissionDecisionReason) => {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason },
      }),
    )
    process.exit(0)
  }

  if (/supabase\s+(db\s+reset|reset)/i.test(command)) {
    decide('deny', 'CHẶN TUYỆT ĐỐI: "supabase db reset" xóa toàn bộ dữ liệu. Dùng migration để thay đổi schema.')
  }

  const askPatterns = [
    [/\bDELETE\s+FROM\b/i, 'Lệnh DELETE FROM xóa dữ liệu — dự án chỉ cho phép soft-delete. Cần user xác nhận rõ ràng.'],
    [/\bTRUNCATE\b/i, 'Lệnh TRUNCATE xóa toàn bộ dữ liệu bảng. Cần user xác nhận rõ ràng.'],
    [/\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX|CONSTRAINT)\b/i, 'Lệnh DROP phá hủy schema/dữ liệu. Cần user xác nhận rõ ràng.'],
    [/git\s+push\s+[^|;&]*(\s-f\b|--force\b)/i, 'git push --force ghi đè lịch sử commit. Cần user xác nhận rõ ràng.'],
    [/rm\s+-rf?\s|Remove-Item\s+[^|;&]*-Recurse/i, 'Lệnh xóa file đệ quy. Cần user xác nhận rõ ràng.'],
  ]

  for (const [pattern, reason] of askPatterns) {
    if (pattern.test(command)) decide('ask', reason)
  }

  process.exit(0)
})
