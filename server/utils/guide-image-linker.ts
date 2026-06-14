import { query } from '../db/query'
import { from } from '../db/sql-builder'
import { removeObjects } from '../storage/local-storage'

export interface GuideImage {
  id: string
  guide_id: string | null
  storage_path: string
  file_size: number | null
  mime_type: string | null
  status: 'PENDING' | 'LINKED'
  uploaded_at: string
  linked_at: string | null
}

const STORAGE_PATH_REGEX = /\/api\/guides\/images\/(guides\/[^"'\s]+)/g

export function extractStoragePaths(contentHtml: string): string[] {
  const paths: string[] = []
  let match: RegExpExecArray | null
  STORAGE_PATH_REGEX.lastIndex = 0
  while ((match = STORAGE_PATH_REGEX.exec(contentHtml)) !== null) {
    paths.push(match[1])
  }
  return paths
}

export async function linkImagesToGuide(
  guideId: string,
  contentHtml: string | null,
): Promise<void> {
  const currentPaths = extractStoragePaths(contentHtml ?? '')

  if (currentPaths.length > 0) {
    try {
      const now = new Date().toISOString()
      await query(
        `UPDATE guide_images
         SET guide_id = $1, status = 'LINKED', linked_at = $2, updated_at = $3
         WHERE storage_path = ANY($4)
           AND (guide_id IS NULL OR guide_id = $1)`,
        [guideId, now, now, currentPaths]
      )
    } catch (linkError) {
      console.error('linkImagesToGuide: update error:', linkError)
    }
  }

  let previousRows: { id: string; storage_path: string }[]
  try {
    previousRows = await from('guide_images')
      .select('id, storage_path')
      .eq('guide_id', guideId)
      .limit(200)
      .list<{ id: string; storage_path: string }>()
  } catch (selectError) {
    console.error('linkImagesToGuide: select removed images error:', selectError)
    return
  }

  if (!previousRows || previousRows.length === 0) return

  const currentPathsSet = new Set(currentPaths)
  const removed = previousRows.filter((r: { storage_path: string }) => !currentPathsSet.has(r.storage_path))

  if (removed.length === 0) return

  const removedPaths = removed.map((r: { storage_path: string }) => r.storage_path)
  const removedIds = removed.map((r: { id: string }) => r.id)

  try {
    await removeObjects(removedPaths)
  } catch (storageError) {
    console.error('linkImagesToGuide: storage remove error:', storageError)
  }

  try {
    await query(
      `DELETE FROM guide_images WHERE id = ANY($1)`,
      [removedIds]
    )
  } catch (deleteError) {
    console.error('linkImagesToGuide: delete rows error:', deleteError)
  }
}
