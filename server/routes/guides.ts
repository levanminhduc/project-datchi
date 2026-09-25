import { Hono } from 'hono'
import { query, queryOne } from '../db/query'
import { from } from '../db/sql-builder'
import { putObject, getObject } from '../storage/local-storage'
import { requirePermission } from '../middleware/auth'
import {
  CreateGuideSchema,
  UpdateGuideSchema,
  ReorderGuideSchema,
} from '../validation/guide'
import { sanitizeHtml } from '../utils/sanitize-html'
import { linkImagesToGuide } from '../utils/guide-image-linker'
import type { AppEnv } from '../types/hono-env'

function contentTypeByExt(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  return ext === 'webp' ? 'image/webp'
    : ext === 'png' ? 'image/png'
    : ext === 'gif' ? 'image/gif'
    : 'image/jpeg'
}

const guides = new Hono<AppEnv>()
const guideImages = new Hono()
const publicGuideImages = new Hono()

const PUBLIC_IMAGE_PREFIX = '/storage/v1/object/public/guide-images/'

function generateSlug(title: string): string {
  const vietnameseMap: Record<string, string> = {
    à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
    ă: 'a', ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
    â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
    è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
    ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
    ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
    ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
    ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
    ơ: 'o', ờ: 'o', ớ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
    ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
    ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
    ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
    đ: 'd',
    À: 'A', Á: 'A', Ả: 'A', Ã: 'A', Ạ: 'A',
    Ă: 'A', Ằ: 'A', Ắ: 'A', Ẳ: 'A', Ẵ: 'A', Ặ: 'A',
    Â: 'A', Ầ: 'A', Ấ: 'A', Ẩ: 'A', Ẫ: 'A', Ậ: 'A',
    È: 'E', É: 'E', Ẻ: 'E', Ẽ: 'E', Ẹ: 'E',
    Ê: 'E', Ề: 'E', Ế: 'E', Ể: 'E', Ễ: 'E', Ệ: 'E',
    Ì: 'I', Í: 'I', Ỉ: 'I', Ĩ: 'I', Ị: 'I',
    Ò: 'O', Ó: 'O', Ỏ: 'O', Õ: 'O', Ọ: 'O',
    Ô: 'O', Ồ: 'O', Ố: 'O', Ổ: 'O', Ỗ: 'O', Ộ: 'O',
    Ơ: 'O', Ờ: 'O', Ớ: 'O', Ở: 'O', Ỡ: 'O', Ợ: 'O',
    Ù: 'U', Ú: 'U', Ủ: 'U', Ũ: 'U', Ụ: 'U',
    Ư: 'U', Ừ: 'U', Ứ: 'U', Ử: 'U', Ữ: 'U', Ự: 'U',
    Ỳ: 'Y', Ý: 'Y', Ỷ: 'Y', Ỹ: 'Y', Ỵ: 'Y',
    Đ: 'D',
  }

  const normalized = title
    .split('')
    .map((char) => vietnameseMap[char] || char)
    .join('')

  const result = normalized
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)

  return result || `guide-${Date.now()}`
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const builder = from('guides')
      .select('id')
      .eq('slug', slug)
      .is('deleted_at', null)
      .limit(1)

    if (excludeId) {
      builder.neq('id', excludeId)
    }

    const data = await builder.maybeSingle<{ id: string }>()

    if (!data) return slug

    slug = `${baseSlug}-${counter}`
    counter++

    if (counter > 100) {
      slug = `${baseSlug}-${Date.now()}`
      return slug
    }
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const STORAGE_URL_PATTERN = /https?:\/\/[^/]+\/storage\/v1\/object\/public\/guide-images\//g
const RELATIVE_IMAGE_PREFIX = '/api/guides/images/'

function rewriteImageUrls(text: string | null): string | null {
  if (!text) return text
  return text.replace(STORAGE_URL_PATTERN, RELATIVE_IMAGE_PREFIX)
}

guides.post('/upload-image', requirePermission('guides.create'), async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']

    if (!(file instanceof File)) {
      return c.json({ data: null, error: 'Thiếu file ảnh' }, 400)
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ data: null, error: 'Chỉ hỗ trợ ảnh JPEG, PNG, WebP hoặc GIF' }, 400)
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return c.json({ data: null, error: 'Ảnh không được vượt quá 10MB' }, 400)
    }

    const sharp = (await import('sharp')).default
    const buffer = Buffer.from(await file.arrayBuffer())

    const processed = await sharp(buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
    const filePath = `guides/${fileName}`

    try {
      await putObject(filePath, processed, { upsert: false })
    } catch (uploadError) {
      console.error('Upload guide image error:', uploadError)
      return c.json({ data: null, error: 'Lỗi khi tải ảnh lên' }, 500)
    }

    const relativeUrl = `/api/guides/images/${filePath}`

    try {
      await query(
        `INSERT INTO guide_images (storage_path, file_size, mime_type, status)
         VALUES ($1, $2, $3, $4)`,
        [filePath, processed.length, 'image/webp', 'PENDING']
      )
    } catch (trackError) {
      console.error('Upload: insert guide_images row error:', trackError)
    }

    return c.json({ data: { url: relativeUrl }, error: null })
  } catch (err) {
    console.error('Upload image error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống khi xử lý ảnh' }, 500)
  }
})

guideImages.get('/*', async (c) => {
  try {
    const filePath = c.req.path.replace('/api/guides/images/', '')
    if (!filePath || filePath.includes('..')) {
      return c.json({ data: null, error: 'Đường dẫn không hợp lệ' }, 400)
    }

    const buffer = await getObject(filePath)

    if (!buffer) {
      return c.json({ data: null, error: 'Không tìm thấy ảnh' }, 404)
    }

    return new Response(buffer, {
      headers: {
        'Content-Type': contentTypeByExt(filePath),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    console.error('Proxy guide image error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

publicGuideImages.get('/*', async (c) => {
  try {
    const filePath = c.req.path.replace(PUBLIC_IMAGE_PREFIX, '')
    if (!filePath || filePath.includes('..')) {
      return c.body(null, 404)
    }

    const buffer = await getObject(filePath)

    if (!buffer) {
      return c.body(null, 404)
    }

    return new Response(buffer, {
      headers: {
        'Content-Type': contentTypeByExt(filePath),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    console.error('Public guide image error:', err)
    return c.body(null, 404)
  }
})

guides.get('/', async (c) => {
  try {
    const auth = c.get('auth')
    const isAdmin = auth.isRoot || auth.isAdmin
    const search = c.req.query('search')

    const conditions: string[] = ['g.deleted_at IS NULL']
    const params: unknown[] = []

    if (!isAdmin) {
      params.push('PUBLISHED')
      conditions.push(`g.status = $${params.length}`)
    }

    if (search) {
      params.push(`%${search}%`)
      conditions.push(`g.title ILIKE $${params.length}`)
    }

    params.push(200)
    const limitPlaceholder = `$${params.length}`

    let data: Record<string, unknown>[]
    try {
      data = await query<Record<string, unknown>>(
        `SELECT g.id, g.title, g.slug, g.cover_image_url, g.status, g.sort_order,
                g.published_at, g.created_at, g.updated_at, g.author_id,
                CASE WHEN e.id IS NULL THEN NULL
                     ELSE json_build_object('full_name', e.full_name) END AS employees
         FROM guides g
         LEFT JOIN employees e ON e.id = g.author_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY g.sort_order ASC, g.created_at DESC
         LIMIT ${limitPlaceholder}`,
        params
      )
    } catch (queryErr) {
      console.error('List guides error:', queryErr)
      return c.json({ data: null, error: 'Lỗi khi tải danh sách hướng dẫn' }, 500)
    }

    const mapped = (data || []).map((g: Record<string, unknown>) => {
      const emp = g.employees as { full_name: string } | null
      return {
        ...g,
        author_name: emp?.full_name || null,
        employees: undefined,
      }
    })

    return c.json({ data: mapped, error: null })
  } catch (err) {
    console.error('List guides error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

guides.patch('/:id/publish', requirePermission('guides.edit'), async (c) => {
  try {
    const id = c.req.param('id')

    const guide = await from('guides')
      .select('id, status')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<{ id: string; status: string }>()

    if (!guide) {
      return c.json({ data: null, error: 'Không tìm thấy hướng dẫn' }, 404)
    }

    const newStatus = guide.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'

    const now = new Date().toISOString()
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
    }
    if (newStatus === 'PUBLISHED') {
      updateData.published_at = now
    }

    let data: Record<string, unknown> | null
    try {
      const sets: string[] = []
      const params: unknown[] = []
      for (const [key, value] of Object.entries(updateData)) {
        params.push(value)
        sets.push(`${key} = $${params.length}`)
      }
      params.push(id)
      data = await queryOne<Record<string, unknown>>(
        `UPDATE guides SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      )
    } catch (updateErr) {
      console.error('Toggle publish error:', updateErr)
      return c.json({ data: null, error: 'Lỗi khi cập nhật trạng thái' }, 500)
    }

    const message = newStatus === 'PUBLISHED' ? 'Đã xuất bản hướng dẫn' : 'Đã chuyển về bản nháp'
    return c.json({ data, error: null, message })
  } catch (err) {
    console.error('Toggle publish error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

guides.patch('/:id/reorder', requirePermission('guides.edit'), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    const parseResult = ReorderGuideSchema.safeParse(body)
    if (!parseResult.success) {
      return c.json({ data: null, error: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ' }, 400)
    }

    const { sort_order } = parseResult.data

    let data: Record<string, unknown> | null
    try {
      data = await queryOne<Record<string, unknown>>(
        `UPDATE guides SET sort_order = $1, updated_at = $2
         WHERE id = $3 AND deleted_at IS NULL
         RETURNING *`,
        [sort_order, new Date().toISOString(), id]
      )
    } catch (updateErr) {
      console.error('Reorder guide error:', updateErr)
      return c.json({ data: null, error: 'Lỗi khi cập nhật thứ tự' }, 500)
    }

    if (!data) {
      return c.json({ data: null, error: 'Không tìm thấy hướng dẫn' }, 404)
    }

    return c.json({ data, error: null, message: 'Đã cập nhật thứ tự' })
  } catch (err) {
    console.error('Reorder guide error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

guides.get('/:slugOrId', async (c) => {
  try {
    const auth = c.get('auth')
    const isAdmin = auth.isRoot || auth.isAdmin
    const slugOrId = c.req.param('slugOrId')

    const isUuid = UUID_REGEX.test(slugOrId)

    const builder = from('guides')
      .select('*')
      .is('deleted_at', null)

    if (isUuid) {
      builder.eq('id', slugOrId)
    } else {
      builder.eq('slug', slugOrId)
    }

    const guide = await builder.maybeSingle<{
      status: string
      content_html: string | null
      content: unknown
      [key: string]: unknown
    }>()

    if (!guide) {
      return c.json({ data: null, error: 'Không tìm thấy hướng dẫn' }, 404)
    }

    if (!isAdmin && guide.status !== 'PUBLISHED') {
      return c.json({ data: null, error: 'Không tìm thấy hướng dẫn' }, 404)
    }

    const rewritten = {
      ...guide,
      content_html: rewriteImageUrls(guide.content_html),
      content: guide.content ? JSON.parse(
        rewriteImageUrls(JSON.stringify(guide.content))!
      ) : guide.content,
    }

    return c.json({ data: rewritten, error: null })
  } catch (err) {
    console.error('Get guide error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

guides.post('/', requirePermission('guides.create'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json()

    const parseResult = CreateGuideSchema.safeParse(body)
    if (!parseResult.success) {
      return c.json({ data: null, error: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ' }, 400)
    }

    const validated = parseResult.data
    const baseSlug = generateSlug(validated.title)
    const slug = await ensureUniqueSlug(baseSlug)

    const maxOrder = await from('guides')
      .select('sort_order')
      .is('deleted_at', null)
      .order({ column: 'sort_order', ascending: false })
      .limit(1)
      .maybeSingle<{ sort_order: number }>()

    const nextOrder = (maxOrder?.sort_order ?? -1) + 1

    let data: Record<string, unknown> | null
    try {
      data = await queryOne<Record<string, unknown>>(
        `INSERT INTO guides
           (title, slug, content, content_html, cover_image_url, status, sort_order, author_id, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          validated.title,
          slug,
          validated.content,
          validated.content_html ? sanitizeHtml(validated.content_html) : validated.content_html,
          validated.cover_image_url || null,
          validated.status,
          nextOrder,
          auth.employeeId,
          validated.status === 'PUBLISHED' ? new Date().toISOString() : null,
        ]
      )
    } catch (insertErr) {
      console.error('Create guide error:', insertErr)
      return c.json({ data: null, error: 'Lỗi khi tạo hướng dẫn' }, 500)
    }

    await linkImagesToGuide(data!.id as string, data!.content_html as string | null)

    return c.json({ data, error: null, message: 'Đã tạo hướng dẫn mới' }, 201)
  } catch (err) {
    console.error('Create guide error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

guides.put('/:id', requirePermission('guides.edit'), async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    const parseResult = UpdateGuideSchema.safeParse(body)
    if (!parseResult.success) {
      return c.json({ data: null, error: parseResult.error.issues[0]?.message || 'Dữ liệu không hợp lệ' }, 400)
    }

    const validated = parseResult.data

    const existing = await from('guides')
      .select('id, title, slug')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<{ id: string; title: string; slug: string }>()

    if (!existing) {
      return c.json({ data: null, error: 'Không tìm thấy hướng dẫn' }, 404)
    }

    const updateData: Record<string, unknown> = {
      ...validated,
      updated_at: new Date().toISOString(),
    }

    if (updateData.content_html && typeof updateData.content_html === 'string') {
      updateData.content_html = sanitizeHtml(updateData.content_html)
    }

    if (validated.title && validated.title !== existing.title) {
      const baseSlug = generateSlug(validated.title)
      updateData.slug = await ensureUniqueSlug(baseSlug, id)
    }

    if (validated.status === 'PUBLISHED') {
      updateData.published_at = new Date().toISOString()
    }

    let data: Record<string, unknown> | null
    try {
      const sets: string[] = []
      const params: unknown[] = []
      for (const [key, value] of Object.entries(updateData)) {
        params.push(value)
        sets.push(`${key} = $${params.length}`)
      }
      params.push(id)
      data = await queryOne<Record<string, unknown>>(
        `UPDATE guides SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
        params
      )
    } catch (updateErr) {
      console.error('Update guide error:', updateErr)
      return c.json({ data: null, error: 'Lỗi khi cập nhật hướng dẫn' }, 500)
    }

    await linkImagesToGuide(data!.id as string, data!.content_html as string | null)

    return c.json({ data, error: null, message: 'Đã cập nhật hướng dẫn' })
  } catch (err) {
    console.error('Update guide error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

guides.delete('/:id', requirePermission('guides.edit'), async (c) => {
  try {
    const id = c.req.param('id')

    let data: { id: string } | null
    try {
      data = await queryOne<{ id: string }>(
        `UPDATE guides SET deleted_at = $1
         WHERE id = $2 AND deleted_at IS NULL
         RETURNING id`,
        [new Date().toISOString(), id]
      )
    } catch (updateErr) {
      console.error('Delete guide error:', updateErr)
      return c.json({ data: null, error: 'Lỗi khi xóa hướng dẫn' }, 500)
    }

    if (!data) {
      return c.json({ data: null, error: 'Không tìm thấy hướng dẫn' }, 404)
    }

    return c.json({ data: { id: data.id }, error: null, message: 'Đã xóa hướng dẫn' })
  } catch (err) {
    console.error('Delete guide error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

export { guideImages, publicGuideImages }
export default guides
