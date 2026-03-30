import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'
import { requirePermission, type AuthContext } from '../middleware/auth'
import {
  CreateGuideSchema,
  UpdateGuideSchema,
  ReorderGuideSchema,
} from '../validation/guide'

const guides = new Hono()

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

  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const query = supabase
      .from('guides')
      .select('id')
      .eq('slug', slug)
      .is('deleted_at', null)
      .limit(1)

    if (excludeId) {
      query.neq('id', excludeId)
    }

    const { data } = await query.maybeSingle()

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

    const { error: uploadError } = await supabase.storage
      .from('guide-images')
      .upload(filePath, processed, {
        contentType: 'image/webp',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload guide image error:', uploadError)
      return c.json({ data: null, error: 'Lỗi khi tải ảnh lên' }, 500)
    }

    const { data: publicUrlData } = supabase.storage
      .from('guide-images')
      .getPublicUrl(filePath)

    return c.json({ data: { url: publicUrlData.publicUrl }, error: null })
  } catch (err) {
    console.error('Upload image error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống khi xử lý ảnh' }, 500)
  }
})

guides.get('/', async (c) => {
  try {
    const auth = c.get('auth') as AuthContext & { permissions: string[] }
    const isAdmin = auth.isRoot || auth.isAdmin
    const search = c.req.query('search')

    let query = supabase
      .from('guides')
      .select('id, title, slug, cover_image_url, status, sort_order, created_at, updated_at, created_by')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(200)

    if (!isAdmin) {
      query = query.eq('status', 'PUBLISHED')
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('List guides error:', error)
      return c.json({ data: null, error: 'Lỗi khi tải danh sách hướng dẫn' }, 500)
    }

    return c.json({ data, error: null })
  } catch (err) {
    console.error('List guides error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

guides.patch('/:id/publish', requirePermission('guides.edit'), async (c) => {
  try {
    const id = c.req.param('id')

    const { data: guide, error: fetchError } = await supabase
      .from('guides')
      .select('id, status')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !guide) {
      return c.json({ data: null, error: 'Không tìm thấy hướng dẫn' }, 404)
    }

    const newStatus = guide.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'

    const { data, error } = await supabase
      .from('guides')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Toggle publish error:', error)
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
      return c.json({ data: null, error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ' }, 400)
    }

    const { sort_order } = parseResult.data

    const { data, error } = await supabase
      .from('guides')
      .update({ sort_order, updated_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ data: null, error: 'Không tìm thấy hướng dẫn' }, 404)
      }
      console.error('Reorder guide error:', error)
      return c.json({ data: null, error: 'Lỗi khi cập nhật thứ tự' }, 500)
    }

    return c.json({ data, error: null, message: 'Đã cập nhật thứ tự' })
  } catch (err) {
    console.error('Reorder guide error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

guides.get('/:slugOrId', async (c) => {
  try {
    const auth = c.get('auth') as AuthContext & { permissions: string[] }
    const isAdmin = auth.isRoot || auth.isAdmin
    const slugOrId = c.req.param('slugOrId')

    const isUuid = UUID_REGEX.test(slugOrId)

    let query = supabase
      .from('guides')
      .select('*')
      .is('deleted_at', null)

    if (isUuid) {
      query = query.eq('id', slugOrId)
    } else {
      query = query.eq('slug', slugOrId)
    }

    const { data: guide, error } = await query.single()

    if (error || !guide) {
      return c.json({ data: null, error: 'Không tìm thấy hướng dẫn' }, 404)
    }

    if (!isAdmin && guide.status !== 'PUBLISHED') {
      return c.json({ data: null, error: 'Không tìm thấy hướng dẫn' }, 404)
    }

    return c.json({ data: guide, error: null })
  } catch (err) {
    console.error('Get guide error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

guides.post('/', requirePermission('guides.create'), async (c) => {
  try {
    const auth = c.get('auth') as AuthContext & { permissions: string[] }
    const body = await c.req.json()

    const parseResult = CreateGuideSchema.safeParse(body)
    if (!parseResult.success) {
      return c.json({ data: null, error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ' }, 400)
    }

    const validated = parseResult.data
    const baseSlug = generateSlug(validated.title)
    const slug = await ensureUniqueSlug(baseSlug)

    const { data: maxOrder } = await supabase
      .from('guides')
      .select('sort_order')
      .is('deleted_at', null)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextOrder = (maxOrder?.sort_order ?? -1) + 1

    const { data, error } = await supabase
      .from('guides')
      .insert({
        title: validated.title,
        slug,
        content: validated.content,
        content_html: validated.content_html,
        cover_image_url: validated.cover_image_url || null,
        status: validated.status,
        sort_order: nextOrder,
        created_by: auth.employeeId,
      })
      .select()
      .single()

    if (error) {
      console.error('Create guide error:', error)
      return c.json({ data: null, error: 'Lỗi khi tạo hướng dẫn' }, 500)
    }

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
      return c.json({ data: null, error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ' }, 400)
    }

    const validated = parseResult.data

    const { data: existing, error: fetchError } = await supabase
      .from('guides')
      .select('id, title, slug')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existing) {
      return c.json({ data: null, error: 'Không tìm thấy hướng dẫn' }, 404)
    }

    const updateData: Record<string, unknown> = {
      ...validated,
      updated_at: new Date().toISOString(),
    }

    if (validated.title && validated.title !== existing.title) {
      const baseSlug = generateSlug(validated.title)
      updateData.slug = await ensureUniqueSlug(baseSlug, id)
    }

    const { data, error } = await supabase
      .from('guides')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update guide error:', error)
      return c.json({ data: null, error: 'Lỗi khi cập nhật hướng dẫn' }, 500)
    }

    return c.json({ data, error: null, message: 'Đã cập nhật hướng dẫn' })
  } catch (err) {
    console.error('Update guide error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

guides.delete('/:id', requirePermission('guides.edit'), async (c) => {
  try {
    const id = c.req.param('id')

    const { data, error } = await supabase
      .from('guides')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .single()

    if (error || !data) {
      if (error?.code === 'PGRST116' || !data) {
        return c.json({ data: null, error: 'Không tìm thấy hướng dẫn' }, 404)
      }
      console.error('Delete guide error:', error)
      return c.json({ data: null, error: 'Lỗi khi xóa hướng dẫn' }, 500)
    }

    return c.json({ data: { id: data.id }, error: null, message: 'Đã xóa hướng dẫn' })
  } catch (err) {
    console.error('Delete guide error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

export default guides
