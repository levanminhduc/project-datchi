export interface Guide {
  id: string
  title: string
  slug: string
  content: Record<string, unknown>
  content_html: string
  cover_image_url: string | null
  status: 'DRAFT' | 'PUBLISHED'
  sort_order: number
  author_id: number | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export type GuideListItem = Pick<
  Guide,
  'id' | 'title' | 'slug' | 'cover_image_url' | 'status' | 'sort_order' | 'published_at' | 'created_at' | 'author_id'
>

export interface CreateGuideData {
  title: string
  content: Record<string, unknown>
  content_html: string
  cover_image_url?: string | null
  status?: 'DRAFT' | 'PUBLISHED'
}

export interface UpdateGuideData {
  title?: string
  content?: Record<string, unknown>
  content_html?: string
  cover_image_url?: string | null
  status?: 'DRAFT' | 'PUBLISHED'
  sort_order?: number
}
