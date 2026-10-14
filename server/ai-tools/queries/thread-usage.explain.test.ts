import assert from 'node:assert/strict'
import { pool } from '../../db/pool'
import { THREAD_USAGE_SQL } from './thread-usage'

async function main() {
  try {
    for (const [name, sql] of Object.entries(THREAD_USAGE_SQL)) {
      for (const params of [['%C9700%', null], ['%C9700%', '40']]) {
        const result = await pool.query(`EXPLAIN ${sql}`, params)
        assert.ok(result.rows.length > 0, `${name} phải có kế hoạch truy vấn`)
      }
    }
    const cases: Array<[string, string, boolean]> = [
      ['#50 (28/2) Tex 40', '40', true],
      ['Resilon 40', '40', true],
      ['40', '40', true],
      ['40/2', '40', false],
      ['140', '40', false],
      ['402', '40', false],
      ['#50 (28/2) Tex 40/2', '40/2', true],
      ['28/2', '28', false],
    ]
    for (const [texNumber, input, expected] of cases) {
      const result = await pool.query(
        `SELECT ($1::text = $2::text OR $1::text ~ ('(^|[^0-9/])' || $2::text || '($|[^0-9/])')) AS matched`,
        [texNumber, input],
      )
      assert.equal(result.rows[0].matched, expected, `${texNumber} với ${input}`)
    }
    console.log('thread-usage explain tests passed')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
