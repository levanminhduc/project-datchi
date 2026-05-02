import { createClient } from '@supabase/supabase-js'
import { existsSync } from 'fs'
import dotenv from 'dotenv'

if (existsSync('.env')) {
  dotenv.config()
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:55421'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PATH_REGEX = /\/api\/guides\/images\/(guides\/[^"'\s]+)/g

async function main() {
  console.log('=== Backfill guide_images ===')

  const { data: objects, error: storageError } = await supabase
    .from('storage.objects')
    .select('name, metadata')
    .eq('bucket_id', 'guide-images')
    .like('name', 'guides/%')
    .limit(1000)

  if (storageError) {
    console.error('Failed to list storage objects:', storageError)
    process.exit(1)
  }

  if (!objects || objects.length === 0) {
    console.log('No storage objects found in guide-images bucket under guides/.')
    return
  }

  console.log(`Found ${objects.length} storage object(s)`)

  const { data: guides, error: guidesError } = await supabase
    .from('guides')
    .select('id, content_html')
    .is('deleted_at', null)
    .limit(1000)

  if (guidesError) {
    console.error('Failed to list guides:', guidesError)
    process.exit(1)
  }

  const pathToGuideId = new Map<string, string>()
  for (const guide of guides || []) {
    if (!guide.content_html) continue
    const html = guide.content_html
    let match: RegExpExecArray | null
    PATH_REGEX.lastIndex = 0
    while ((match = PATH_REGEX.exec(html)) !== null) {
      pathToGuideId.set(match[1], guide.id)
    }
  }

  let inserted = 0
  let skipped = 0

  for (const obj of objects) {
    const storagePath = obj.name as string
    const guideId = pathToGuideId.get(storagePath) ?? null
    const fileSize = (obj.metadata as { size?: number } | null)?.size ?? null

    const { error } = await supabase.from('guide_images').insert({
      storage_path: storagePath,
      guide_id: guideId,
      file_size: fileSize,
      mime_type: 'image/webp',
      status: guideId ? 'LINKED' : 'PENDING',
      uploaded_at: guideId ? new Date().toISOString() : new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      linked_at: guideId ? new Date().toISOString() : null,
    })

    if (error) {
      if (error.code === '23505') {
        skipped++
      } else {
        console.error(`Error inserting ${storagePath}:`, error)
      }
    } else {
      inserted++
      console.log(`  [${guideId ? 'LINKED' : 'PENDING'}] ${storagePath}`)
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped (already exist): ${skipped}`)

  const { data: summary, error: summaryError } = await supabase
    .from('guide_images')
    .select('status')
    .limit(1000)

  if (!summaryError && summary) {
    const counts: Record<string, number> = {}
    for (const row of summary) {
      counts[row.status] = (counts[row.status] ?? 0) + 1
    }
    console.log('Current guide_images status distribution:', counts)
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
