import { query } from '../db/query'
import { removeObjects } from '../storage/local-storage'

export async function cleanupOrphans(): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  let rows: { id: string; storage_path: string }[]
  try {
    rows = await query<{ id: string; storage_path: string }>(
      `SELECT gi.id, gi.storage_path
       FROM guide_images gi
       WHERE gi.status = 'PENDING'
         AND gi.uploaded_at < $1
         AND NOT EXISTS (
           SELECT 1 FROM guides g
           WHERE strpos(g.content_html, gi.storage_path) > 0
         )
       LIMIT 500`,
      [cutoff]
    )
  } catch (selectError) {
    console.error('cleanupOrphans: select error:', selectError)
    return { deleted: 0 }
  }

  if (!rows || rows.length === 0) {
    return { deleted: 0 }
  }

  const paths = rows.map((r: { storage_path: string }) => r.storage_path)
  const ids = rows.map((r: { id: string }) => r.id)

  try {
    await removeObjects(paths)
  } catch (storageError) {
    console.error('cleanupOrphans: storage remove error:', storageError)
  }

  try {
    await query(
      `DELETE FROM guide_images WHERE id = ANY($1)`,
      [ids]
    )
  } catch (deleteError) {
    console.error('cleanupOrphans: delete rows error:', deleteError)
    return { deleted: 0 }
  }

  return { deleted: ids.length }
}
