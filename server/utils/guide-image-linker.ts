import type { SupabaseClient } from '@supabase/supabase-js'

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
  supabase: SupabaseClient,
  guideId: string,
  contentHtml: string | null,
): Promise<void> {
  const currentPaths = extractStoragePaths(contentHtml ?? '')

  if (currentPaths.length > 0) {
    const { error: linkError } = await supabase
      .from('guide_images')
      .update({ guide_id: guideId, status: 'LINKED', linked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .in('storage_path', currentPaths)
      .or(`guide_id.is.null,guide_id.eq.${guideId}`)

    if (linkError) {
      console.error('linkImagesToGuide: update error:', linkError)
    }
  }

  const { data: previousRows, error: selectError } = await supabase
    .from('guide_images')
    .select('id, storage_path')
    .eq('guide_id', guideId)
    .limit(200)

  if (selectError) {
    console.error('linkImagesToGuide: select removed images error:', selectError)
    return
  }

  if (!previousRows || previousRows.length === 0) return

  const currentPathsSet = new Set(currentPaths)
  const removed = previousRows.filter((r: { storage_path: string }) => !currentPathsSet.has(r.storage_path))

  if (removed.length === 0) return

  const removedPaths = removed.map((r: { storage_path: string }) => r.storage_path)
  const removedIds = removed.map((r: { id: string }) => r.id)

  const { error: storageError } = await supabase.storage
    .from('guide-images')
    .remove(removedPaths)

  if (storageError) {
    console.error('linkImagesToGuide: storage remove error:', storageError)
  }

  const { error: deleteError } = await supabase
    .from('guide_images')
    .delete()
    .in('id', removedIds)

  if (deleteError) {
    console.error('linkImagesToGuide: delete rows error:', deleteError)
  }
}
