import type { SupabaseClient } from '@supabase/supabase-js'

export async function cleanupOrphans(supabase: SupabaseClient): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: rows, error: selectError } = await supabase
    .from('guide_images')
    .select('id, storage_path')
    .eq('status', 'PENDING')
    .lt('uploaded_at', cutoff)
    .limit(500)

  if (selectError) {
    console.error('cleanupOrphans: select error:', selectError)
    return { deleted: 0 }
  }

  if (!rows || rows.length === 0) {
    return { deleted: 0 }
  }

  const paths = rows.map((r: { storage_path: string }) => r.storage_path)
  const ids = rows.map((r: { id: string }) => r.id)

  const { error: storageError } = await supabase.storage
    .from('guide-images')
    .remove(paths)

  if (storageError) {
    console.error('cleanupOrphans: storage remove error:', storageError)
  }

  const { error: deleteError } = await supabase
    .from('guide_images')
    .delete()
    .in('id', ids)

  if (deleteError) {
    console.error('cleanupOrphans: delete rows error:', deleteError)
    return { deleted: 0 }
  }

  return { deleted: ids.length }
}
