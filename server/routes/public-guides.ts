import { Hono } from 'hono'
import { supabaseAdmin as supabase } from '../db/supabase'

const publicGuides = new Hono()

const STORAGE_URL_PATTERN = /https?:\/\/[^/]+\/storage\/v1\/object\/public\/guide-images\//g
const RELATIVE_IMAGE_PREFIX = '/api/guides/images/'

function rewriteImageUrls(text: string | null): string | null {
  if (!text) return text
  return text.replace(STORAGE_URL_PATTERN, RELATIVE_IMAGE_PREFIX)
}

publicGuides.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')

    const { data: guide, error } = await supabase
      .from('guides')
      .select('title, slug, content_html, cover_image_url, published_at, author_id, employees!author_id(full_name)')
      .eq('slug', slug)
      .eq('status', 'PUBLISHED')
      .is('deleted_at', null)
      .single()

    if (error || !guide) {
      return c.json({ data: null, error: 'Không tìm thấy bài viết' }, 404)
    }

    const emp = (guide as Record<string, unknown>).employees as { full_name: string } | null

    return c.json({
      data: {
        title: guide.title,
        slug: guide.slug,
        content_html: rewriteImageUrls(guide.content_html),
        cover_image_url: guide.cover_image_url,
        published_at: guide.published_at,
        author_name: emp?.full_name || null,
      },
      error: null,
    })
  } catch (err) {
    console.error('Public guide error:', err)
    return c.json({ data: null, error: 'Lỗi hệ thống' }, 500)
  }
})

export default publicGuides
