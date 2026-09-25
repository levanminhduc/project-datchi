import { query } from '../db/query'

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
}
