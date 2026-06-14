import { Hono } from 'hono'
import { queryOne } from '../db/query'

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

    const guide = await queryOne<{
      title: string
      slug: string
      content_html: string | null
      cover_image_url: string | null
      published_at: string | null
      author_id: number | null
      employees: { full_name: string } | null
    }>(
      `SELECT
         g.title,
         g.slug,
         g.content_html,
         g.cover_image_url,
         g.published_at,
         g.author_id,
         CASE WHEN e.id IS NULL THEN NULL
              ELSE json_build_object('full_name', e.full_name) END AS employees
       FROM guides g
       LEFT JOIN employees e ON e.id = g.author_id
       WHERE g.slug = $1
         AND g.status = 'PUBLISHED'
         AND g.deleted_at IS NULL`,
      [slug]
    )

    if (!guide) {
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
