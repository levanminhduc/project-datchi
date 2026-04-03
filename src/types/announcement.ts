export interface Announcement {
  id: number
  title: string
  content: string
  is_active: boolean
  priority: number
  created_by: number
  created_at: string
  updated_at: string
}

export interface AnnouncementWithMeta extends Announcement {
  creator_name: string | null
  dismissal_count: number
  total_employees: number
}

export interface CreateAnnouncementData {
  title: string
  content: string
  priority?: number
}

export interface UpdateAnnouncementData {
  title?: string
  content?: string
  priority?: number
}

export interface AnnouncementPagination {
  page: number
  pageSize: number
  total: number
}

export interface AnnouncementListResponse {
  data: AnnouncementWithMeta[] | null
  error: string | null
  pagination: AnnouncementPagination
}
